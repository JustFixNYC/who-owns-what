import csv
import logging
from pathlib import Path
from typing import Any, Dict
from django.http import HttpResponse, JsonResponse

from .dbutil import call_db_func, exec_db_query
from .datautil import int_or_none, float_or_none
from . import csvutil, apiutil
from .apiutil import api, get_validated_form_data
from .forms import PaddedBBLForm, SeparatedBBLForm


MY_DIR = Path(__file__).parent.resolve()

SQL_DIR = MY_DIR / "sql"

logger = logging.getLogger(__name__)


def log_unsupported_request_args(request):
    """
    Some original API endpoints sometimes got 'houseNumber', 'street',
    'borough' query args, in which case it would look up the BBL. This
    new implementation of the API doesn't currently support them but
    we do want to log anytime we happen to get requests for them, to
    diagnose whether we need to support them.
    """

    unsupported_args = ["houseNumber", "street", "borough"]
    if set(request.GET.keys()).issuperset(unsupported_args):
        logger.error(
            f'Request contains unsupported arguments: {", ".join(unsupported_args)}'
        )


def clean_addr_dict(addr):
    return {
        **addr,
        "bin": str(addr["bin"]),
        "lastsaleamount": int_or_none(addr["lastsaleamount"]),
        "registrationid": str(addr["registrationid"]),
    }


def get_bbl_from_request(request):
    log_unsupported_request_args(request)
    args = get_validated_form_data(SeparatedBBLForm, request.GET)
    return args["borough"] + args["block"] + args["lot"]


@api
def address_query(request):
    bbl = get_bbl_from_request(request)
    addrs = call_db_func("get_assoc_addrs_from_bbl", [bbl])
    cleaned_addrs = map(clean_addr_dict, addrs)

    return JsonResponse(
        {
            "geosearch": {
                "bbl": bbl,
            },
            "addrs": list(cleaned_addrs),
        }
    )


@api
def address_query_with_portfolio_graph(request):
    bbl = get_bbl_from_request(request)
    addrs = exec_db_query(SQL_DIR / "address_portfolio.sql", {"bbl": bbl})
    graph = None
    cleaned_addrs = []
    # Note: HPD unregistered properties will return an empty addrs array from the SQL query
    if addrs:
        # To save memory, graph json object is only stored on search address
        # even though it reflects the entire portfolio
        addrs_with_graph = list(filter(lambda r: r["graph"] is not None, addrs))
        if addrs_with_graph:
            graph = addrs_with_graph[0]["graph"]
        addrs_without_graph = [
            {k: v for k, v in a.items() if k != "graph"} for a in addrs
        ]
        cleaned_addrs = list(map(clean_addr_dict, addrs_without_graph))

    return JsonResponse(
        {"geosearch": {"bbl": bbl}, "addrs": cleaned_addrs, "graph": graph}
    )


@api
def address_dap_aggregate(request):
    """
    This endpoint is used specifically by the DAP Portal:

        https://portal.displacementalert.org/

    We should make sure we don't change its behavior without
    notifying them.
    """

    return address_aggregate(request)


def get_request_bbl(request) -> str:
    return get_validated_form_data(PaddedBBLForm, request.GET)["bbl"]


def clean_agg_info_dict(agg_info):
    return {
        **agg_info,
        "age": int_or_none(agg_info["age"]),
        "avgevictions": float_or_none(agg_info["avgevictions"]),
        "openviolationsperbldg": float_or_none(agg_info["openviolationsperbldg"]),
        "openviolationsperresunit": float_or_none(agg_info["openviolationsperresunit"]),
        "rsproportion": float_or_none(agg_info["rsproportion"]),
        "totalevictions": int_or_none(agg_info["totalevictions"]),
    }


@api
def address_aggregate(request):
    bbl = get_request_bbl(request)
    result = call_db_func("get_agg_info_from_bbl", [bbl])
    cleaned_result = map(clean_agg_info_dict, result)
    return JsonResponse({"result": list(cleaned_result)})


def clean_building_info_dict(building_info):
    return {
        **building_info,
        "nycha_dev_evictions": int_or_none(building_info["nycha_dev_evictions"]),
        "nycha_dev_unitsres": int_or_none(building_info["nycha_dev_unitsres"]),
    }


@api
def address_buildinginfo(request):
    bbl = get_request_bbl(request)
    result = exec_db_query(SQL_DIR / "address_buildinginfo.sql", {"bbl": bbl})
    cleaned_result = map(clean_building_info_dict, result)
    return JsonResponse({"result": list(cleaned_result)})


@api
def address_indicatorhistory(request):
    bbl = get_request_bbl(request)
    result = exec_db_query(SQL_DIR / "address_indicatorhistory.sql", {"bbl": bbl})
    return JsonResponse({"result": list(result)})


def _fixup_addr_for_csv(addr: Dict[str, Any]):
    addr["ownernames"] = csvutil.stringify_owners(addr["ownernames"] or [])
    addr["recentcomplaintsbytype"] = csvutil.stringify_complaints(
        addr["recentcomplaintsbytype"]
    )
    addr["allcontacts"] = csvutil.stringify_full_contacts(addr["allcontacts"] or [])
    csvutil.stringify_lists(addr)


@api
def address_export(request):
    log_unsupported_request_args(request)
    bbl = get_request_bbl(request)
    addrs = call_db_func("get_assoc_addrs_from_bbl", [bbl])

    if not addrs:
        return HttpResponse(status=404)

    first_row = addrs[0]

    for addr in addrs:
        _fixup_addr_for_csv(addr)

    # https://docs.djangoproject.com/en/3.0/howto/outputting-csv/
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="wow-addresses-{bbl}.csv"'

    writer = csv.DictWriter(response, list(first_row.keys()))
    writer.writeheader()
    writer.writerows(addrs)

    return response


def server_error(request):
    if apiutil.is_api_request(request):
        return apiutil.apply_cors_policy(
            request,
            JsonResponse(
                {"error": "An internal server error occurred."},
                status=500,
            ),
        )

    from django.views import defaults

    return defaults.server_error(request)
