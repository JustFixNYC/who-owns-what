import os
import sys
import subprocess
import argparse
import time
from urllib.parse import urlparse
from typing import NamedTuple, Any, Tuple, Optional
from pathlib import Path
from types import SimpleNamespace

try:
    from dotenv import load_dotenv
    load_dotenv()
    dotenv_loaded = False
except ModuleNotFoundError:
    dotenv_loaded = False


ROOT_DIR = Path(__file__).parent.resolve()
SQL_DIR = ROOT_DIR / 'sql'

# Just an alias for our database connection.
DbConnection = Any


class DbContext(NamedTuple):
    host: str
    database: str
    user: str
    password: str
    port: int

    @staticmethod
    def from_url(url: str) -> 'DbContext':
        parsed = urlparse(url)
        if parsed.scheme != 'postgres':
            raise ValueError('Database URL schema must be postgres')
        if parsed.username is None:
            raise ValueError('Database URL must have a username')
        if parsed.password is None:
            # We might support password-less logins someday, but
            # not right now.
            raise ValueError('Database URL must have a password')
        if parsed.hostname is None:
            raise ValueError('Database URL must have a hostname')
        database = parsed.path[1:]
        if not database:
            raise ValueError('Database URL must have a database name')
        port = parsed.port or 5432
        return DbContext(
            host=parsed.hostname,
            database=database,
            user=parsed.username,
            password=parsed.password,
            port=port
        )

    def connection(self) -> DbConnection:
        import psycopg2

        tries_left = 5
        secs_between_tries = 2

        connect = lambda: psycopg2.connect(
            user=self.user,
            password=self.password,
            host=self.host,
            database=self.database,
            port=self.port
        )

        while tries_left > 1:
            try:
                return connect()
            except psycopg2.OperationalError as e:
                print("Failed to connect to db, retrying...")
                time.sleep(secs_between_tries)
                tries_left -= 1
        return connect()


class NycDbBuilder:
    db: DbContext
    conn: DbConnection
    data_dir: Path
    is_testing: bool

    def __init__(self, db: DbContext, is_testing: bool) -> None:
        self.db = db
        self.is_testing = is_testing

        if is_testing:
            data_dir = ROOT_DIR / 'tests' / 'data'
        else:
            data_dir = ROOT_DIR / 'nycdb' / 'data'
        data_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir = data_dir

        self.conn = db.connection()

    def call_nycdb(self, *args: str) -> None:
        db = self.db
        subprocess.check_call(
            ['nycdb', *args, '-H', db.host, '-U', db.user, '-P', db.password,
             '-D', db.database, '--port', str(db.port),
             '--root-dir', str(self.data_dir)]
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

    def ensure_dataset(self, name: str, force_refresh: bool=False,
                       extra_tables: Optional[Tuple[str]]=None) -> None:
        tables = [name, *(extra_tables or ())]
        if force_refresh:
            self.drop_tables(*tables)
            self.delete_downloaded_data(*tables)
        if not self.do_tables_exist(*tables):
            print(f"Table {name} not found in the database. Downloading...")
            self.call_nycdb('--download', name)
            print(f"Loading {name} into the database...")
            self.call_nycdb('--load', name)
        elif not self.is_testing:
            print(f"Table {name} already exists. Verifying row count...")
            self.call_nycdb('--verify', name)

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

        self.ensure_dataset('pluto_17v1')
        self.ensure_dataset('pluto_18v1')
        self.ensure_dataset('rentstab_summary')
        self.ensure_dataset('marshal_evictions_17', force_refresh=force_refresh)
        self.ensure_dataset('hpd_registrations', force_refresh=force_refresh,
                            extra_tables=('hpd_contacts',))

        print("Running custom SQL for HPD registrations...")
        self.run_sql_file(SQL_DIR / 'registrations_with_contacts.sql')

        self.ensure_dataset('hpd_violations', force_refresh=force_refresh)

        WOW_SCRIPTS = [
            ("Creating WoW buildings table...", "create_bldgs_table.sql"),
            ("Adding helper functions...", "helper_functions.sql"),
            ("Creating WoW search function...", "search_function.sql"),
            ("Creating WoW agg function...", "agg_function.sql"),
            ("Creating hpd landlord contact table...", "landlord_contact.sql"),
        ]

        for desc, filename in WOW_SCRIPTS:
            print(desc)
            self.run_sql_file(SQL_DIR / filename)


def dbshell(db: DbContext):
    env = os.environ.copy()
    env['PGPASSWORD'] = db.password
    retval = subprocess.call([
        'psql', '-h', db.host, '-p', str(db.port), '-U', db.user, '-d', db.database
    ], env=env)
    sys.exit(retval)


def exporttestdata(db: DbContext):
    '''
    This command must be run on a fully populated database, but the SQL
    it generates can be useful for test suites and developers who want to
    work on WoW without first processing lots of data.
    '''

    wow_table_name = 'wow_bldgs'
    temp_table_name = 'temp_wow_bldgs_data_to_export'

    # This is the business address for E&M Associates, reported in the
    # New York Times as a prime example of a landlord who engages in
    # aggresive eviction strategies to displace low-income tenants.
    addr = '1465A FLATBUSH AVENUE 11210'

    create_sql = (
        f"create table {temp_table_name} as "
        f"select * from {wow_table_name} where '{addr}' = Any(businessaddrs)"
    )
    drop_sql = f"drop table {temp_table_name}"

    with db.connection() as conn:
        cur = conn.cursor()
        cur.execute(create_sql)

    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = db.password
        output = subprocess.check_output([
            'pg_dump',
            '-h', db.host, '-p', str(db.port), '-U', db.user, '-d', db.database,
            '--table', temp_table_name,
            '--data-only',
            '--column-inserts',
        ], env=env).decode('ascii').replace(temp_table_name, wow_table_name)
        print(output)
    finally:
        with db.connection() as conn:
            cur = conn.cursor()
            cur.execute(drop_sql)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    parser.add_argument(
        '-u', '--database-url',
        help='Set database URL. Defaults to the DATABASE_URL environment variable.',
        default=os.environ.get('DATABASE_URL', '')
    )

    parser_exporttestdata = subparsers.add_parser('exporttestdata')
    parser_exporttestdata.set_defaults(cmd='exporttestdata')

    parser_builddb = subparsers.add_parser('builddb')
    parser_builddb.add_argument(
        '-t', '--use-test-data', action='store_true',
        help=('Load the database with a small amount of test data, '
              'instead of downloading & installing the full data sets.')
    )
    parser_builddb.add_argument(
        '--update', action='store_true',
        help=('Delete downloaded data & tables for the most frequently-updated '
              'data sets so they can be re-downloaded and re-installed.')
    )
    parser_builddb.set_defaults(cmd='builddb')

    parser_dbshell = subparsers.add_parser('dbshell')
    parser_dbshell.set_defaults(cmd='dbshell')

    args = parser.parse_args()

    database_url: str = args.database_url

    if not database_url:
        print(
            'Please define DATABASE_URL in the environment or pass one in\n'
            'via the --database-url option.'
        )
        if dotenv_loaded:
            print('You can also define it in a .env file.')
        else:
            print('If you run "pip install dotenv", you can also define it '
                  'in a .env file.')
        sys.exit(1)

    db = DbContext.from_url(args.database_url)

    cmd = getattr(args, 'cmd', '')

    if cmd == 'exporttestdata':
        exporttestdata(db)
    elif cmd == 'dbshell':
        dbshell(db)
    elif cmd == 'builddb':
        NycDbBuilder(db, is_testing=args.use_test_data).build(
            force_refresh=args.update)
    else:
        parser.print_help()
        sys.exit(1)
