import psycopg2
import os
import subprocess
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


if __name__ == '__main__':
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
