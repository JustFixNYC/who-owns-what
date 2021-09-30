from datetime import timedelta, date
from typing import Dict, Set


RegBblMap = Dict[int, Set[str]]


DEFAULT_MAX_EXPIRATION_AGE = timedelta(days=365)


def hpd_reg_where_clause(max_expiration_age: timedelta = DEFAULT_MAX_EXPIRATION_AGE):
    today = date.today()
    max_reg_end_date = (today - max_expiration_age).isoformat()
    return f"hpd_registrations.registrationenddate > '{max_reg_end_date}'"


def build_reg_bbl_map(dict_cursor) -> RegBblMap:
    reg_bbl_map: RegBblMap = {}
    dict_cursor.execute(
        f"""
        SELECT registrationid, bbl
        FROM hpd_registrations
        WHERE {hpd_reg_where_clause()}
    """
    )
    for reg_id, bbl in dict_cursor.fetchall():
        if reg_id not in reg_bbl_map:
            reg_bbl_map[reg_id] = set()
        reg_bbl_map[reg_id].add(bbl)

    return reg_bbl_map
