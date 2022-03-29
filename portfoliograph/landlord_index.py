import numpy
import math
from psycopg2.extras import DictCursor

def update_landlord_algolia_index(conn, max_index_char_length: int = 2000):
    # TODO: Check whether wow_portfolios table has changed

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

        # 3. Check if stringified ll_names is longer than 2000 characters
        for row in cursor.fetchall():
            # Avoid Algolia's limit on article size by breaking up the landlord
            # names list into multiple records that each point to the same BBLs.
            num_parts = math.ceil(len(row["landlord_names"]) / max_index_char_length)
            portfolio_bbl = sorted(row["bbls"])[0]
            if num_parts > 1:
                names_array = row["landlord_names"].split(', ')
                parts = numpy.array_split(names_array, num_parts)
                new_rows = [{"portfolio_bbl": portfolio_bbl, "landlord_names": ', '.join(part)} for part in parts]
                cleaned_rows.extend(new_rows)
            else:
                cleaned_rows.append({"portfolio_bbl": portfolio_bbl, "landlord_names": row["landlord_names"]})

    return cleaned_rows

    # 4. Upload CSV to Algolia as new index
    """
    from algoliasearch.search_client import SearchClient
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv())

    # Algolia client credentials
    ALGOLIA_APP_ID = getenv('ALGOLIA_APP_ID')
    ALGOLIA_API_KEY = getenv('ALGOLIA_API_KEY')
    ALGOLIA_INDEX_NAME = getenv('ALGOLIA_INDEX_NAME')

    # Initialize the client
    # https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/?client=python
    client = SearchClient.create(ALGOLIA_APP_ID, ALGOLIA_API_KEY)

    # Initialize an index
    # https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
    index = client.init_index(ALGOLIA_INDEX_NAME)
    """

    """
    Of shape:

    new_contacts = [
    {
        'name': 'NewFoo',
        'objectID': '3'
    },
    {
        'name': 'NewBar',
        'objectID': '4'
    }
    ]
    """
    # Replace All Objects: Clears all objects from your index and replaces them with a new set of objects.
    # https://www.algolia.com/doc/api-reference/api-methods/replace-all-objects/?client=python  
    # index.replace_all_objects(cleaned_rows).wait()

    """
    To test:
        res = index.search('')
        print('Current objects: ', res['hits'], '\n')
    """