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

    # TODO: process synonyms (e.g. folks in pinnacle)
    dict_cursor.execute(
        f"""
        WITH landlord_contacts AS (
            SELECT DISTINCT
                firstname,
                lastname,
                businesshousenumber,
                businessstreetname,
                businessapartment,
                businesscity,
                businessstate,
                hpd_contacts.registrationid,
                hpd_contacts.registrationcontactid,
                hpd_contacts.type
            FROM hpd_contacts
            INNER JOIN hpd_registrations
                ON hpd_contacts.registrationid = hpd_registrations.registrationid
            WHERE
                type = ANY('{{HeadOfficer, IndividualOwner, CorporateOwner, JointOwner}}')
                AND (businesshousenumber IS NOT NULL OR businessstreetname IS NOT NULL)
                AND LENGTH(CONCAT(businesshousenumber, businessstreetname)) > 2
                AND (firstname IS NOT NULL OR lastname IS NOT NULL)
        ),

        landlord_contacts_ordered AS (
            SELECT *
            FROM landlord_contacts
            ORDER BY (
                -- First, we prioritize certain owner types over others:
                ARRAY_POSITION(
                    ARRAY['IndividualOwner','HeadOfficer','JointOwner','CorporateOwner'],
                    landlord_contacts.type
                ),
                -- Then, we order by landlord name, just to make sure our sorting is deterministic:
                concat(firstname,' ',lastname)
            )
        )

        SELECT
            registrationid,
            FIRST(firstname) AS firstname,
            FIRST(lastname) AS lastname,
            FIRST(businesshousenumber) AS businesshousenumber,
            FIRST(businessstreetname) AS businessstreetname,
            FIRST(businessapartment) AS businessapartment,
            FIRST(businesscity) AS businesscity,
            FIRST(businessstate) AS businessstate,
            FIRST(registrationcontactid) AS registrationcontactid
        FROM landlord_contacts_ordered
        GROUP BY registrationid;
    """
    )
    for row in dict_cursor.fetchall():
        name = join_truthies(row["firstname"], row["lastname"]).upper()
        street_addr = join_truthies(
            row["businesshousenumber"],
            row["businessstreetname"],
            row["businessapartment"],
        ).upper()
        city_state = join_truthies(
            row["businesscity"],
            row["businessstate"],
        ).upper()
        bizaddr = join_truthies(street_addr, city_state, sep=", ")
        name_node = Node(NodeKind.NAME, name)
        bizaddr_node = Node(NodeKind.BIZADDR, bizaddr)
        g.add_node(name_node)
        g.add_node(bizaddr_node)
        if not g.has_edge(name_node, bizaddr_node):
            g.add_edge(name_node, bizaddr_node, hpd_regs=set())
        edge_data = g[name_node][bizaddr_node]
        edge_data["hpd_regs"].add(
            RegistrationInfo(
                reg_id=row["registrationid"],
                reg_contact_id=row["registrationcontactid"],
            )
        )

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
