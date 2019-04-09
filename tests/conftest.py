import os
from types import SimpleNamespace
from pathlib import Path
import csv
from io import StringIO
from contextlib import contextmanager
from typing import List
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
    '''
    An object feacilitating interactions with NYCDB from tests.
    '''

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

    def load_dataset(self, name: str):
        '''Load the given NYCDB dataset into the database.'''

        nycdb.Dataset(name, args=self.args).db_import()

    def _write_csv_to_file(self, csvfile, namedtuples):
        header_row = [unmunge_colname(colname) for colname in namedtuples[0]._fields]
        writer = csv.writer(csvfile)
        writer.writerow(header_row)
        for row in namedtuples:
            writer.writerow(row)

    def write_csv(self, filename, namedtuples):
        '''
        Write the given rows (as a list of named tuples) into
        the given CSV file in the NYCDB data directory.
        '''

        path = self.root_dir / filename
        with path.open('w', newline='') as csvfile:
            self._write_csv_to_file(csvfile, namedtuples)

    def write_zip(self, filename, files):
        '''
        Write a ZIP file containing CSV files to the NYC
        data directory, given a dictionary mapping
        filenames to lists of named tuples.
        '''

        path = self.root_dir / filename
        with zipfile.ZipFile(path, mode="w") as zf:
            for filename in files:
                out = StringIO()
                self._write_csv_to_file(out, files[filename])
                zf.writestr(filename, out.getvalue())

    def build_everything(self) -> None:
        '''
        Load all the NYCDB datasets required for Who Owns What,
        and then run all our custom SQL.
        '''

        for dataset in dbtool.get_dataset_dependencies():
            self.load_dataset(dataset)

        all_sql = '\n'.join([
            sqlpath.read_text()
            for sqlpath in dbtool.get_sqlfile_paths()
        ])
        with DbContext().cursor() as cur:
            cur.execute(all_sql)


@pytest.fixture(scope="module")
def nycdb_ctx():
    '''
    Yield a NYCDB context whose data directory is
    a temporary directory.
    '''

    with tempfile.TemporaryDirectory() as dirname:
        yield NycdbContext(dirname)


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
