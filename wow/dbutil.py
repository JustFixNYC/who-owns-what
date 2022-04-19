from pathlib import Path
from typing import List, Dict, Any
from django.db import connections
from contextlib import contextmanager
import psycopg2.extras


def dictfetchall(cursor):
    # https://docs.djangoproject.com/en/3.0/topics/db/sql/#executing-custom-sql-directly
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


@contextmanager
def get_wow_cursor():
    with connections["wow"].cursor() as cursor:
        # This is a workaround for https://code.djangoproject.com/ticket/31991.
        psycopg2.extras.register_default_jsonb(cursor.cursor)

        yield cursor


def call_db_func(name: str, params: List[Any]) -> List[Dict[str, Any]]:
    with get_wow_cursor() as cursor:
        cursor.callproc(name, params)
        return dictfetchall(cursor)


def exec_sql(sql: str, params: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
    with get_wow_cursor() as cursor:
        cursor.execute(sql, params)
        return dictfetchall(cursor)


def exec_db_query(sql_file: Path, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    return exec_sql(sql_file.read_text(), params)
