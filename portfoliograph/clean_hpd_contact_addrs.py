import itertools
from typing import Dict, Iterable, Iterator, List, NamedTuple
from pathlib import Path
import csv
import multiprocessing
import functools
import psycopg2
from psycopg2.extras import DictCursor

from standardize import RawLandlordRow, StandardizedLandlordRow, standardize_record


SQL_DIR = Path(__file__).parent.parent.resolve() / "sql"

DB_URL = f"postgresql://\
atul:blarg1234@nycdb-clone2-cluster.cluster-ckvyf7p6u5rl.us-east-1.rds.amazonaws.com/nycdb"


with psycopg2.connect(DB_URL) as conn:
    with conn.cursor() as cursor:
        # TODO: table will be created elsewhere, this is tempoary
        create_landlords_table = (SQL_DIR / "create_landlords_table.sql").read_text()
        cursor.execute(create_landlords_table)

def query_hpd_contact_addrs(dict_cursor) -> List[RawLandlordRow]:
    query = (SQL_DIR / "select_hpd_contact_addrs.sql").read_text()
    dict_cursor.execute(query)
    return [RawLandlordRow(**row) for row in dict_cursor.fetchall()]


with psycopg2.connect(DB_URL) as conn:
    with conn.cursor(cursor_factory=DictCursor) as cur:
        records_to_standardize = query_hpd_contact_addrs(cur)

# TODO: change default batch to 10k
with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
    standardized_records = pool.map(
        functools.partial(standardize_record),
        records_to_standardize,
        1000,
    )


def grouper(
    n: int, iterable: Iterable[StandardizedLandlordRow]
) -> Iterator[List[StandardizedLandlordRow]]:
    # https://stackoverflow.com/a/8991553
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk


# TODO: change default batch to 5k
def populate_landlords_table(batch_size=1000, table="wow_landlords"):
    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor() as cursor:
            for chunk in grouper(batch_size, standardized_records):
                # https://stackoverflow.com/a/10147451
                args_str = b",".join(
                    cursor.mogrify(
                        "(%s,%s,%s,%s)",
                        (
                            row.bbl,
                            row.registrationid,
                            row.name,
                            row.bizaddr,
                        ),
                    )
                    for row in chunk
                ).decode()
                cursor.execute(f"INSERT INTO {table} VALUES {args_str}")

populate_landlords_table()
