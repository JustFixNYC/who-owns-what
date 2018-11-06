import psycopg2
import os
import sys
import subprocess
import argparse
from pathlib import Path
from types import SimpleNamespace

IS_TESTING = True

ROOT_DIR = Path(__file__).parent.resolve()
SQL_DIR = ROOT_DIR / 'sql'

DB_HOST = os.environ.get('DB_HOST', 'db')
DB_DATABASE = os.environ.get('DB_DATABASE', 'wow')
DB_USER = os.environ.get('DB_USER', 'wow')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'wow')
DB_PORT = os.environ.get('DB_PORT', '5432')

if IS_TESTING:
    DATA_DIR = ROOT_DIR / 'tests' / 'data'
else:
    DATA_DIR = ROOT_DIR / 'nycdb' / 'data'


DATA_DIR.mkdir(parents=True, exist_ok=True)


def call_nycdb(*args):
    subprocess.check_call(
        ['nycdb', *args, '-H', DB_HOST, '-U', DB_USER, '-P', DB_PASSWORD,
         '-D', DB_DATABASE, '--port', DB_PORT, '--root-dir', str(DATA_DIR)]
    )


def connection():
    return psycopg2.connect(
        user=DB_USER, password=DB_PASSWORD, host=DB_HOST, database=DB_DATABASE, port=DB_PORT)


def does_table_exist(conn, name):
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT to_regclass('public.{name}')")
            return cursor.fetchone()[0] is not None


def ensure_dataset(conn, name, force_refresh=False):
    if force_refresh and not IS_TESTING:
        # TODO: Drop the table(s).
        # TODO: Delete the CSV file(s) if they exist.
        raise NotImplementedError('TODO Implement this!')
    if not does_table_exist(conn, name):
        print(f"Table {name} not found in the database. Downloading...")
        call_nycdb('--download', name)
        print(f"Loading {name} into the database...")
        call_nycdb('--load', name)
    elif not IS_TESTING:
        print(f"Table {name} already exists. Verifying row count...")
        call_nycdb('--verify', name)


def run_sql_file(conn, sqlpath):
    sql = sqlpath.read_text()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(sql)


def builddb(args) -> None:
    global IS_TESTING

    IS_TESTING = args.use_test_data

    if IS_TESTING:
        print("Loading the database with test data.")
    else:
        print("Loading the database with real data (this could take a while).")

    conn = connection()

    ensure_dataset(conn, 'pluto_17v1')
    ensure_dataset(conn, 'pluto_18v1')
    ensure_dataset(conn, 'rentstab_summary')
    ensure_dataset(conn, 'marshal_evictions_17')
    ensure_dataset(conn, 'hpd_registrations', force_refresh=True)

    print("Running custom SQL for HPD registrations...")
    run_sql_file(conn, SQL_DIR / 'registrations_with_contacts.sql')

    ensure_dataset(conn, 'hpd_violations', force_refresh=True)

    WOW_SCRIPTS = [
        ("Creating WoW buildings table...", "create_bldgs_table.sql"),
        ("Adding helper functions...", "helper_functions.sql"),
        ("Creating WoW search function...", "search_function.sql"),
        ("Creating WoW agg function...", "agg_function.sql"),
        ("Creating hpd landlord contact table...", "landlord_contact.sql"),
    ]

    for desc, filename in WOW_SCRIPTS:
        print(desc)
        run_sql_file(conn, SQL_DIR / filename)


def dbshell(args) -> int:
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD
    return subprocess.call([
        'psql', '-h', DB_HOST, '-p', DB_PORT, '-U', DB_USER, '-d', DB_DATABASE
    ], env=env)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    parser_builddb = subparsers.add_parser('builddb')
    parser_builddb.add_argument(
        '-t', '--use-test-data', action='store_true',
        help='Load the database with a small amount of test data.')
    parser_builddb.set_defaults(func=builddb)

    parser_dbshell = subparsers.add_parser('dbshell')
    parser_dbshell.set_defaults(func=dbshell)

    args = parser.parse_args()

    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)

    sys.exit(args.func(args) or 0)
