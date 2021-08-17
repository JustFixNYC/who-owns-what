from typing import Any, Dict, Iterable, Iterator, List, Set, NamedTuple, TextIO
from enum import Enum
from psycopg2.extras import DictCursor, Json
import json
import itertools
import networkx as nx


class NodeKind(Enum):
    NAME = 1
    BIZADDR = 2


class Node(NamedTuple):
    kind: NodeKind
    name: str

    def to_json(self):
        # This format is an artifact from the way hpd-graph-fun's
        # nodes were serialized. For more details, see:
        #
        #   https://github.com/JustFixNYC/hpd-graph-fun
        if self.kind == NodeKind.NAME:
            return {"Name": self.name}
        return {"BizAddr": self.name}


class RegistrationInfo(NamedTuple):
    reg_id: int
    reg_contact_id: int


class PortfolioRow(NamedTuple):
    bbls: List[str]
    landlord_names: List[str]
    graph: nx.Graph

    def to_json(self):
        return {
            "bbls": self.bbls,
            "landlord_names": self.landlord_names,
            "portfolio": to_json_graph(self.graph),
        }


RegBblMap = Dict[int, Set[str]]


def iter_portfolio_rows(conn) -> Iterable[PortfolioRow]:
    g = nx.Graph()

    reg_bbl_map: RegBblMap = {}
    cur = conn.cursor(cursor_factory=DictCursor)

    # TODO: ignore registrations expired over X days.
    # TODO: process synonyms (e.g. folks in pinnacle)

    print("Building registration -> BBL mapping.")
    cur.execute("""
        SELECT registrationid, bbl FROM hpd_registrations
    """)
    for reg_id, bbl in cur.fetchall():
        if reg_id not in reg_bbl_map:
            reg_bbl_map[reg_id] = set()
        reg_bbl_map[reg_id].add(bbl)

    print("Building graph.")
    # TODO: This SQL query needs to be more awesome, see:
    # https://github.com/JustFixNYC/who-owns-what/pull/524#discussion_r690589851
    cur.execute("""
        SELECT * FROM hpd_contacts
        WHERE
            type = any('{HeadOfficer,IndividualOwner,CorporateOwner}') AND
            businesshousenumber != '' AND
            businessstreetname != '' AND
            firstname != '' AND
            lastname != ''
    """)
    for row in cur.fetchall():
        name = f"{row['firstname']} {row['lastname']}".upper()
        aptno: str = row['businessapartment']
        aptno = f" {aptno}" if aptno else ""
        bizaddr = (
            f"{row['businesshousenumber']} "
            f"{row['businessstreetname']}{aptno}, "
            f"{row['businesscity']} {row['businessstate']}"
        ).upper()
        name_node = Node(NodeKind.NAME, name)
        bizaddr_node = Node(NodeKind.BIZADDR, bizaddr)
        g.add_node(name_node)
        g.add_node(bizaddr_node)
        if not g.has_edge(name_node, bizaddr_node):
            g.add_edge(name_node, bizaddr_node, hpd_regs=set())
        edge_data = g[name_node][bizaddr_node]
        edge_data['hpd_regs'].add(
            RegistrationInfo(
                reg_id=row['registrationid'],
                reg_contact_id=row['registrationcontactid'],
            )
        )

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


def export_graph_json(conn, outfile: TextIO):
    outfile.write('[\n')
    components_written = 0

    for pr in iter_portfolio_rows(conn):
        if components_written > 0:
            outfile.write(",\n")
        outfile.write(json.dumps(pr.to_json()))
        components_written += 1

    outfile.write(']\n')


def to_json_graph(graph: nx.Graph) -> Dict[str, Any]:
    '''
    Output a portfolio's graph as JSON based on this schema:

    https://github.com/JustFixNYC/hpd-graph-fun/blob/main/typescript/portfolio.d.ts
    '''

    node_indexes: Dict[Node, int] = {}
    counter = 1
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    for node in graph:
        node_indexes[node] = counter
        nodes.append({
            "id": counter,
            "value": node.to_json(),
        })
        counter += 1
    for (_from, to, attrs) in graph.edges.data():
        edges.append({
            "from": node_indexes[_from],
            "to": node_indexes[to],
            "reg_contacts": len(attrs['hpd_regs']),
        })
    return {
        "nodes": nodes,
        "edges": edges,
    }


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
                     Json(to_json_graph(row.graph)))
                )
                for row in chunk
            ).decode()
            cursor.execute(f"INSERT INTO {table} VALUES {args_str}")
