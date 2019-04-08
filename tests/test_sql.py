import pytest

from .factories.hpd_contacts import HPDContact
from .factories.hpd_registrations import HPDRegistration
from .factories.marshal_evictions_17 import MarshalEvictions17
from .factories.changes_summary import ChangesSummary
from .factories.hpd_violations import HPDViolation
from .factories.pluto_18v1 import Pluto18v1


def test_loading_violations_works(db, nycdb_ctx):
    nycdb_ctx.write_csv('hpd_violations.csv', [
        HPDViolation(ViolationID='123', NOVDescription='boop')
    ])
    nycdb_ctx.load_dataset('hpd_violations')
    with db.cursor() as cur:
        cur.execute("select * from hpd_violations where ViolationID='123'")
        assert cur.fetchone()['novdescription'] == 'boop'


def test_loading_pluto_works(db, nycdb_ctx):
    nycdb_ctx.write_zip('pluto_18v1.zip', {
        'PLUTO_for_WEB/BK_18v1.csv': [
            Pluto18v1(HistDist="Funky Historic District", Address="FUNKY STREET"),
            Pluto18v1(HistDist="Monkey Historic District", Address="MONKEY STREET")
        ]
    })
    nycdb_ctx.load_dataset('pluto_18v1')
    with db.cursor() as cur:
        cur.execute("select * from pluto_18v1 where histdist='Funky Historic District'")
        assert cur.fetchone()['address'] == 'FUNKY STREET'


def test_loading_changes_summary_works(db, nycdb_ctx):
    nycdb_ctx.write_csv('changes-summary.csv', [
        ChangesSummary(PY_421a='blarg', ownername='BOOP JONES')
    ])
    nycdb_ctx.load_dataset('rentstab_summary')
    with db.cursor() as cur:
        cur.execute("select * from rentstab_summary where a421='blarg'")
        assert cur.fetchone()['ownername'] == 'BOOP JONES'


class TestDbtool:
    @pytest.fixture(autouse=True, scope="class")
    def setup_fixture(self, db, nycdb_ctx):
        nycdb_ctx.write_zip('pluto_18v1.zip', {
            'PLUTO_for_WEB/BK_18v1.csv': [Pluto18v1()]
        })
        nycdb_ctx.write_csv('hpd_violations.csv', [HPDViolation()])
        nycdb_ctx.write_csv('changes-summary.csv', [ChangesSummary()])
        nycdb_ctx.write_csv('marshal_evictions_17.csv', [MarshalEvictions17()])
        nycdb_ctx.write_csv('hpd_registrations.csv', [HPDRegistration()])
        nycdb_ctx.write_csv('hpd_contacts.csv', [HPDContact()])
        nycdb_ctx.build_everything()

    def test_wow_bldgs_is_populated(self, db):
        with db.cursor() as cur:
            cur.execute('SELECT COUNT(1) FROM wow_bldgs')
            assert cur.fetchone()[0] > 0

    def test_get_assoc_addrs_from_bbl_works(self, db):
        with db.cursor() as cur:
            cur.execute("SELECT get_assoc_addrs_from_bbl('0000000000')")
            assert cur.fetchone() is None
