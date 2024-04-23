import os
import re
import itertools
import multiprocessing
from pathlib import Path
from typing import Iterable, List, NamedTuple
from geosupport import Geosupport, GeosupportError
from psycopg2.extras import DictCursor

# Use of NYC DCP's Geosupport desktop for geocoding addresses (to standardize
# the address format) is based on this blog post from DCP's Planning Labs
# https://medium.com/nyc-planning-digital/geosupport-%EF%B8%8Fpython-a094a2d30fbe

SQL_DIR = Path(__file__).parent.resolve() / "sql"

# TODO: find a better solution for this.
# can't run this on CI since files are installed, and can't import within one of
# the functions because of the multiprocessing
if not os.environ.get("CI"):
    G = Geosupport()


class RawLandlordRow(NamedTuple):
    bbl: str
    registrationid: int
    name: str
    housenumber: str
    streetname: str
    apartment: str
    city: str
    zip: str
    state: str


class StandardizedLandlordRow(NamedTuple):
    bbl: str
    registrationid: int
    name: str
    bizaddr: str
    bizhousestreet: str
    bizapt: str
    bizzip: str


def get_raw_landlord_rows(dict_cursor) -> List[RawLandlordRow]:
    query = (SQL_DIR / "landlords_to_standardize.sql").read_text()
    dict_cursor.execute(query)
    return [RawLandlordRow(**row) for row in dict_cursor.fetchall()]


def str_squish(x: str) -> str:
    return re.sub(r"\s+", " ", x.strip())


def parse_output(geo):
    """parse out desired variables from geosupport return dict

    Args:
        geo (dict): return from geosupport functions

    Returns:
        dict: dict of strings for geocode results, including normalized address
        components and return codes and messages to diagnose unsuccessful
        geocode attempts
    """
    return dict(
        # Normalized address:
        housenumber=geo.get("House Number - Display Format", ""),
        streetname=geo.get("First Street Name Normalized", ""),
        boro=geo.get("First Borough Name", ""),
        zip=geo.get("ZIP Code", ""),
        # the return codes and messaged are for diagnostic puposes
        # highly recommend to include in the final output
        # to look up what the return codes mean, check out below:
        # https://nycplanning.github.io/Geosupport-UPG/chapters/chapterII/section02/
        grc=geo.get("Geosupport Return Code (GRC)", ""),
        grc2=geo.get("Geosupport Return Code 2 (GRC 2)", ""),
        msg=geo.get("Message", "msg err"),
        msg2=geo.get("Message 2", "msg2 err"),
    )


def standardize_record(record: RawLandlordRow):
    """standardize the address from a data record using using NYC DCP's Geosupport

    Args:
        record (dict): a record with address to be standardized
        number (str): name of the field in the record for the house number
        street (str): name of the field in the record for the street name
        zip (str): name of the field in the record for the zip code

    Returns:
        dict: the input "record" dict with the standardized results added
    """
    addr_args = dict(
        house_number=record.housenumber,
        street_name=record.streetname,
        zip_code=record.zip,
    )

    try:
        geo = G.address(**addr_args)
    except GeosupportError as e:
        geo = e.result
    except Exception:
        print(addr_args)
        raise

    std_addr = parse_output(geo)

    housenumber = (
        std_addr["housenumber"] if std_addr["housenumber"] else record.housenumber
    )
    streetname = std_addr["streetname"] if std_addr["streetname"] else record.streetname
    city_or_boro = std_addr["boro"] if std_addr["boro"] else record.city
    house_sreett_apt = str_squish(f"{housenumber} {streetname} {record.apartment}")
    bizaddr = f"{house_sreett_apt}, {city_or_boro} {record.state}"

    return StandardizedLandlordRow(
        bbl=record.bbl,
        registrationid=record.registrationid,
        name=record.name,
        bizaddr=bizaddr,
        bizhousestreet=f"{housenumber} {streetname}",
        bizapt=record.apartment,
        bizzip=std_addr["zip"],
    )


def standardize_records_multiprocessing(records: List[RawLandlordRow]):
    # separate function for ease of mocking in tests
    with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
        return pool.map(standardize_record, records, 10000)


def grouper(
    n: int, iterable: Iterable[StandardizedLandlordRow]
) -> Iterable[List[StandardizedLandlordRow]]:
    # https://stackoverflow.com/a/8991553
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk


def populate_landlords_table(conn, batch_size=5000, table="wow_landlords"):
    print("Standardizing landlord addresses.")
    with conn.cursor(cursor_factory=DictCursor) as dict_cursor:
        records_to_standardize = get_raw_landlord_rows(dict_cursor)

        standardized_records = standardize_records_multiprocessing(
            records_to_standardize
        )

        for chunk in grouper(batch_size, standardized_records):
            # https://stackoverflow.com/a/10147451
            args_str = b",".join(
                dict_cursor.mogrify("(%s,%s,%s,%s,%s,%s,%s)", row) for row in chunk
            ).decode()
            dict_cursor.execute(f"INSERT INTO {table} VALUES {args_str}")
