from typing import Any, Dict, Iterable, List, Set, TYPE_CHECKING, NamedTuple, TextIO
from enum import Enum
from psycopg2.extras import DictCursor
import json
import networkx as nx

if TYPE_CHECKING:
    from dbtool import DbContext


class NodeType(Enum):
    NAME = 1
    BIZADDR = 2


class Node(NamedTuple):
    kind: NodeType
    name: str

    def to_json(self):
        if self.kind == NodeType.NAME:
            return {"Name": self.name}
        return {"BizAddr": self.name}


class RegistrationInfo(NamedTuple):
    reg_id: int
    reg_contact_id: int


class PortfolioRow(NamedTuple):
    bbls: Set[str]
    graph: nx.Graph

    def to_json(self):
        return {
            "bbls": list(self.bbls),
            "portfolio": to_json_graph(self.graph),
        }


RegBblMap = Dict[int, Set[str]]


def iter_portfolio_rows(db: 'DbContext') -> Iterable[PortfolioRow]:
    g = nx.Graph()

    with db.connection() as conn:
        reg_bbl_map: RegBblMap = {}
        cur = conn.cursor(cursor_factory=DictCursor)

        # TODO: ignore registrations expired over X days.
        # TODO: process synonyms (e.g. folks in pinnacle)
        #
        # For additional reference see:
        #   https://github.com/JustFixNYC/hpd-graph-fun/blob/main/src/hpd_graph.rs

        print("Building registration -> BBL mapping.")
        cur.execute("""
            SELECT registrationid, bbl FROM hpd_registrations
        """)
        for reg_id, bbl in cur.fetchall():
            if reg_id not in reg_bbl_map:
                reg_bbl_map[reg_id] = set()
            reg_bbl_map[reg_id].add(bbl)

        print("Building graph.")
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
            name_node = Node(NodeType.NAME, name)
            bizaddr_node = Node(NodeType.BIZADDR, bizaddr)
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
        for (_from, to, attrs) in induced_subgraph.edges.data():
            hpd_regs: Set[RegistrationInfo] = attrs['hpd_regs']
            for reginfo in hpd_regs:
                bbls = bbls.union(reg_bbl_map[reginfo.reg_id])
        yield PortfolioRow(bbls=bbls, graph=induced_subgraph)


def export_graph_json(db: 'DbContext', outfile: TextIO):
    outfile.write('[\n')
    components_written = 0

    for pr in iter_portfolio_rows(db):
        if components_written > 0:
            outfile.write(",\n")
        outfile.write(json.dumps(pr.to_json()))
        components_written += 1

    outfile.write(']\n')


def to_json_graph(graph: nx.Graph) -> Dict[str, Any]:
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
