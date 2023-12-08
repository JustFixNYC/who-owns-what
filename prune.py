"""\
Build WOW portfolios table in a database

Usage:
  prune.py table

Options:
  -h --help     Show this screen.
  -t --table    Alternative name for 'wow_portfolios' table in database

Environment variables:
  DATABASE_URL           The URL of the NYC-DB and WoW database.
"""

# import json
import pickle
import sys
from typing import List
import psycopg2
from psycopg2.extras import DictCursor
# import networkx as nx
from portfoliograph.standardize import populate_landlords_table

# import matplotlib.pyplot as plt
# import hvplot
# import hvplot.networkx as hvnx

import portfoliograph.table

import portfoliograph.graph

DB_URL = f"postgresql://\
atul:blarg1234@nycdb-clone2-cluster.cluster-ckvyf7p6u5rl.us-east-1.rds.amazonaws.com/nycdb"


def create_table(conn, table: str):
    sql = f"DROP TABLE if exists {table} cascade; \
            CREATE TABLE {table} ( \
                orig_id int, \
                bbls text[], \
                landlord_names text[], \
                graph json, \
                relatedportfoliosbbls text[] \
            ); \
            CREATE INDEX ON {table} (orig_id); \
            CREATE INDEX ON {table} USING GIN(bbls); \
            CREATE INDEX ON {table} USING GIN(landlord_names);"
    with conn.cursor() as cur:
        cur.execute(sql)


def build_graph(table, db_url):

    print("Building graph.")
    with psycopg2.connect(db_url) as conn:
        cur = conn.cursor(cursor_factory=DictCursor)
        g = portfoliograph.graph.build_graph(cur)

    print("Exporting graph.")
    with open(f"{table}.pkl", "wb") as f:
        pickle.dump(g, f)


def build_table(table, db_url):
    with psycopg2.connect(db_url) as conn:
        create_table(conn, table=table)
        portfoliograph.table.populate_portfolios_table(conn, table=table)
        conn.commit()


def standardize(db_url):
    with psycopg2.connect(db_url) as conn:
        populate_landlords_table(conn)
        conn.commit()


def main(argv: List[str] = sys.argv, db_url: str = DB_URL):
    if argv[1] == "build-table":
        build_table(table=argv[2], db_url=db_url)
    if argv[1] == "standardize":
        standardize(db_url=db_url)
    if argv[1] == "build-graph":
        build_graph(table=argv[2], db_url=db_url)


if __name__ == "__main__":
    main()


# python prune.py "build-graph"  "portfolio-graphs"
# python prune.py "build-table"  "wow_portfolios_split_1"
# python prune.py "build-table"  "wow_portfolios_split_1_dec_ids"
