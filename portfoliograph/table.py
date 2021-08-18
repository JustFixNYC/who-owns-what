from typing import Iterable, Iterator, List, Set, NamedTuple, TextIO
from psycopg2.extras import DictCursor, Json
import json
import itertools
import networkx as nx

from . import graph
from .graph import RegistrationInfo, NodeKind
from .hpd_regs import build_reg_bbl_map


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

    print("Building registration -> BBL mapping.")
    reg_bbl_map = build_reg_bbl_map(cur)

    print("Building graph.")
    g = graph.build_graph(cur)

    print("Finding connected components.")

    for c in nx.connected_components(g):
        induced_subgraph = g.subgraph(c)
        bbls: Set[str] = set()
        names: List[str] = [
            node.name
            for node in induced_subgraph.nodes
            if node.kind == NodeKind.NAME
        ]
        for (_from, to, attrs) in induced_subgraph.edges.data():
            hpd_regs: Set[RegistrationInfo] = attrs['hpd_regs']
            for reginfo in hpd_regs:
                if reginfo.reg_id in reg_bbl_map:
                    bbls = bbls.union(reg_bbl_map[reginfo.reg_id])
                else:
                    print(f"WARNING: HPD registration {reginfo.reg_id} not found.")
        yield PortfolioRow(bbls=list(bbls), landlord_names=names, graph=induced_subgraph)


def export_portfolios_table_json(conn, outfile: TextIO):
    outfile.write('[\n')
    components_written = 0

    for pr in iter_portfolio_rows(conn):
        if components_written > 0:
            outfile.write(",\n")
        outfile.write(json.dumps(pr.to_json()))
        components_written += 1

    outfile.write(']\n')


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
            args_str = b','.join(
                cursor.mogrify(
                    "(%s,%s,%s)",
                    (row.bbls,
                     row.landlord_names,
                     Json(graph.to_json_graph(row.graph)))
                )
                for row in chunk
            ).decode()
            cursor.execute(f"INSERT INTO {table} VALUES {args_str}")
