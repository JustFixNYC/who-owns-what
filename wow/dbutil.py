from pathlib import Path
from typing import List, Dict, Any
from django.db import connections


def dictfetchall(cursor):
    # https://docs.djangoproject.com/en/3.0/topics/db/sql/#executing-custom-sql-directly
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def call_db_func(name: str, params: List[Any]) -> List[Dict[str, Any]]:
    with connections['wow'].cursor() as cursor:
        cursor.callproc(name, params)
        return dictfetchall(cursor)


def exec_db_query(sql_file: Path, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    sql = sql_file.read_text()
    with connections['wow'].cursor() as cursor:
        cursor.execute(sql, params)
        return dictfetchall(cursor)
