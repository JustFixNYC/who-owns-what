from typing import Dict, Set


RegBblMap = Dict[int, Set[str]]


def build_reg_bbl_map(dict_cursor) -> RegBblMap:
    reg_bbl_map: RegBblMap = {}

    # TODO: ignore registrations expired over X days.

    dict_cursor.execute("""
        SELECT registrationid, bbl FROM hpd_registrations
    """)
    for reg_id, bbl in dict_cursor.fetchall():
        if reg_id not in reg_bbl_map:
            reg_bbl_map[reg_id] = set()
        reg_bbl_map[reg_id].add(bbl)

    return reg_bbl_map
