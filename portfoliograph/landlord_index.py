import numpy
import math
import os
from psycopg2.extras import DictCursor
from algoliasearch.search_client import SearchClient

try:
    import dotenv

    dotenv.load_dotenv()
except ImportError:
    # We don't have development dependencies installed.
    pass

# Algolia client credentials
ALGOLIA_APP_ID = os.environ.get("ALGOLIA_APP_ID")
ALGOLIA_API_KEY = os.environ.get("ALGOLIA_API_KEY")
ALGOLIA_INDEX_NAME = "wow_landlords"


def get_landlord_data_for_algolia(conn, max_index_char_length: int = 2000):
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
            portfolio_bbl = sorted(row["bbls"])[0]
            if num_parts > 1:
                names_array = row["landlord_names"].split(", ")
                parts = numpy.array_split(names_array, num_parts)
                new_rows = [
                    {"portfolio_bbl": portfolio_bbl, "landlord_names": ", ".join(part)}
                    for part in parts
                ]
                cleaned_rows.extend(new_rows)
            else:
                cleaned_rows.append(
                    {
                        "portfolio_bbl": portfolio_bbl,
                        "landlord_names": row["landlord_names"],
                    }
                )

    return cleaned_rows


def update_landlord_search_index(conn):

    landlord_data = get_landlord_data_for_algolia(conn)

    # Initialize the client
    # www.algolia.com/doc/api-client/getting-started/instantiate-client-index/?client=python
    client = SearchClient.create(ALGOLIA_APP_ID, ALGOLIA_API_KEY)

    # Initialize an index
    # www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
    index = client.init_index(ALGOLIA_INDEX_NAME)

    # Replace All Objects: Clears all objects from your index and
    # replaces them with a new set of objects.
    # www.algolia.com/doc/api-reference/api-methods/replace-all-objects/?client=python
    # index.replace_all_objects(landlord_data).wait()
    index.save_object(landlord_data[0]).wait()
