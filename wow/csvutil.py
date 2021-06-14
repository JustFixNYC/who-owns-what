from typing import List, Dict, Any


def stringify_owners(owners: List[Dict[str, str]]) -> str:
    return ', '.join([
        f"{owner['value']} ({owner['title']})"
        for owner in owners
    ])


def stringify_complaints(complaints: List[Dict[str, str]]) -> str:
    if complaints:
        return ', '.join([
            f"{complaint['type']} ({complaint['count']})"
            for complaint in complaints
        ])
    else:
        return ''


def stringify_lists(d: Dict[str, Any]):
    for key, value in d.items():
        if isinstance(value, list):
            d[key] = ','.join([str(v) for v in value])
