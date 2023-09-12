import csv
import itertools
import boto3
from botocore.client import Config
from pathlib import Path
from typing import Iterable, Iterator, List, Optional


class OcaConfig:
    def __init__(
        self,
        data_dir: Path,
        test_dir: Path,
        sql_dir: Path,
        sql_pre_files: List[str],
        sql_post_files: List[str],
        aws_key: Optional[str],
        aws_secret: Optional[str],
        s3_bucket: Optional[str],
        s3_objects: List[str],
        is_testing: bool = False,
    ):
        self.sql_pre_files = [sql_dir / f for f in sql_pre_files]
        self.sql_post_files = [sql_dir / f for f in sql_post_files]
        self.sql_dir = sql_dir
        self.data_dir = data_dir
        self.test_dir = test_dir
        self.aws_key = aws_key
        self.aws_secret = aws_secret
        self.s3_bucket = s3_bucket
        self.s3_objects = s3_objects
        self.is_testing = is_testing

    @property
    def has_s3_creds(self) -> bool:
        return all([self.aws_key, self.aws_secret, self.s3_bucket])


def download_oca_s3_objects(config: OcaConfig):
    s3 = boto3.client(
        "s3",
        aws_access_key_id=config.aws_key,
        aws_secret_access_key=config.aws_secret,
        config=Config(
            connect_timeout=10, read_timeout=100, retries={"max_attempts": 10}
        ),
    )
    for object in config.s3_objects:
        csv_path = config.data_dir / Path(object).name
        s3.download_file(config.s3_bucket, object, csv_path)


def create_oca_s3_tables(wow_cur, config: OcaConfig):
    for f in config.sql_pre_files:
        sql = f.read_text()
        wow_cur.execute(sql)


def read_iter_rows(csv_path) -> Iterator[tuple]:
    with open(csv_path, "r") as file:
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


def populate_table_from_csv(wow_cur, csv_path: Path, batch_size: int = 5000):
    iter_rows = read_iter_rows(csv_path)
    for chunk in grouper(batch_size, iter_rows):
        args_str = b",".join(
            wow_cur.mogrify("(" + ", ".join(["%s"] * len(tuple(row))) + ")", row)
            for row in chunk
        ).decode()
        wow_cur.execute(f"INSERT INTO {csv_path.stem} VALUES {args_str}")


def create_derived_oca_tables(wow_cur, config: OcaConfig):
    for f in config.sql_post_files:
        print(f"- {f.stem}")
        sql = f.read_text()
        wow_cur.execute(sql)


def populate_oca_tables(wow_cur, config: OcaConfig):
    # Since OCA data is private, if you don't have access, the empty tables won't
    # be populated and the wow tables will have nulls for the OCA columns

    print(f"Creating OCA tables for WOW")
    create_oca_s3_tables(wow_cur, config)

    if not config.has_s3_creds and not config.is_testing:
        print("No AWS keys to access OCA files in S3. Leaving tables empty")
        return

    if not config.is_testing:
        download_oca_s3_objects(config)

    print(f"Populating OCA tables for WOW")

    for object in config.s3_objects:
        csv_dir = config.test_dir if config.is_testing else config.data_dir
        csv_path = csv_dir / Path(object).name
        print(f"- {csv_path.stem}")
        populate_table_from_csv(wow_cur, csv_path)

    create_derived_oca_tables(wow_cur, config)
