from wow import dbutil


class TestExecSql:
    def test_jsonb_is_retrieved_as_json(self, db):
        result = dbutil.exec_sql("""select '{"a":"b"}'::jsonb as value""")
        assert result == [{'value': {"a": "b"}}]
