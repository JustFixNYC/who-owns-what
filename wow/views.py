import csv
from typing import Dict, Any, List
from pathlib import Path
from django.http import HttpResponse, JsonResponse, Http404
from django.db import connections


MY_DIR = Path(__file__).parent.resolve()

SQL_DIR = MY_DIR / 'sql'


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


def call_db_func(name: str, params: List[Any]) -> List[Dict[str, Any]]:
    with connections['wow'].cursor() as cursor:
        cursor.callproc(name, params)
        return dictfetchall(cursor)


def exec_db_query(sql_file: Path, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    sql = sql_file.read_text()
    with connections['wow'].cursor() as cursor:
        cursor.execute(sql, params)
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
    return make_json_response({ 'result': result })


def address_buildinginfo(request):
    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    result = exec_db_query(SQL_DIR / 'address_buildinginfo.sql', { 'bbl': bbl })
    return make_json_response({ 'result': result })


def address_indicatorhistory(request):
    bbl = request.GET.get('bbl', '')

    # TODO: validate bbl, return 400 if it's bad.

    result = exec_db_query(SQL_DIR / 'address_indicatorhistory.sql', { 'bbl': bbl })
    return make_json_response({ 'result': result })


def stringify_owners(owners: List[Dict[str, str]]) -> str:
    return ', '.join([
        f"{owner['value']} ({owner['title']})"
        for owner in owners
    ])


def stringify_lists(d: Dict[str, Any]):
    for key, value in d.items():
        if isinstance(value, list):
            d[key] = ','.join([str(v) for v in value])


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
        addr['ownernames'] = stringify_owners(addr['ownernames'])
        stringify_lists(addr)

    # https://docs.djangoproject.com/en/3.0/howto/outputting-csv/
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="wow-addresses-{bbl}.csv"'
    response['Access-Control-Allow-Origin'] = '*'

    writer = csv.DictWriter(response, list(first_row.keys()))
    writer.writeheader()
    writer.writerows(addrs)

    return response
