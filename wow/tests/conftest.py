import pytest
import psycopg2

import dbtool
from ocaevictions.table import OcaConfig


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup, django_db_blocker):
    from django.conf import settings

    wow = settings.DATABASES["wow"]
    with django_db_blocker.unblock():
        db = dbtool.DbContext(
            host=wow["HOST"],
            database=wow["NAME"],
            user=wow["USER"],
            password=wow["PASSWORD"],
            port=wow["PORT"] or 5432,
        )

        # If we're run with --reuse-db, the database might already
        # be scaffolded for us, in which case we don't need to
        # do anything.
        is_already_built = False
        conn = db.connection()
        with conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute("select * from wow_bldgs limit 1;")
                    is_already_built = True
                except psycopg2.errors.UndefinedTable:
                    pass

        if not is_already_built:
            oca_config = OcaConfig(
                sql_pre_files=dbtool.WOW_YML["oca_pre_sql"],
                sql_post_files=dbtool.WOW_YML["oca_post_sql"],
                data_dir=dbtool.ROOT_DIR / "nycdb" / "data",
                test_dir=dbtool.ROOT_DIR / "tests" / "data",
                sql_dir=dbtool.ROOT_DIR / "sql",
                aws_key=None,
                aws_secret=None,
                s3_bucket=None,
                s3_objects=dbtool.WOW_YML["oca_s3_objects"],
                is_testing=True,
            )
            dbtool.loadtestdata(db, oca_config)
