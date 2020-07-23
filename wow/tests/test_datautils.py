from ..datautil import int_or_none, str_or_none, float_or_none


class TestDataUtilsWork:

    def test_int_or_none_works(self):
        assert int_or_none(None) is None
        assert int_or_none(1) == 1
        assert int_or_none('1') == 1
    

    def test_float_or_none_works(self):
        assert float_or_none(None) is None
        assert float_or_none(1.0) == 1.0
        assert float_or_none('1.0') == 1.0


    def test_str_or_none_works(self):
        assert str_or_none(None) is None
        assert str_or_none('1') == '1'
        assert str_or_none(1) == '1'

