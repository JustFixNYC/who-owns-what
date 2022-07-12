import csv
import itertools

from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace
from typing import Iterable, Iterator, List, NamedTuple, Optional
from urllib.parse import urlparse

import psycopg2
from sshtunnel import SSHTunnelForwarder


class OcaTableInfo(NamedTuple):
    table_name: str
    data_dir: Path
    sql_dir: Path
    test_dir: Path
    is_testing: bool

    @property
    def sql_select_path(self):
        return self.sql_dir / f"select_{self.table_name}.sql"

    @property
    def sql_create_path(self):
        return self.sql_dir / f"create_{self.table_name}.sql"

    @property
    def data_path(self):
        csv_dir = self.test_dir if self.is_testing else self.data_dir
        return csv_dir / f"{self.table_name}.csv"


class OcaConfig:
    def __init__(
        self,
        oca_table_names: List[str],
        sql_dir: Path,
        data_dir: Path,
        test_dir: Path,
        oca_db_url: Optional[str] = None,
        oca_ssh_host: Optional[str] = None,
        oca_ssh_user: Optional[str] = None,
        oca_ssh_pkey: Optional[str] = None,
        is_testing: bool = False,
    ):
        self.oca_table_names = oca_table_names
        self.sql_dir = sql_dir
        self.data_dir = data_dir
        self.test_dir = test_dir
        self.oca_db_url = oca_db_url
        self.oca_ssh_host = oca_ssh_host
        self.oca_ssh_user = oca_ssh_user
        self.oca_ssh_pkey = oca_ssh_pkey
        self.is_testing = is_testing

    @property
    def has_oca_creds(self):
        return all(
            [
                self.oca_db_url,
                self.oca_ssh_host,
                self.oca_ssh_user,
                self.oca_ssh_pkey,
            ]
        )

    @property
    def db_args(self):
        DB_INFO = urlparse(self.oca_db_url)
        DB_HOST = DB_INFO.hostname
        DB_NAME = DB_INFO.path[1:]
        DB_USER = DB_INFO.username
        DB_PASSWORD = DB_INFO.password

        return SimpleNamespace(
            db_user=DB_USER,
            db_password=DB_PASSWORD,
            db_host=DB_HOST,
            db_name=DB_NAME,
            ssh_user=self.oca_ssh_user,
            ssh_host=self.oca_ssh_host,
            ssh_pkey=self.oca_ssh_pkey,
        )

    @property
    def tables(self) -> List[OcaTableInfo]:
        return [
            OcaTableInfo(
                table_name=tbl,
                data_dir=self.data_dir,
                sql_dir=self.sql_dir,
                test_dir=self.test_dir,
                is_testing=self.is_testing,
            )
            for tbl in self.oca_table_names
        ]


@contextmanager
def oca_db_connect(config=OcaConfig):

    server = SSHTunnelForwarder(
        (config.db_args.ssh_host, 22),
        ssh_username=config.db_args.ssh_user,
        ssh_pkey=config.db_args.ssh_pkey,
        remote_bind_address=(config.db_args.db_host, 5432),
    )

    server.start()

    try:
        with psycopg2.connect(
            host=server.local_bind_host,
            database=config.db_args.db_name,
            user=config.db_args.db_user,
            password=config.db_args.db_password,
            port=server.local_bind_port,
        ) as conn:
            yield conn
    finally:
        server.stop()


def write_oca_csv(oca_cur, oca_table: OcaTableInfo):
    with open(oca_table.data_path, "w") as file:
        writer = csv.writer(file)
        sql = oca_table.sql_select_path.read_text()
        oca_cur.execute(sql)
        field_names = [i[0] for i in oca_cur.description]
        writer.writerow(field_names)
        for row in oca_cur.fetchall():
            writer.writerow(row)


def read_iter_rows(oca_table: OcaTableInfo) -> Iterator[tuple]:
    with open(oca_table.data_path, "r") as file:
        reader = csv.reader(file)
        next(reader, None)  # skip header
        for row in reader:
            yield tuple(row)


def grouper(n: int, iterator: Iterator[Iterable]) -> Iterator[List[Iterable]]:
    while True:
        chunk = list(itertools.islice(iterator, n))
        if not chunk:
            return
        yield chunk


def populate_oca_table(wow_cur, oca_table: OcaTableInfo, batch_size: int = 5000):
    iter_rows = read_iter_rows(oca_table)
    for chunk in grouper(batch_size, iter_rows):
        args_str = b",".join(
            wow_cur.mogrify("(" + ", ".join(["%s"] * len(tuple(row))) + ")", row)
            for row in chunk
        ).decode()
        wow_cur.execute(f"INSERT INTO {oca_table.table_name} VALUES {args_str}")


def create_oca_tables(wow_cur, config: OcaConfig):
    for oca_table in config.tables:
        sql = oca_table.sql_create_path.read_text()
        wow_cur.execute(sql)


def populate_oca_tables(wow_cur, config: OcaConfig):
    # Since OCA data is private, if you don't have access the empty tables won't
    # be populated and the wow tables will have nulls for the OCA columns

    if not config.has_oca_creds and not config.is_testing:
        print("No connection details for OCA. Leaving tables empty")
        return

    if config.has_oca_creds and not config.is_testing:
        with oca_db_connect(config) as oca_conn:
            print(f"Extracting OCA data to CSV")
            for oca_table in config.tables:
                print(f"- {oca_table.table_name}")
                with oca_conn.cursor() as oca_cur:
                    write_oca_csv(oca_cur, oca_table)

    print(f"Populating OCA tables for WOW")
    for oca_table in config.tables:
        print(f"- {oca_table.table_name}")
        populate_oca_table(wow_cur, oca_table)
