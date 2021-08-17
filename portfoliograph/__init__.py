from typing import Dict, Set, TYPE_CHECKING, NamedTuple
from enum import Enum
from psycopg2.extras import DictCursor
import networkx as nx

if TYPE_CHECKING:
    from dbtool import DbContext


class NodeType(Enum):
    NAME = 1
    BIZADDR = 2


class Node(NamedTuple):
    kind: NodeType
    name: str


class RegistrationInfo(NamedTuple):
    reg_id: int
    reg_contact_id: int


def exportgraph(db: 'DbContext'):
    g = nx.Graph()

    with db.connection() as conn:
        reg_bbl_map: Dict[int, Set[str]] = {}
        cur = conn.cursor(cursor_factory=DictCursor)

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
            name = f"{row['firstname']} {row['lastname']}"
            aptno: str = row['businessapartment']
            aptno = f" {aptno}" if aptno else ""
            bizaddr = (
                f"{row['businesshousenumber']} "
                f"{row['businessstreetname']}{aptno}, "
                f"{row['businesscity']} {row['businessstate']}"
            )
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
        # TODO: Retrieve hpd registrations/contact info.
        #
        # * ignore registrations expired over X days.
        # * process synonyms (e.g. folks in pinnacle)
        #
        # For reference see:
        # https://github.com/JustFixNYC/hpd-graph-fun/blob/main/src/hpd_graph.rs
        #
        # cur.execute('SELECT COUNT(*) FROM hpd_registrations')
        # print(cur.fetchone()[0])

    print("Finding connected components.")
    for c in nx.connected_components(g):
        induced_subgraph = g.subgraph(c).copy()
        from networkx.readwrite.json_graph import cytoscape_data
        print(cytoscape_data(induced_subgraph))
        break
        # print("WOO", nx.components.number_connected_components(induced_subgraph))
