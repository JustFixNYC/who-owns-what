import numpy
import math
from typing import Dict, Any
import hashlib
import json
from psycopg2.extras import DictCursor
from algoliasearch.search_client import SearchClient


def split_sort_join(x: str, sep: str = ", ") -> str:
    """
    Takes a delimited string, splits it by a given seperator,
    sorts the parts, and concatenates it back together using
    the same seperator, returning a single delimited string
    """
    return sep.join(sorted(x.split(sep)))


def dict_hash(dictionary: Dict[str, Any]) -> str:
    """MD5 hash of a dictionary."""
    # doc.ic.ac.uk/~nuric/coding/how-to-hash-a-dictionary-in-python.html
    dhash = hashlib.md5()
    encoded = json.dumps(dictionary, sort_keys=True).encode()
    dhash.update(encoded)
    return dhash.hexdigest()


def get_landlord_data_for_algolia(conn, max_index_char_length: int = 2000):
    """
    Query the "wow_portfolios" table to get landlord names we want to search by in Algolia.
    We then sort bbls and landlord names to ensure consistent results despite inconsistent
    order in the db table. Then we split portfolios with large number of landlord names so
    that we don't exceed Algolia's charater limit. We also hash the contents of the record
    to create the unique objectID that Algolia requires. (later we can use this hash objectID
    to determine if we need to update the record or not to save some operations/credits)
    """
    # TODO: Only update when contents of wow_portfolios table has changed

    cleaned_rows = []
    with conn.cursor(cursor_factory=DictCursor) as cursor:
        cursor.execute(
            f"""
            SELECT
                array_to_string(landlord_names,', ') as landlord_names,
                bbls
            FROM
                wow_portfolios
            WHERE bbls[1] is not null;
        """
        )

        for row in cursor.fetchall():
            # Avoid Algolia's limit on article size by breaking up the landlord
            # names list into multiple records that each point to the same BBLs.
            num_parts = math.ceil(len(row["landlord_names"]) / max_index_char_length)
            # We want to take a single bbl associated with each portfolio, but their order is
            # not concsistent in the wow_portfolios db table array, so we sort and take out
            # the first one to ensure it's consistent between runs
            portfolio_bbl = sorted(row["bbls"])[0]
            # We also need the names order to be consistent before hashing for objectID
            landlord_names = split_sort_join(row["landlord_names"])
            if num_parts > 1:
                names_array = landlord_names.split(", ")
                names_array_subsets = numpy.array_split(names_array, num_parts)
                portfolio_part_dict_list = [
                    {
                        "portfolio_bbl": portfolio_bbl,
                        "landlord_names": ", ".join(names_subset),
                    }
                    for names_subset in names_array_subsets
                ]
                new_rows = [
                    {"objectID": dict_hash(row), **row}
                    for row in portfolio_part_dict_list
                ]
                cleaned_rows.extend(new_rows)
            else:
                portfolio = {
                    "portfolio_bbl": portfolio_bbl,
                    "landlord_names": landlord_names,
                }
                row = {"objectID": dict_hash(portfolio), **portfolio}
                cleaned_rows.append(row)

    return cleaned_rows


def update_landlord_search_index(conn, algolia_app_id, algolia_api_key):

    algolia_index_name = "wow_landlords"

    landlord_data = get_landlord_data_for_algolia(conn)

    # Initialize the client
    # www.algolia.com/doc/api-client/getting-started/instantiate-client-index/?client=python
    client = SearchClient.create(algolia_app_id, algolia_api_key)

    # Initialize an index
    # www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
    index = client.init_index(algolia_index_name)

    # Replace All Objects: Clears all objects from your index and
    # replaces them with a new set of objects.
    # www.algolia.com/doc/api-reference/api-methods/replace-all-objects/?client=python
    index.replace_all_objects(landlord_data, {"safe": True})
