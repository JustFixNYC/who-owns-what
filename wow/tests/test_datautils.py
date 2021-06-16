import pytest
from ..datautil import int_or_none, json_or_none, str_or_none, float_or_none


sample_json_string = '[{"foo": "bar", "beep": { "boop": "blah"}}]'
sample_json_string_with_null = '[{"foo": "bar", "beep": null}]'


class TestDataUtilsWork:
    @pytest.mark.parametrize("input,expected", [
        (None, None),
        ('1', 1),
        (1, 1)
    ])
    def test_int_or_none_works(self, input, expected):
        assert int_or_none(input) == expected

    @pytest.mark.parametrize("input,expected", [
        (None, None),
        (1.0, 1.0),
        ('1.0', 1.0)
    ])
    def test_float_or_none_works(self, input, expected):
        assert float_or_none(input) == expected

    @pytest.mark.parametrize("input,expected", [
        (None, None),
        ('1', '1'),
        (1, '1')
    ])
    def test_str_or_none_works(self, input, expected):
        assert str_or_none(input) == expected

    @pytest.mark.parametrize("input,expected", [
        (None, None),
        (sample_json_string, [{
            "foo": "bar",
            "beep": {
                "boop": "blah"
            }
        }]),
        (sample_json_string_with_null, [{
            "foo": "bar",
            "beep": None
        }])
    ])
    def test_json_or_none_works(self, input, expected):
        assert json_or_none(input) == expected
