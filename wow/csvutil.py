from typing import List, Dict, Any, Optional


def stringify_owners(owners: List[Dict[str, str]]) -> str:
    return ', '.join([
        f"{owner['value']} ({owner['title']})"
        for owner in owners
    ])


def stringify_contact_address(address: Optional[Dict[str, str]]) -> str:
    if address:
        housenumber = f"{address['housenumber']} " if address['housenumber'] else ''
        apartment = f"{address['apartment']} " if address['apartment'] else ''
        zip = f"{address['zip']}" if address['zip'] else ''
        return f"—{housenumber}{address['streetname']} {apartment}{zip}"
    else:
        return ''


def stringify_full_contacts(contacts: List[Dict[str, Any]]) -> str:
    if contacts:
        return ', '.join([
            f"{contact['value']} ({contact['title']})"
            f"{stringify_contact_address(contact['address'])}"
            for contact in contacts])
    else:
        return ''


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
