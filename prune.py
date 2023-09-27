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
import networkx as nx
# import matplotlib.pyplot as plt
# import hvplot
# import hvplot.networkx as hvnx

import portfoliograph.table

import portfoliograph.graph_new
# import portfoliograph.hpd_regs

DB_URL = f"postgresql://\
atul:blarg1234@nycdb-clone2-cluster.cluster-ckvyf7p6u5rl.us-east-1.rds.amazonaws.com/nycdb"


def create_table(conn, table: str):
    sql = f"DROP TABLE if exists {table} cascade; \
            CREATE TABLE {table} ( \
                bbls text[], \
                landlord_names text[], \
                graph json \
            ); \
            CREATE INDEX ON {table} USING GIN(bbls); \
            CREATE INDEX ON {table} USING GIN(landlord_names);"
    with conn.cursor() as cur:
        cur.execute(sql)


# def draw_graph(conn, table: str, bbl: str, filename: str):
#     g = import_subgaph(table, bbl)
#     # pos = nx.nx_agraph.graphviz_layout(g)
#     nx.draw_networkx(g, with_labels=False)
#     # nx.draw_networkx_edges(g, pos=pos)
#     # nx.draw_networkx_nodes(g, pos=pos)
#     # viz = hvnx.draw(g)
#     # hvplot.save(viz, "test.png")
#     plt.axis("off")
#     plt.savefig(filename, bbox_inches="tight")
#     plt.clf()


def import_subgaph(table, bbl):
    with open("foo.pkl", "rb") as f:
        g = pickle.load(f)

    for c in nx.connected_components(g):
        induced_subgraph = g.subgraph(c)
        for (_from, to, attrs) in induced_subgraph.edges.data():
            hpd_regs = attrs["hpd_regs"]
            for reginfo in hpd_regs:
                if reginfo.reg_bbl == bbl:
                    return induced_subgraph


def build_graph(table, db_url):

    # print("Building registration -> BBL mapping.")
    # reg_bbl_map = portfoliograph.hpd_regs.build_reg_bbl_map(cur)

    print("Building graph.")

    with psycopg2.connect(db_url) as conn:
        cur = conn.cursor(cursor_factory=DictCursor)
        g = portfoliograph.graph_new.build_graph(cur)

    print("Exporting graph.")
    with open(f"{table}.pkl", "wb") as f:
        pickle.dump(g, f)


def build_sample():
    a = nx.erdos_renyi_graph(n=5, p=0.5, seed=1312)
    b = nx.erdos_renyi_graph(n=10, p=0.5, seed=1312)
    c = nx.union(a, b, rename=("a-", "b-"))
    c.add_edge("a-0", "b-0")
    return c


def build_table(table, db_url):
    with psycopg2.connect(db_url) as conn:
        create_table(conn, table=table)
        portfoliograph.table.populate_portfolios_table(conn, table=table)
    conn.commit()


def main(argv: List[str] = sys.argv, db_url: str = DB_URL):
    if argv[1] == "build-table":
        build_table(table=argv[2], db_url=db_url)
    if argv[1] == "build-graph":
        build_graph(table=argv[2], db_url=db_url)


if __name__ == "__main__":
    main()
