import os
import sys
import subprocess
import argparse
import time
import yaml
import copy
import nycdb.dataset
from nycdb.utility import list_wrap
from urllib.parse import urlparse
from typing import Literal, NamedTuple, Any, Tuple, Dict, List
from pathlib import Path

from portfoliograph.table import (
    export_portfolios_table_json,
    populate_portfolios_table,
)
from ocaevictions.table import OcaConfig, populate_oca_tables

try:
    from dotenv import load_dotenv

    load_dotenv()
    dotenv_loaded = False
except ModuleNotFoundError:
    dotenv_loaded = False


ROOT_DIR = Path(__file__).parent.resolve()
SQL_DIR = ROOT_DIR / "sql"
WOW_YML = yaml.full_load((ROOT_DIR / "who-owns-what.yml").read_text())
TESTS_DIR = ROOT_DIR / "tests"

# Just an alias for our database connection.
DbConnection = Any


class DbContext(NamedTuple):
    host: str
    database: str
    user: str
    password: str
    port: int

    @staticmethod
    def from_url(url: str) -> "DbContext":
        parsed = urlparse(url)
        if parsed.scheme != "postgres":
            raise ValueError("Database URL schema must be postgres")
        if parsed.username is None:
            raise ValueError("Database URL must have a username")
        if parsed.password is None:
            # We might support password-less logins someday, but
            # not right now.
            raise ValueError("Database URL must have a password")
        if parsed.hostname is None:
            raise ValueError("Database URL must have a hostname")
        database = parsed.path[1:]
        if not database:
            raise ValueError("Database URL must have a database name")
        port = parsed.port or 5432
        return DbContext(
            host=parsed.hostname,
            database=database,
            user=parsed.username,
            password=parsed.password,
            port=port,
        )

    def psycopg2_connect_kwargs(self) -> Dict[str, Any]:
        return dict(
            user=self.user,
            password=self.password,
            host=self.host,
            database=self.database,
            port=self.port,
        )

    def connection(self) -> DbConnection:
        import psycopg2

        tries_left = 5
        secs_between_tries = 2

        def connect():
            return psycopg2.connect(**self.psycopg2_connect_kwargs())

        while tries_left > 1:
            try:
                return connect()
            except psycopg2.OperationalError:
                print("Failed to connect to db, retrying...")
                time.sleep(secs_between_tries)
                tries_left -= 1
        return connect()

    def get_pg_env_and_args(self) -> Tuple[Dict[str, str], List[str]]:
        """
        Return an environment dictionary and command-line arguments that
        can be passed to Postgres command-line tools (e.g. psql, pg_dump) to
        connect to the database.
        """

        env = os.environ.copy()
        env["PGPASSWORD"] = db.password
        args = ["-h", db.host, "-p", str(db.port), "-U", db.user, "-d", db.database]
        return (env, args)


class NycDbBuilder:
    db: DbContext
    conn: DbConnection
    data_dir: Path
    oca_config: OcaConfig
    is_testing: bool

    def __init__(self, db: DbContext, oca_config: OcaConfig, is_testing: bool) -> None:
        self.db = db
        self.oca_config = oca_config
        self.is_testing = is_testing

        if is_testing:
            data_dir = ROOT_DIR / "tests" / "data"
        else:
            data_dir = ROOT_DIR / "nycdb" / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir = data_dir

        self.conn = db.connection()

        with self.conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS POSTGIS;")

    def call_nycdb(self, *args: str) -> None:
        db = self.db
        subprocess.check_call(
            [
                "nycdb",
                *args,
                "-H",
                db.host,
                "-U",
                db.user,
                "-P",
                db.password,
                "-D",
                db.database,
                "--port",
                str(db.port),
                "--root-dir",
                str(self.data_dir),
            ]
        )

    def do_tables_exist(self, *names: str) -> bool:
        with self.conn:
            for name in names:
                with self.conn.cursor() as cursor:
                    cursor.execute(f"SELECT to_regclass('public.{name}')")
                    if cursor.fetchone()[0] is None:
                        return False
        return True

    def drop_tables(self, *names: str) -> None:
        with self.conn:
            for name in names:
                with self.conn.cursor() as cursor:
                    cursor.execute(f"DROP TABLE IF EXISTS {name}")

    def delete_downloaded_data(self, *tables: str) -> None:
        if self.is_testing:
            # We don't want to delete data from the testing fixture dir,
            # so do nothing.
            return
        for tablename in tables:
            csv_file = self.data_dir / f"{tablename}.csv"
            if csv_file.exists():
                print(f"Removing {csv_file.name} so it can be re-downloaded.")
                csv_file.unlink()

    def ensure_dataset(self, name: str, force_refresh: bool = False) -> None:
        dataset = nycdb.dataset.datasets()[name]
        tables: List[str] = (
            [schema["table_name"] for schema in list_wrap(dataset["schema"])]
            if "schema" in dataset
            else []
        )
        tables_str = "table" if len(tables) == 1 else "tables"
        print(
            f"Ensuring NYCDB dataset '{name}' is loaded with {len(tables)} {tables_str}..."
        )

        if force_refresh:
            self.drop_tables(*tables)
            self.delete_downloaded_data(*tables)
        if not tables or not self.do_tables_exist(*tables):
            print(f"Table {name} not found in the database. Downloading...")
            self.call_nycdb("--download", name)
            print(f"Loading {name} into the database...")
            self.call_nycdb("--load", name)
        elif not self.is_testing:
            print(f"Table {name} already exists. Verifying row count...")
            self.call_nycdb("--verify", name)

    def run_sql_file(self, sqlpath: Path) -> None:
        sql = sqlpath.read_text()
        with self.conn:
            with self.conn.cursor() as cursor:
                cursor.execute(sql)

    def build(self, force_refresh: bool) -> None:
        if self.is_testing:
            print("Loading the database with test data.")
        else:
            print("Loading the database with real data (this could take a while).")

        for dataset in get_dataset_dependencies(for_api=True):
            self.ensure_dataset(dataset, force_refresh=force_refresh)

        with self.conn.cursor() as cur:
            populate_oca_tables(cur, self.oca_config)

        for sqlpath in get_sqlfile_paths("pre"):
            print(f"Running {sqlpath.name}...")
            self.run_sql_file(sqlpath)

        with self.conn:
            populate_portfolios_table(self.conn)

        for sqlpath in get_sqlfile_paths("post"):
            print(f"Running {sqlpath.name}...")
            self.run_sql_file(sqlpath)


def get_dataset_dependencies(for_api: bool) -> List[str]:
    result = WOW_YML["dependencies"]
    if for_api:
        result += WOW_YML["api_dependencies"]
    return result


def get_sqlfile_paths(type: Literal["pre", "post", "all"]) -> List[Path]:
    pre_sql = [SQL_DIR / sqlfile for sqlfile in WOW_YML["wow_pre_sql"]]
    post_sql = [SQL_DIR / sqlfile for sqlfile in WOW_YML["wow_post_sql"]]
    if type == "pre":
        return pre_sql
    elif type == "post":
        return post_sql
    else:
        return pre_sql + post_sql


def dbshell(db: DbContext):
    env, args = db.get_pg_env_and_args()
    retval = subprocess.call(["psql", *args], env=env)
    sys.exit(retval)


def loadtestdata(db: DbContext, oca_config: OcaConfig):
    """
    Loads test data previously created from the 'exporttestdata' command into
    the database.
    """

    oca_config_testing = copy.deepcopy(oca_config)
    oca_config_testing.is_testing = True

    sqlfile = ROOT_DIR / "tests" / "exported_test_data.sql"
    sql = sqlfile.read_text()

    NycDbBuilder(db, oca_config_testing, is_testing=True).build(force_refresh=False)

    print(f"Loading test data from {sqlfile}...")
    with db.connection() as conn:
        cur = conn.cursor()
        cur.execute(sql)
    print("Loaded test data into database.")


def export_table_subset(db: DbContext, table_name: str, query: str) -> str:
    """
    Returns SQL INSERT statements that will populate the given table
    with *only* the rows specified by the given query.
    """

    temp_table_name = f"temp_table_for_export_as_{table_name}"

    with db.connection() as conn:
        cur = conn.cursor()
        cur.execute(f"DROP TABLE IF EXISTS {temp_table_name}")
        cur.execute(f"CREATE TABLE {temp_table_name} AS {query}")

    try:
        env, args = db.get_pg_env_and_args()
        sql = (
            subprocess.check_output(
                [
                    "pg_dump",
                    *args,
                    "--table",
                    temp_table_name,
                    "--data-only",
                    "--column-inserts",
                ],
                env=env,
            )
            .decode("ascii")
            .replace(temp_table_name, table_name)
            .replace("wow.", "public.")
        )
        return f"DELETE FROM public.{table_name};\n\n{sql}"
    finally:
        with db.connection() as conn:
            cur = conn.cursor()
            cur.execute(f"DROP TABLE {temp_table_name}")


def exporttestdata(db: DbContext):
    """
    This command must be run on a fully populated database, but the SQL
    it generates can be useful for test suites and developers who want to
    work on WoW without first processing lots of data.
    """

    # This is the BBL of 654 PARK PLACE, BROOKLYN, which is an
    # All Year Management property.
    bbl = "3012380016"

    with db.connection() as conn:
        cur = conn.cursor()
        # Get the registration ID for the BBL we care about.
        cur.execute(
            f"SELECT DISTINCT registrationid FROM wow_bldgs WHERE bbl = '{bbl}'"
        )
        reg_id = cur.fetchone()[0]

    # Some additional data for wow_portfolios is added manually
    with open(TESTS_DIR / "manual_test_data.sql") as f:
        extra_sql = f.read()

    sql = "\n".join(
        [
            export_table_subset(
                db,
                "hpd_business_addresses",
                # This grabs only the subset of HPD business addresses
                # used by get_regids_from_regid_by_bisaddr() for the
                # registration ID we care about.
                f"SELECT * FROM hpd_business_addresses WHERE {reg_id} = any(uniqregids)",
            ),
            export_table_subset(
                db,
                "hpd_contacts",
                # This grabs only the subset of HPD contacts
                # used by get_regids_from_regid_by_owners() for the
                # registration ID we care about.
                f"SELECT * FROM hpd_contacts WHERE registrationid = {reg_id}",
            ),
            export_table_subset(
                db,
                "wow_bldgs",
                # TODO: This is basically a copy-paste of the body of the
                # get_assoc_addrs_from_bbl() function defined in
                # search_function.sql. It would be nice if we could just
                # reuse that code instead of duplicating it here.
                f"""
            SELECT bldgs.* FROM wow_bldgs AS bldgs
            INNER JOIN (
                (SELECT DISTINCT registrationid FROM wow_bldgs r WHERE r.bbl = '{bbl}') userreg
                LEFT JOIN LATERAL
                (
                SELECT
                    unnest(anyarray_uniq(array_cat_agg(merged.uniqregids))) AS regid
                FROM (
                    SELECT uniqregids FROM get_regids_from_regid_by_bisaddr(userreg.registrationid)
                    UNION SELECT uniqregids FROM get_regids_from_regid_by_owners(
                        userreg.registrationid)
                ) AS merged
                ) merged2 ON true
            ) assocregids ON (bldgs.registrationid = assocregids.regid)
            """,
            ),
            extra_sql,
        ]
    )

    print(sql)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    parser.add_argument(
        "-u",
        "--database-url",
        help="Set database URL. Defaults to the DATABASE_URL env variable.",
        default=os.environ.get("DATABASE_URL", ""),
    )
    parser.add_argument(
        "--oca_s3_bucket",
        help="S3 bucket for OCA files. Defaults to OCA_S3_BUCKET environment variable.",
        default=os.environ.get("OCA_S3_BUCKET", ""),
    )
    parser.add_argument(
        "--aws_access_key",
        help="AWS Key for OCA S3 files. Defaults to AWS_ACCESS_KEY environment variable.",
        default=os.environ.get("AWS_ACCESS_KEY", ""),
    )
    parser.add_argument(
        "--aws_secret_key",
        help="AWS Secret for OCA S3 files. Defaults to AWS_SECRET_KEY environment variable.",
        default=os.environ.get("AWS_SECRET_KEY", ""),
    )

    parser_exportgraph = subparsers.add_parser("exportgraph")
    parser_exportgraph.set_defaults(cmd="exportgraph")
    parser_exportgraph.add_argument(
        "-o", "--outfile", help="JSON filename to export to.", default="portfolios.json"
    )

    parser_exporttestdata = subparsers.add_parser("exporttestdata")
    parser_exporttestdata.set_defaults(cmd="exporttestdata")

    parser_loadtestdata = subparsers.add_parser("loadtestdata")
    parser_loadtestdata.set_defaults(cmd="loadtestdata")

    parser_builddb = subparsers.add_parser("builddb")
    parser_builddb.add_argument(
        "--update",
        action="store_true",
        help=(
            "Delete downloaded data & tables for the "
            "data sets so they can be re-downloaded and re-installed."
        ),
    )
    parser_builddb.set_defaults(cmd="builddb")

    parser_dbshell = subparsers.add_parser("dbshell")
    parser_dbshell.set_defaults(cmd="dbshell")

    args = parser.parse_args()

    database_url: str = args.database_url

    if not database_url:
        print(
            "Please define DATABASE_URL in the environment or pass one in\n"
            "via the --database-url option."
        )
        if dotenv_loaded:
            print("You can also define it in a .env file.")
        else:
            print(
                'If you run "pip install dotenv", you can also define it '
                "in a .env file."
            )
        sys.exit(1)

    if not all([args.oca_s3_bucket, args.aws_access_key, args.aws_secret_key]):
        print(
            "AWS Access Keys and S3 Bucket name for private OCAfiles are missing.\n"
            "The WOW database will still be built but eviction filings data will be missing.\n"
            "If you have access to the OCA S3, please define the \n"
            "variables in the environment or pass them in via the options:\n"
            "--oca_s3_bucket, --aws_access_key, --aws_secret_key"
        )
        if dotenv_loaded:
            print("You can also define them in a .env file.")
        else:
            print(
                'If you run "pip install dotenv", you can also define them '
                "in a .env file."
            )
        sys.exit(1)

    db = DbContext.from_url(args.database_url)

    cmd = getattr(args, "cmd", "")

    if cmd in ["loadtestdata", "builddb"]:

        oca_config = OcaConfig(
            sql_pre_files=WOW_YML["oca_pre_sql"],
            sql_post_files=WOW_YML["oca_post_sql"],
            data_dir=ROOT_DIR / "nycdb" / "data",
            test_dir=ROOT_DIR / "tests" / "data",
            sql_dir=SQL_DIR,
            aws_key=args.aws_access_key,
            aws_secret=args.aws_secret_key,
            s3_bucket=args.oca_s3_bucket,
            s3_objects=WOW_YML["oca_s3_objects"],
            is_testing=True if cmd == "loadtestdata" else False,
        )

    if cmd == "exporttestdata":
        exporttestdata(db)
    elif cmd == "loadtestdata":
        loadtestdata(db, oca_config)
    elif cmd == "dbshell":
        dbshell(db)
    elif cmd == "builddb":
        NycDbBuilder(db, oca_config, is_testing=False).build(force_refresh=args.update)
    elif cmd == "exportgraph":
        with open(args.outfile, "w") as f:
            with db.connection() as conn:
                export_portfolios_table_json(conn, f)
        print(f"Wrote portfolio graph to {args.outfile}.")
    else:
        parser.print_help()
        sys.exit(1)
