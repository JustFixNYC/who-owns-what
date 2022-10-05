from .factories.hpd_violations import HpdViolations
from .factories.pluto_20v8 import Pluto20v8
from .factories.pluto_latest import PlutoLatest
from .factories.changes_summary import ChangesSummary


def test_loading_violations_works(db, nycdb_ctx):
    nycdb_ctx.write_csv(
        "hpd_violations.csv", [HpdViolations(ViolationID="123", NOVDescription="boop")]
    )
    nycdb_ctx.load_dataset("hpd_violations")
    with db.cursor() as cur:
        cur.execute("select * from hpd_violations where ViolationID='123'")
        assert cur.fetchone()["novdescription"] == "boop"


def test_loading_pluto_latest_works(db, nycdb_ctx):
    # note: some fields, like census tract, are renamed in the nycdb sql
    nycdb_ctx.write_csv(
        "pluto_latest.csv", [PlutoLatest(bbl="4116700053", censustract2010="176")]
    )
    nycdb_ctx.load_dataset("pluto_latest")
    with db.cursor() as cur:
        cur.execute("select * from pluto_latest where bbl='4116700053'")
        assert cur.fetchone()["ct2010"] == "176"


def test_loading_pluto_zip_works(db, nycdb_ctx):
    nycdb_ctx.write_zip(
        "pluto_20v8.zip",
        {
            "PLUTO_for_WEB/BK_20v8.csv": [
                Pluto20v8(histdist="Funky Historic District", address="FUNKY STREET"),
                Pluto20v8(histdist="Monkey Historic District", address="MONKEY STREET"),
            ]
        },
    )
    nycdb_ctx.load_dataset("pluto_20v8")
    with db.cursor() as cur:
        cur.execute("select * from pluto_20v8 where histdist='Funky Historic District'")
        assert cur.fetchone()["address"] == "FUNKY STREET"


def test_loading_changes_summary_works(db, nycdb_ctx):
    nycdb_ctx.write_csv(
        "changes-summary.csv", [ChangesSummary(PY_421a="blarg", ownername="BOOP JONES")]
    )
    nycdb_ctx.load_dataset("rentstab_summary")
    with db.cursor() as cur:
        cur.execute("select * from rentstab_summary where a421='blarg'")
        assert cur.fetchone()["ownername"] == "BOOP JONES"
