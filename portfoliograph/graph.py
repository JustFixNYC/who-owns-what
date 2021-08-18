from typing import Any, Dict, List, NamedTuple
from enum import Enum
import networkx as nx


class NodeKind(Enum):
    NAME = 1
    BIZADDR = 2


class Node(NamedTuple):
    kind: NodeKind
    name: str

    def to_json(self) -> Dict[str, Any]:
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


def build_graph(dict_cursor) -> nx.Graph:
    g = nx.Graph()

    # TODO: ignore registrations expired over X days.
    # TODO: process synonyms (e.g. folks in pinnacle)
    # TODO: This SQL query needs to be more awesome, see:
    # https://github.com/JustFixNYC/who-owns-what/pull/524#discussion_r690589851
    dict_cursor.execute("""
        SELECT * FROM hpd_contacts
        WHERE
            type = any('{HeadOfficer,IndividualOwner,CorporateOwner}') AND
            businesshousenumber != '' AND
            businessstreetname != '' AND
            firstname != '' AND
            lastname != ''
    """)
    for row in dict_cursor.fetchall():
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

    return g


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
