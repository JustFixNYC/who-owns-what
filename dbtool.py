import os
import sys
import subprocess
import argparse
from urllib.parse import urlparse
from typing import NamedTuple, Any
from pathlib import Path
from types import SimpleNamespace

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

        return psycopg2.connect(
            user=self.user,
            password=self.password,
            host=self.host,
            database=self.database,
            port=self.port
        )


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

    def does_table_exist(self, name: str) -> bool:
        with self.conn:
            with self.conn.cursor() as cursor:
                cursor.execute(f"SELECT to_regclass('public.{name}')")
                return cursor.fetchone()[0] is not None

    def ensure_dataset(self, name: str, force_refresh=False) -> None:
        if force_refresh and not self.is_testing:
            # TODO: Drop the table(s).
            # TODO: Delete the CSV file(s) if they exist.
            raise NotImplementedError('TODO Implement this!')
        if not self.does_table_exist(name):
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

    def build(self) -> None:
        if self.is_testing:
            print("Loading the database with test data.")
        else:
            print("Loading the database with real data (this could take a while).")

        self.ensure_dataset('pluto_17v1')
        self.ensure_dataset('pluto_18v1')
        self.ensure_dataset('rentstab_summary')
        self.ensure_dataset('marshal_evictions_17')
        self.ensure_dataset('hpd_registrations', force_refresh=True)

        print("Running custom SQL for HPD registrations...")
        self.run_sql_file(SQL_DIR / 'registrations_with_contacts.sql')

        self.ensure_dataset('hpd_violations', force_refresh=True)

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


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    parser.add_argument(
        '-u', '--database-url',
        help='Set database URL. Defaults to the DATABASE_URL environment variable.',
        default=os.environ.get('DATABASE_URL', '')
    )

    parser_builddb = subparsers.add_parser('builddb')
    parser_builddb.add_argument(
        '-t', '--use-test-data', action='store_true',
        help='Load the database with a small amount of test data.')
    parser_builddb.set_defaults(cmd='builddb')

    parser_dbshell = subparsers.add_parser('dbshell')
    parser_dbshell.set_defaults(cmd='dbshell')

    args = parser.parse_args()

    database_url: str = args.database_url

    if not database_url:
        print(
            'Please define DATABASE_URL in the environment or pass one in '
            'via the --database-url option.'
        )
        sys.exit(1)

    db = DbContext.from_url(args.database_url)

    cmd = getattr(args, 'cmd', '')

    if cmd == 'dbshell':
        dbshell(db)
    elif cmd == 'builddb':
        NycDbBuilder(db, is_testing=args.use_test_data).build()
    else:
        parser.print_help()
        sys.exit(1)
