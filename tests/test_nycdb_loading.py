from .factories.hpd_violations import HPDViolation
from .factories.pluto_19v2 import Pluto19v2
from .factories.changes_summary import ChangesSummary


def test_loading_violations_works(db, nycdb_ctx):
    nycdb_ctx.write_csv('hpd_violations.csv', [
        HPDViolation(ViolationID='123', NOVDescription='boop')
    ])
    nycdb_ctx.load_dataset('hpd_violations')
    with db.cursor() as cur:
        cur.execute("select * from hpd_violations where ViolationID='123'")
        assert cur.fetchone()['novdescription'] == 'boop'


# def test_loading_pluto_works(db, nycdb_ctx):
#     nycdb_ctx.write_zip('pluto_19v2.zip', {
#         'PLUTO_for_WEB/BK_19v2.csv': [
#             Pluto19v2(HistDist="Funky Historic District", Address="FUNKY STREET"),
#             Pluto19v2(HistDist="Monkey Historic District", Address="MONKEY STREET")
#         ]
#     })
#     nycdb_ctx.load_dataset('pluto_19v2')
#     with db.cursor() as cur:
#         cur.execute("select * from pluto_19v2 where histdist='Funky Historic District'")
#         assert cur.fetchone()['address'] == 'FUNKY STREET'


def test_loading_changes_summary_works(db, nycdb_ctx):
    nycdb_ctx.write_csv('changes-summary.csv', [
        ChangesSummary(PY_421a='blarg', ownername='BOOP JONES')
    ])
    nycdb_ctx.load_dataset('rentstab_summary')
    with db.cursor() as cur:
        cur.execute("select * from rentstab_summary where a421='blarg'")
        assert cur.fetchone()['ownername'] == 'BOOP JONES'
