from pathlib import Path
from typing import Any, Dict, Callable, Iterator, List, NamedTuple
import networkx as nx
from networkx.algorithms import community


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


def portfolio_size(portfolio_subgraph):
    n_bbls = sum([len(node[1]["bbls"]) for node in portfolio_subgraph.nodes(data=True)])
    return n_bbls


def portfolio_is_too_big(portfolio_subgraph: Any) -> bool:
    MAX_SIZE = 300
    n_bbls = portfolio_size(portfolio_subgraph)
    return n_bbls > MAX_SIZE


def split_subgraph_if(
    graph: nx.Graph, subgraph: Any, predicate: Callable[[Any], bool], id: int
):
    RESOLUTION = 0.1
    if predicate(subgraph):
        for comm in community.louvain_communities(subgraph, resolution=RESOLUTION):
            comm_subgraph = graph.subgraph(comm)
            if portfolio_size(comm_subgraph) == portfolio_size(subgraph):
                yield (id, comm_subgraph)
            else:
                yield from split_subgraph_if(graph, comm_subgraph, predicate, id)
    else:
        yield (id, subgraph)


def iter_split_graph(graph: nx.Graph) -> Iterator[Any]:
    for id, cc in enumerate(nx.connected_components(graph), 1):
        portfolio_subgraph = graph.subgraph(cc)
        yield from split_subgraph_if(
            graph, portfolio_subgraph, portfolio_is_too_big, id
        )


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
