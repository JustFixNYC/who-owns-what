import os
from types import SimpleNamespace
from pathlib import Path
import csv
from io import StringIO
from contextlib import contextmanager
import os
import time
import tempfile
import zipfile
import psycopg2
import psycopg2.extras
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import pytest
import nycdb

import dbtool
from .generate_factory_from_csv import unmunge_colname


TEST_DB_URL = os.environ['DATABASE_URL'] + '_test'

TEST_DB = dbtool.DbContext.from_url(TEST_DB_URL)


class NycdbContext:
    def __init__(self, root_dir):
        self.args = SimpleNamespace(
            user=TEST_DB.user,
            password=TEST_DB.password,
            host=TEST_DB.host,
            database=TEST_DB.database,
            port=TEST_DB.port,
            root_dir=root_dir
        )
        self.root_dir = Path(root_dir)

    def get_dataset(self, name):
        return nycdb.Dataset(name, args=self.args)

    def _write_csv_to_file(self, csvfile, namedtuples):
        header_row = [unmunge_colname(colname) for colname in namedtuples[0]._fields]
        writer = csv.writer(csvfile)
        writer.writerow(header_row)
        for row in namedtuples:
            writer.writerow(row)

    def write_csv(self, filename, namedtuples):
        path = self.root_dir / filename
        with path.open('w', newline='') as csvfile:
            self._write_csv_to_file(csvfile, namedtuples)

    def write_zip(self, filename, files):
        path = self.root_dir / filename
        with zipfile.ZipFile(path, mode="w") as zf:
            for filename in files:
                out = StringIO()
                self._write_csv_to_file(out, files[filename])
                zf.writestr(filename, out.getvalue())

    def get_dbtool_builder(self):
        return dbtool.NycDbBuilder(
            TEST_DB,
            data_dir=self.root_dir,
            download_if_needed=False
        )


@pytest.fixture(scope="class")
def nycdb_ctx():
    with tempfile.TemporaryDirectory() as dirname:
        yield NycdbContext(dirname)


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


@pytest.fixture(scope="class")
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
    @contextmanager
    def connect(self):
        with psycopg2.connect(**TEST_DB.psycopg2_connect_kwargs()) as conn:
            yield conn


    @contextmanager
    def cursor(self):
        with self.connect() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                yield cur
