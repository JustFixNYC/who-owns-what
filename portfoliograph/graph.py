from pathlib import Path
from typing import Any, Dict, Iterable, List, NamedTuple
import networkx as nx


SQL_DIR = Path(__file__).parent.resolve() / "sql"


class ConnectedLandlordRow(NamedTuple):
    nodeid: int
    name: str
    bizaddr: str
    registrationids: List[int]
    bbls: List[str]
    name_matches: List[int]
    bizaddr_matches: List[int]


def build_graph(dict_cursor) -> nx.Graph:
    g = nx.Graph()

    landlords_with_connections = (
        SQL_DIR / "landlords_with_connections.sql"
    ).read_text()
    dict_cursor.execute(landlords_with_connections)
    contacts = [ConnectedLandlordRow(**row) for row in dict_cursor.fetchall()]

    for contact in contacts:
        # TODO: cut back to only what's neded for the new vizualization
        g.add_node(
            contact.nodeid,
            name=contact.name,
            bizAddr=contact.bizaddr,
            registrationids=contact.registrationids,
            bbls=contact.bbls,
        )

    for contact in contacts:
        node1 = contact.nodeid
        for node2 in contact.name_matches:
            if not g.has_edge(node1, node2):
                g.add_edge(node1, node2, type="name")
        for node2 in contact.bizaddr_matches:
            if not g.has_edge(node1, node2):
                g.add_edge(node1, node2, type="bizaddr")

    return g


def component_to_graph(graph: nx.Graph, component: Any) -> nx.Graph:
    # G.subgraph(component) is not actually the same as the original graph
    # object type that we need to do splitting operations.
    # https://networkx.org/documentation/stable/reference/classes/generated/networkx.Graph.subgraph.html

    # It seems like this process is slow, so may want to only do this if we know
    # we need to split the component
    subgraph = graph.__class__()
    subgraph.add_nodes_from((n, graph.nodes[n]) for n in component)
    if subgraph.is_multigraph():
        subgraph.add_edges_from(
            (n, nbr, key, d)
            for n, nbrs in graph.adj.items()
            if n in component
            for nbr, keydict in nbrs.items()
            if nbr in component
            for key, d in keydict.items()
        )
    else:
        subgraph.add_edges_from(
            (n, nbr, d)
            for n, nbrs in graph.adj.items()
            if n in component
            for nbr, d in nbrs.items()
            if nbr in component
        )
    subgraph.graph.update(graph.graph)
    return subgraph


def get_connected_component_subgraphs(graph: nx.Graph) -> Iterable[Any]:
    for component in nx.connected_components(graph):
        # if "need-to-split":
        #     subgraph = component_to_graph(graph, component)
        subgraph = graph.subgraph(component)
        yield subgraph


def split_graph(graph: nx.Graph) -> Iterable[nx.Graph]:
    for initial_portfolio_graph in get_connected_component_subgraphs(graph):
        # TODO: split the graph when necessary
        yield initial_portfolio_graph


def to_json_graph(graph: nx.Graph) -> Dict[str, Any]:
    """
    Output a portfolio's graph as JSON based on this schema:

    https://github.com/JustFixNYC/hpd-graph-fun/blob/main/typescript/portfolio.d.ts
    """

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    for node in graph.nodes(data=True):
        nodes.append(
            {
                "id": node[0],
                "value": node[1],
            }
        )
    for (_from, to, attrs) in graph.edges(data=True):
        edges.append(
            {
                "from": _from,
                "to": to,
                "type": attrs["type"],
            }
        )
    return {
        "nodes": nodes,
        "edges": edges,
    }
