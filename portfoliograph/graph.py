from pathlib import Path
from typing import Any, Dict, Callable, Iterator, List, NamedTuple
from collections import Counter
import networkx as nx


SQL_DIR = Path(__file__).parent.resolve() / "sql"


class ConnectedLandlordRow(NamedTuple):
    nodeid: int
    name: str
    bizaddr: str
    bbls: List[str]
    name_match_info: List[Dict[str, float]]
    bizaddr_match_info: List[Dict[str, float]]


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
            bbls=contact.bbls,
        )

    for contact in contacts:
        nodeid = contact.nodeid

        if contact.name_match_info:
            for match in contact.name_match_info:
                if not g.has_edge(nodeid, match["nodeid"]):
                    g.add_edge(
                        nodeid, match["nodeid"], type="name", weight=match["weight"]
                    )

        if contact.bizaddr_match_info:
            for match in contact.bizaddr_match_info:
                if not g.has_edge(nodeid, match["nodeid"]):
                    g.add_edge(
                        nodeid, match["nodeid"], type="bizaddr", weight=match["weight"]
                    )

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
        for comm in nx.community.louvain_communities(
            subgraph, resolution=RESOLUTION, weight="weight"
        ):
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

    ret_nodes: List[Dict[str, Any]] = []
    ret_edges: List[Dict[str, Any]] = []

    raw_nodes = [n for n in graph.nodes(data=True)]

    # Identify common names/addresses for "compound"/group nodes in viz
    all_names = [n[1]["name"] for n in raw_nodes]
    all_bizaddrs = [n[1]["bizAddr"] for n in raw_nodes]
    parent_names = [x for x, n in Counter(all_names).most_common() if n > 4]
    parent_bizaddrs = [x for x, n in Counter(all_bizaddrs).most_common() if n > 4]
    name_nodes = [{"id": name, "type": "name"} for name in parent_names]
    bizaddr_nodes = [{"id": bizaddr, "type": "bizAddr"} for bizaddr in parent_bizaddrs]

    ret_nodes.extend(name_nodes + bizaddr_nodes)

    for id, attrs in raw_nodes:
        node_values = {
            "id": id,
            "type": "owner",
            "name": attrs["name"],
            "bizAddr": attrs["bizAddr"],
            "bbls": attrs["bbls"],
        }

        # Can only have one parent, so prioritize bizaddr
        if attrs["bizAddr"] in parent_bizaddrs:
            node_values.update({"parent": attrs["bizAddr"]})
        elif attrs["name"] in parent_names:
            node_values.update({"parent": attrs["name"]})

        ret_nodes.append(node_values)

    for (_from, to, attrs) in graph.edges(data=True):
        ret_edges.append(
            {
                "source": _from,
                "target": to,
                "type": attrs["type"],
                "weight": attrs["weight"],
            }
        )
    return {
        "nodes": ret_nodes,
        "edges": ret_edges,
    }
