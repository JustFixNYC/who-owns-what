import pytest

from wow.nyc import BBL


class TestBBL:
    def test_parse_raises_err_when_input_is_too_long(self):
        with pytest.raises(ValueError, match="string should be 10 digits"):
            BBL.parse("12319832518932598")

    def test_safe_parse_works(self):
        assert BBL.safe_parse('') is None
        assert BBL.safe_parse('91832589132598132958') is None
        assert BBL.safe_parse('2022150116') == BBL(2, 2215, 116)
