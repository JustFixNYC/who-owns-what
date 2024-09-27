import csv
import logging
from pathlib import Path
from typing import Any, Dict
from django.http import HttpResponse, JsonResponse

from .dbutil import call_db_func, exec_db_query, exec_sql
from .datautil import int_or_none, float_or_none
from . import csvutil, apiutil
from .apiutil import (
    api,
    authorize_for_signature,
    get_validated_form_data,
    authorize_for_alerts,
)
from .forms import (
    DatasetLastUpdatedForm,
    EmailAlertLaggedEvictionFilingsForm,
    EmailAlertMultiIndicatorForm,
    EmailAlertSingleIndicatorForm,
    EmailAlertViolationsForm,
    PaddedBBLForm,
    SeparatedBBLForm,
    SignatureCollectionForm,
)


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
def address_query_wowza(request):
    bbl = get_bbl_from_request(request)
    addrs = exec_db_query(SQL_DIR / "address_portfolio.sql", {"bbl": bbl})
    cleaned_addrs = []
    # Note: HPD unregistered properties will return an empty addrs array from the SQL query
    if addrs:
        cleaned_addrs = list(map(clean_addr_dict, addrs))

    return JsonResponse(
        {
            "geosearch": {"bbl": bbl},
            "addrs": cleaned_addrs,
        }
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


@api
def address_dap_portfoliosize(request):
    """
    This API endpoint receives requests with a 10-digit BBL and
    responds with:
    - the size of the portfolio associated with the BBL
    OR
    - None, if the BBL is not registered with HPD

    This endpoint is used specifically by the DAP Portal:

        https://portal.displacementalert.org/

    We should make sure we don't change its behavior without
    notifying them.
    """

    bbl = get_request_bbl(request)
    result = exec_db_query(SQL_DIR / "address_portfoliosize.sql", {"bbl": bbl})
    return JsonResponse({"result": (result[0] if result else None)})


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


@api
def address_latestdeed(request):
    """
    This API endpoint receives requests with a 10-digit BBL and
    responds with the most recent deed document from ACRIS (includes
    all BBLS, not just those included in WOW tables).

    This endpoint is used exclusively by Unlock NYC.

    We should make sure we don't change its behavior without
    notifying them.
    """
    bbl = get_request_bbl(request)
    result = exec_db_query(SQL_DIR / "address_latestdeed.sql", {"bbl": bbl})
    return JsonResponse({"result": list(result)})


@api
def alerts_violations(request):
    """
    This API endpoint receives requests with a 10-digit BBL, start_date
    and end_date (yyyy-mm-dd), and responds with the number of HPD violations
    that the property recieved within that time period.
    """
    args = get_validated_form_data(EmailAlertViolationsForm, request.GET)
    query_params = {
        "bbl": args["bbl"],
        "start_date": args["start_date"],
        "end_date": args["end_date"],
    }
    result = exec_db_query(
        SQL_DIR / "alerts_violations.sql",
        query_params,
    )
    result[0].update(query_params)
    return JsonResponse({"result": list(result)})


@api
def email_alerts_lagged_eviction_filings(request):
    """
    This API endpoint receives requests with a 10-digit BBL and prev_date
    (yyyy-mm-dd) for the date of the previously sent email. It responds with a
    count of eviction cases that were filed before the last email was sent but
    have only appeared in the database after that date (ie. lagged filings).
    """
    authorize_for_alerts(request)
    args = get_validated_form_data(EmailAlertLaggedEvictionFilingsForm, request.GET)
    query_params = {
        "bbl": args["bbl"],
        "prev_date": args["prev_date"],
        "oldest_filed_date": args["oldest_filed_date"],
    }
    query_sql = SQL_DIR / "alerts_lagged_eviction_filings.sql"
    result = exec_db_query(query_sql, query_params)
    result[0].update(query_params)
    return JsonResponse({"result": list(result)})


ALERTS_QUERIES = {
    "violations": SQL_DIR / "alerts_violations.sql",
    "complaints": SQL_DIR / "alerts_complaints.sql",
    "eviction_filings": SQL_DIR / "alerts_eviction_filings.sql",
    "lagged_eviction_filings": SQL_DIR / "alerts_lagged_eviction_filings.sql",
    "hpd_link": SQL_DIR / "alerts_hpd_link.sql",
}


def combine_alert_subqueries(indicators):
    cte_subqueries = [f"{i} as ( {ALERTS_QUERIES[i].read_text()} )" for i in indicators]
    return f"""
    with {",".join(cte_subqueries)}
    select *
    from {','.join(indicators)}
    """


@api
def email_alerts(request):
    """
    This API endpoint receives requests with a 10-digit BBL, start_date
    and end_date (yyyy-mm-dd), and an indicator name. It responds with the
    value for that indicator for the property over the time period.
    """
    authorize_for_alerts(request)
    args = get_validated_form_data(EmailAlertSingleIndicatorForm, request.GET)
    sql_file = ALERTS_QUERIES[args["indicator"]]
    query_params = {
        "bbl": args["bbl"],
        "start_date": args["start_date"],
        "end_date": args["end_date"],
        "prev_date": args["prev_date"],
    }
    result = exec_db_query(sql_file, query_params)
    result[0].update(query_params)
    return JsonResponse({"result": list(result)})


@api
def email_alerts_multi(request):
    """
    This API endpoint receives requests with a 10-digit BBL, start_date
    and end_date (yyyy-mm-dd), and a comma-separated list of indicator names.
    It responds with the value for each of those indicators for that
    property over the time period.
    """
    authorize_for_alerts(request)
    args = get_validated_form_data(EmailAlertMultiIndicatorForm, request.GET)
    query_params = {
        "bbl": args["bbl"],
        "start_date": args["start_date"],
        "end_date": args["end_date"],
        "prev_date": args["prev_date"],
    }
    sql_query = combine_alert_subqueries(args["indicators"])
    result = exec_sql(sql_query, query_params)
    result[0].update(query_params)
    return JsonResponse({"result": list(result)})


@api
def signature_building(request):
    """
    This API endpoint receives requests with a 10-digit BBL. It responds with a
    collection of data to populate a building page of the Signature Dashboard.
    """
    authorize_for_signature(request)
    bbl = get_request_bbl(request)
    result = exec_db_query(SQL_DIR / "signature_building.sql", {"bbl": bbl})
    return JsonResponse({"result": list(result)})


@api
def signature_building_charts(request):
    """
    This API endpoint receives requests with a 10-digit BBL. It responds with a
    collection of data to populate the charts for that building's page of the
    Signature Dashboard.
    """
    authorize_for_signature(request)
    bbl = get_request_bbl(request)
    result = exec_db_query(SQL_DIR / "signature_building_charts.sql", {"bbl": bbl})
    return JsonResponse({"result": list(result)})


@api
def signature_collection(request):
    """
    This API endpoint receives requests with a collection name (landlord,
    loan_pool, all). It responds with a collection of data to populate a collection
    page of the Signature Dashboard with summary values and building-level data
    in json.
    """
    authorize_for_signature(request)
    collection = get_validated_form_data(SignatureCollectionForm, request.GET)[
        "collection"
    ]
    result = exec_db_query(
        SQL_DIR / "signature_collection.sql", {"collection": collection}
    )
    return JsonResponse({"result": list(result)})


@api
def signature_collection_charts(request):
    """
    This API endpoint receives requests with a collection name (landlord,
    loan_pool, all). It responds with a collection of data to populate the charts
    on a collection page of the Signature Dashboard.
    """
    authorize_for_signature(request)
    collection = get_validated_form_data(SignatureCollectionForm, request.GET)[
        "collection"
    ]
    result = exec_db_query(
        SQL_DIR / "signature_collection_charts.sql", {"collection": collection}
    )
    return JsonResponse({"result": list(result)})


@api
def signature_landlords(request):
    """
    This API endpoint returns data for all landlords in the signature program,
    along with select aggregate indicators, to populate a table on the landlord
    search page of the dashabord
    """
    authorize_for_signature(request)
    result = exec_db_query(SQL_DIR / "signature_landlords.sql")
    return JsonResponse({"result": list(result)})


@api
def signature_portfolios(request):
    """
    This API endpoint returns data on signature/loan-pool portfolios for home page cards.
    """
    authorize_for_signature(request)
    result = exec_db_query(SQL_DIR / "signature_portfolios.sql")
    return JsonResponse({"result": list(result)})


@api
def signature_map(request):
    """
    This API endpoint returns data on all properties in the signature portfolio
    for the dedicated map page.
    """
    authorize_for_signature(request)
    result = exec_db_query(SQL_DIR / "signature_map.sql")
    return JsonResponse({"result": list(result)})


@api
def dataset_last_updated(request):
    """
    This API endpoint returns data on all properties in the signature portfolio
    for the dedicated map page.
    """
    args = get_validated_form_data(DatasetLastUpdatedForm, request.GET)
    if args["dataset"] != "":
        result = exec_db_query(
            SQL_DIR / "dataset_last_updated.sql", {"dataset": args["dataset"]}
        )
    else:
        result = exec_db_query(SQL_DIR / "dataset_last_updated_all.sql")
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
