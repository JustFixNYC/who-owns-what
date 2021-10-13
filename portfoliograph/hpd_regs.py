from typing import Dict, Set


RegBblMap = Dict[int, Set[str]]


def build_reg_bbl_map(dict_cursor) -> RegBblMap:
    reg_bbl_map: RegBblMap = {}
    dict_cursor.execute(
        f"""
        SELECT registrationid, first(bbl) bbl
        FROM (
            SELECT * FROM hpd_registrations
            ORDER BY registrationenddate DESC
        ) REGS
        GROUP BY registrationid
    """
    )
    for reg_id, bbl in dict_cursor.fetchall():
        if reg_id not in reg_bbl_map:
            reg_bbl_map[reg_id] = set()
        reg_bbl_map[reg_id].add(bbl)

    return reg_bbl_map
