import psycopg2
import os
import psycopg2.extras
import time
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import pytest
import nycdb

import dbtool

TEST_DB_URL = os.environ['DATABASE_URL'] + '_test'

TEST_DB = dbtool.DbContext.from_url(TEST_DB_URL)


def exec_outside_of_transaction(sql: str):
    kwargs = TEST_DB.psycopg2_connect_kwargs()
    kwargs['database'] = 'postgres'
    conn = psycopg2.connect(**kwargs)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn.cursor() as curs:
        curs.execute(sql)
    conn.close()


def drop_db(dbname: str):
    exec_outside_of_transaction('DROP DATABASE ' + dbname)


def create_db(dbname: str):
    exec_outside_of_transaction('CREATE DATABASE ' + dbname)


@pytest.fixture(scope="session")
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
            return
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


@pytest.fixture
def conn(db):
    with psycopg2.connect(**CONNECT_ARGS) as conn:
        yield conn


def test_sql(db):
    # TODO: Test something here.
    pass
