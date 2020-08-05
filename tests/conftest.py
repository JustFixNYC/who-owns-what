from contextlib import contextmanager
import time
import psycopg2
import psycopg2.extras
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import pytest

from .nycdb_context import TEST_DB


def exec_outside_of_transaction(sql: str):
    '''
    Execute the given SQL outside the context of a transaction,
    on the default Postgres database.
    '''

    kwargs = TEST_DB.psycopg2_connect_kwargs()
    kwargs['database'] = 'postgres'
    conn = psycopg2.connect(**kwargs)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn.cursor() as curs:
        curs.execute(sql)
    conn.close()


def drop_db(dbname: str):
    '''Drop the given Postgres database.'''

    exec_outside_of_transaction('DROP DATABASE ' + dbname)


def create_db(dbname: str):
    '''Create the given Postgres database.'''

    exec_outside_of_transaction('CREATE DATABASE ' + dbname)


@pytest.fixture(scope="module")
def db():
    """
    Attempt to connect to the database, retrying if necessary, and also
    creating the database if it doesn't already exist.
    """

    retries_left = 5
    db = TEST_DB.database
    created = False

    while True:
        try:
            psycopg2.connect(**TEST_DB.psycopg2_connect_kwargs()).close()
            break
        except psycopg2.OperationalError as e:
            if 'database "{}" does not exist'.format(TEST_DB.database) in str(e):
                create_db(db)
                created = True
                retries_left -= 1
            elif retries_left:
                # It's possible the database is still starting up.
                time.sleep(2)
                retries_left -= 1
            else:
                raise e

    if not created:
        drop_db(db)
        create_db(db)

    return DbContext()


class DbContext:
    '''
    An object facilitating interactions with the database from tests.
    '''

    @contextmanager
    def connect(self):
        '''
        Connect to the database.
        '''

        with psycopg2.connect(**TEST_DB.psycopg2_connect_kwargs()) as conn:
            yield conn

    @contextmanager
    def cursor(self):
        '''
        Connect to the database and get a cursor that supports dictionary-like
        rows.
        '''

        with self.connect() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                yield cur


@pytest.fixture(scope="module")
def nycdb_ctx():
    from . import nycdb_context

    def get_cursor():
        return DbContext().cursor()

    yield from nycdb_context.nycdb_ctx(get_cursor)
