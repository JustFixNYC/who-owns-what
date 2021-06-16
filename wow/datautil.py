import json
from json.decoder import JSONDecoder
from typing import Optional, Any


def int_or_none(val: Any) -> Optional[int]:
    if val is None:
        return None
    else:
        return int(val)


def float_or_none(val: Any) -> Optional[float]:
    if val is None:
        return None
    else:
        return float(val)


def str_or_none(val: Any) -> Optional[str]:
    if val is None:
        return None
    else:
        return str(val)


def json_or_none(val: Any) -> Optional[JSONDecoder]:
    if val is None:
        return None
    else:
        return json.loads(val)
