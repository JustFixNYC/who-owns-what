from typing import Dict, Set


RegBblMap = Dict[int, Set[str]]


def build_reg_bbl_map(dict_cursor) -> RegBblMap:
    reg_bbl_map: RegBblMap = {}
    # For each BBL, we grab the most recent registrationid we have on file.
    # We define 'most recent' to mean a registration with the most recent
    # expiration date and, if there is a tie, most recent non-null registration date
    dict_cursor.execute(
        f"""
        SELECT FIRST(registrationid) registrationid, bbl
        FROM (
            SELECT * FROM hpd_registrations
            ORDER BY registrationenddate DESC, lastregistrationdate DESC NULLS LAST
        ) REGS
        GROUP BY bbl
    """
    )
    for reg_id, bbl in dict_cursor.fetchall():
        if reg_id not in reg_bbl_map:
            reg_bbl_map[reg_id] = set()
        reg_bbl_map[reg_id].add(bbl)

    return reg_bbl_map
