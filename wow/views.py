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


def address_query(request):
    block = request.GET.get('block', '')
    lot = request.GET.get('lot', '')
    borough = request.GET.get('borough', '')
    bbl = borough + block + lot

    # TODO: validate bbl, return 400 if it's bad.

    # TODO: the original API also sometimes got 'houseNumber', 'street', 'borough' query
    # args, in which case it would look up the BBL. Not sure if we need to do that here.

    with connections['wow'].cursor() as cursor:
        cursor.callproc('get_assoc_addrs_from_bbl', [bbl])
        addrs = dictfetchall(cursor)
        res = JsonResponse({
            "geosearch": {
                "geosupportReturnCode": "00",
                "bbl": bbl,
            },
            "addrs": addrs,
        })
        res['Access-Control-Allow-Origin'] = '*'
        return res
