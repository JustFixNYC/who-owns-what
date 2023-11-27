from typing import Iterable, Iterator, List, Set, NamedTuple, TextIO
from psycopg2.extras import DictCursor, Json
import json
import itertools
import networkx as nx

from . import graph


class PortfolioRow(NamedTuple):
    bbls: List[str]
    landlord_names: List[str]
    graph: nx.Graph

    def to_json(self):
        return {
            "bbls": self.bbls,
            "landlord_names": self.landlord_names,
            "portfolio": graph.to_json_graph(self.graph),
        }


def iter_portfolio_rows(conn) -> Iterable[PortfolioRow]:
    cur = conn.cursor(cursor_factory=DictCursor)

    print("Building graph.")
    g = graph.build_graph(cur)

    print("Finding connected components.")

    for portfolio_graph in graph.split_graph(g):
        bbls: Set[str] = set()
        names: List[str] = []
        for node in portfolio_graph.nodes(data=True):
            bbls.union(node[1]["bbls"])
            names.append(node[1]["name"])
        yield PortfolioRow(
            bbls=list(bbls),
            landlord_names=names,
            graph=portfolio_graph,
        )


def export_portfolios_table_json(conn, outfile: TextIO):
    outfile.write("[\n")
    components_written = 0

    for pr in iter_portfolio_rows(conn):
        if components_written > 0:
            outfile.write(",\n")
        outfile.write(json.dumps(pr.to_json()))
        components_written += 1

    outfile.write("]\n")


def grouper(n: int, iterable: Iterable[PortfolioRow]) -> Iterator[List[PortfolioRow]]:
    # https://stackoverflow.com/a/8991553

    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk


def populate_portfolios_table(conn, batch_size=5000, table="wow_portfolios"):
    with conn.cursor() as cursor:
        for chunk in grouper(batch_size, iter_portfolio_rows(conn)):
            # https://stackoverflow.com/a/10147451
            # why does it take so much work to put stuff in a table quickly
            args_str = b",".join(
                cursor.mogrify(
                    "(%s,%s,%s)",
                    (
                        row.bbls,
                        row.landlord_names,
                        Json(graph.to_json_graph(row.graph)),
                    ),
                )
                for row in chunk
            ).decode()
            cursor.execute(f"INSERT INTO {table} VALUES {args_str}")
