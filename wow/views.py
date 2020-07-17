from typing import Dict, Any, List
from django.http import HttpResponse, JsonResponse
from django.db import connections


def hello(request):
    return HttpResponse("hello world")


def dictfetchall(cursor):
    # https://docs.djangoproject.com/en/3.0/topics/db/sql/#executing-custom-sql-directly
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def make_json_response(obj: Dict[str, Any]) -> JsonResponse:
    res = JsonResponse(obj)
    res['Access-Control-Allow-Origin'] = '*'
    return res


def call_db_func(name: str, params: List[Any]) -> Any:
    with connections['wow'].cursor() as cursor:
        cursor.callproc(name, params)
        return dictfetchall(cursor)


def address_query(request):
    block = request.GET.get('block', '')
    lot = request.GET.get('lot', '')
    borough = request.GET.get('borough', '')
    bbl = borough + block + lot

    # TODO: validate bbl, return 400 if it's bad.

    # TODO: the original API also sometimes got 'houseNumber', 'street', 'borough' query
    # args, in which case it would look up the BBL. Not sure if we need to do that here.

    addrs = call_db_func('get_assoc_addrs_from_bbl', [bbl])

    return make_json_response({
        "geosearch": {
            "geosupportReturnCode": "00",
            "bbl": bbl,
        },
        "addrs": addrs,
    })


def address_dap_aggregate(request):
    '''
    This endpoint is used specifically by the DAP Portal:

        https://portal.displacementalert.org/

    We should make sure we don't change its behavior without
    notifying them.
    '''

    return address_aggregate(request)


def address_aggregate(request):
    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    result = call_db_func('get_agg_info_from_bbl', [bbl])

    return make_json_response({
        'result': result,
    })


def address_buildinginfo(request):
    raise NotImplementedError()


def address_indicatorhistory(request):
    raise NotImplementedError()


def address_export(request):
    raise NotImplementedError()
