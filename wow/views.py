import csv
import functools
import logging
from typing import Dict, Any, List
from pathlib import Path
from django.http import HttpResponse, JsonResponse, Http404
from django.core.exceptions import ValidationError

from .dbutil import call_db_func, exec_db_query
from . import csvutil


MY_DIR = Path(__file__).parent.resolve()

SQL_DIR = MY_DIR / 'sql'

logger = logging.getLogger(__name__)


def apply_cors_policy(request, response):
    response['Access-Control-Allow-Origin'] = '*'
    return response


def api(fn):
    '''
    Decorator for an API endpoint.
    '''

    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        request.is_api_request = True        
        response = fn(request, *args, **kwargs)
        return apply_cors_policy(request, response)

    return wrapper


@api
def address_query(request):
    block = request.GET.get('block', '')
    lot = request.GET.get('lot', '')
    borough = request.GET.get('borough', '')
    bbl = borough + block + lot

    # TODO: validate bbl, return 400 if it's bad.

    # TODO: the original API also sometimes got 'houseNumber', 'street', 'borough' query
    # args, in which case it would look up the BBL. Not sure if we need to do that here.

    addrs = call_db_func('get_assoc_addrs_from_bbl', [bbl])

    return JsonResponse({
        "geosearch": {
            "geosupportReturnCode": "00",
            "bbl": bbl,
        },
        "addrs": addrs,
    })


@api
def address_dap_aggregate(request):
    '''
    This endpoint is used specifically by the DAP Portal:

        https://portal.displacementalert.org/

    We should make sure we don't change its behavior without
    notifying them.
    '''

    return address_aggregate(request)


@api
def address_aggregate(request):
    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    result = call_db_func('get_agg_info_from_bbl', [bbl])
    return JsonResponse({ 'result': result })


@api
def address_buildinginfo(request):
    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    result = exec_db_query(SQL_DIR / 'address_buildinginfo.sql', { 'bbl': bbl })
    return JsonResponse({ 'result': result })


@api
def address_indicatorhistory(request):
    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    result = exec_db_query(SQL_DIR / 'address_indicatorhistory.sql', { 'bbl': bbl })
    return JsonResponse({ 'result': result })


@api
def address_export(request):
    # TODO: The old version of this endpoint accepted
    # 'houseNumber', 'street', 'borough' args; we should reject those w/ 400,
    # since it would require us to make a network request to geosearch, which
    # we don't currently support.

    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    addrs = call_db_func('get_assoc_addrs_from_bbl', [bbl])

    if not addrs:
        raise Http404()

    first_row = addrs[0]

    for addr in addrs:
        addr['ownernames'] = csvutil.stringify_owners(addr['ownernames'])
        csvutil.stringify_lists(addr)

    # https://docs.djangoproject.com/en/3.0/howto/outputting-csv/
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="wow-addresses-{bbl}.csv"'

    writer = csv.DictWriter(response, list(first_row.keys()))
    writer.writeheader()
    writer.writerows(addrs)

    return response


def server_error(request):
    if getattr(request, 'is_api_request', False) is True:
        return apply_cors_policy(request, JsonResponse(
            {'error': 'An internal server error occurred.'},
            status=500,
        ))

    from django.views import defaults
    return defaults.server_error(request)
