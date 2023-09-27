from typing import Any, Dict, List, NamedTuple, Optional
from enum import Enum
import networkx as nx


class NodeKind(Enum):
    NAME = "name"
    BIZADDR = "bizaddr"


class Node(NamedTuple):
    kind: NodeKind
    value: str

    def to_json(self) -> Dict[str, str]:
        return {
            "kind": self.kind.value,
            "value": self.value,
        }


class RegistrationInfo(NamedTuple):
    reg_id: int
    reg_contact_id: int


def join_truthies(*items: Optional[str], sep=" ") -> str:
    """
    Joins the given arguments with a space (or provided separator),
    filtering out anything that is falsy, e.g.:

        >>> join_truthies('boop', 'jones')
        'boop jones'

        >>> join_truthies('boop', '')
        'boop'

        >>> join_truthies(None, 'jones')
        'jones'

        >>> join_truthies('New York', 'NY', sep=', ')
        'New York, NY'
    """

    return sep.join(filter(None, items))


def build_graph(dict_cursor) -> nx.Graph:
    g = nx.Graph()
    dict_cursor.execute("SELECT * FROM hpd_contacts_with_connections")
    contacts = dict_cursor.fetchall()
    print(contacts[0])

    for contact in contacts:
        g.add_node(
            contact["nodeid"],
            name=contact["name"],
            bizAddr=contact["bizaddr"],
            registrationids=contact["registrationids"],
            bbls=contact["bbls"],
        )
    for contact in contacts: 
        node1 = contact["nodeid"]
        for node2 in contact["name_matches"]:
            if not g.has_edge(node1, node2):
                g.add_edge(node1, node2, type="name")
        for node2 in contact["bizaddr_matches"]:
            if not g.has_edge(node1, node2):
                g.add_edge(node1, node2, type="bizaddr")

    return g


def to_json_graph(graph: nx.Graph) -> Dict[str, Any]:
    """
    Output a portfolio's graph as JSON based on this schema:

    https://github.com/JustFixNYC/hpd-graph-fun/blob/main/typescript/portfolio.d.ts
    """

    node_indexes: Dict[Node, int] = {}
    counter = 1
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    for node in graph:
        node_indexes[node] = counter
        nodes.append(
            {
                "id": counter,
                "value": node.to_json(),
            }
        )
        counter += 1
    for (_from, to, attrs) in graph.edges.data():
        edges.append(
            {
                "from": node_indexes[_from],
                "to": node_indexes[to],
                "reg_contacts": len(attrs["hpd_regs"]),
            }
        )
    return {
        "nodes": nodes,
        "edges": edges,
    }
