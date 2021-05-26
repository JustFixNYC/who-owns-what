from typing import List, Dict, Any


def stringify_owners(owners: List[Dict[str, str]]) -> str:
    return ', '.join([
        f"{owner['value']} ({owner['title']})"
        for owner in owners
    ])


def stringify_complaint_types(complaints: List[Dict[str, str]]) -> str:
    return ', '.join([
        f"{complaint['type']} ({complaint['title']})"
        for complaint in complaints
    ])


def stringify_lists(d: Dict[str, Any]):
    for key, value in d.items():
        if isinstance(value, list):
            d[key] = ','.join([str(v) for v in value])
