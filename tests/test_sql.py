import pytest

from .factories.hpd_contacts import HPDContact
from .factories.hpd_registrations import HPDRegistration
from .factories.marshal_evictions_17 import MarshalEvictions17
from .factories.marshal_evictions_18 import MarshalEvictions18
from .factories.changes_summary import ChangesSummary
from .factories.hpd_violations import HPDViolation
from .factories.pluto_18v1 import Pluto18v1

# This test suite defines two landlords:
#
# * CLOUD CITY MEGAPROPERTIES is a landlord with
#   two buildings in its portfolio, FUNKY and MONKEY.
#   FUNKY is hidden behind an LLC but the association
#   can be inferred from its business address.
#
# * THE UNRELATED COMPANIES, L.P. is a landlord with
#   one building, UNRELATED.

FUNKY_BBL = '3000010002'

MONKEY_BBL = '3000040005'

UNRELATED_BBL = '1000010002'

FUNKY_REGISTRATION = HPDRegistration(
    RegistrationID='1',
    HouseNumber='1',
    StreetName='FUNKY STREET',
    BoroID='3',
    Block='1',
    Lot='2',
)

MONKEY_REGISTRATION = HPDRegistration(
    RegistrationID='2',
    HouseNumber='2',
    StreetName='MONKEY STREET',
    BoroID='3',
    Block='4',
    Lot='5',
)

UNRELATED_REGISTRATION = HPDRegistration(
    RegistrationID='3',
    HouseNumber='3',
    StreetName='UNRELATED STREET',
    BoroID='1',
    Block='1',
    Lot='2',
)

FUNKY_CONTACT = HPDContact(
    RegistrationID='1',
    Type='HeadOfficer',
    FirstName='Lobot',
    LastName='Jones',
    CorporationName='1 FUNKY STREET LLC',
    BusinessHouseNumber='5',
    BusinessStreetName='BESPIN AVE',
    BusinessZip='11231'
)

MONKEY_CONTACT = HPDContact(
    RegistrationID='2',
    Type='HeadOfficer',
    FirstName='Landlordo',
    LastName='Calrissian',
    CorporationName='CLOUD CITY MEGAPROPERTIES',
    BusinessHouseNumber='5',
    BusinessStreetName='BESPIN AVE',
    BusinessZip='11231'
)

UNRELATED_CONTACT = HPDContact(
    RegistrationID='3',
    Type='HeadOfficer',
    FirstName='Boop',
    LastName='Jones',
    CorporationName='THE UNRELATED COMPANIES, L.P.',
    BusinessHouseNumber='6',
    BusinessStreetName='UNRELATED AVE',
    BusinessZip='11231'
)


class TestSQL:
    @pytest.fixture(autouse=True, scope="class")
    def setup_class_fixture(self, db, nycdb_ctx):
        nycdb_ctx.write_zip('pluto_18v1.zip', {
            'PLUTO_for_WEB/BK_18v1.csv': [Pluto18v1()]
        })
        nycdb_ctx.write_csv('hpd_violations.csv', [HPDViolation()])
        nycdb_ctx.write_csv('changes-summary.csv', [ChangesSummary()])
        nycdb_ctx.write_csv('marshal_evictions_17.csv', [MarshalEvictions17()])
        nycdb_ctx.write_csv('marshal_evictions_18.csv', [MarshalEvictions18()])
        nycdb_ctx.write_csv('hpd_registrations.csv', [
            FUNKY_REGISTRATION,
            MONKEY_REGISTRATION,
            UNRELATED_REGISTRATION
        ])
        nycdb_ctx.write_csv('hpd_contacts.csv', [
            FUNKY_CONTACT,
            MONKEY_CONTACT,
            UNRELATED_CONTACT
        ])
        nycdb_ctx.build_everything()

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db):
        self.db = db

    def query_one(self, query):
        results = self.query_all(query)
        assert len(results) == 1
        return results[0]

    def query_all(self, query):
        with self.db.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()

    def get_assoc_addrs_from_bbl(self, bbl):
        results = self.query_all(
            f"SELECT * FROM get_assoc_addrs_from_bbl('{bbl}')")
        results_by_bbl = {}
        for result in results:
            results_by_bbl[result['bbl']] = result
        return results_by_bbl

    def test_wow_bldgs_is_populated(self):
        r = self.query_one(f"SELECT * FROM wow_bldgs WHERE bbl='{FUNKY_BBL}'")
        assert r['housenumber'] == '1'
        assert r['streetname'] == 'FUNKY STREET'
        assert r['businessaddrs'] == ['5 BESPIN AVENUE 11231']

    def test_get_assoc_addrs_from_bbl_returns_one_building_porfolios(self):
        assert len(self.get_assoc_addrs_from_bbl(UNRELATED_BBL)) == 1

    def test_get_assoc_addrs_from_bbl_returns_empty_set_on_invalid_bbl(self):
        assert len(self.get_assoc_addrs_from_bbl('zzz')) == 0

    def test_get_assoc_addrs_from_bbl_is_bidirectional(self):
        assert self.get_assoc_addrs_from_bbl(FUNKY_BBL) == \
            self.get_assoc_addrs_from_bbl(MONKEY_BBL)

    def test_get_assoc_addrs_from_bbl_links_buildings_through_businessaddrs(self):
        results = self.get_assoc_addrs_from_bbl(FUNKY_BBL)
        assert len(results) == 2

        funky = results[FUNKY_BBL]
        assert funky['housenumber'] == '1'
        assert funky['streetname'] == 'FUNKY STREET'
        assert funky['businessaddrs'] == ['5 BESPIN AVENUE 11231']

        monkey = results[MONKEY_BBL]
        assert monkey['housenumber'] == '2'
        assert monkey['streetname'] == 'MONKEY STREET'
        assert monkey['businessaddrs'] == ['5 BESPIN AVENUE 11231']

    def test_hpd_registrations_with_contacts_is_populated(self):
        r = self.query_one(
            f"SELECT * FROM hpd_registrations_with_contacts WHERE bbl='{FUNKY_BBL}'")
        assert r['registrationid'] == 1
        assert r['housenumber'] == '1'
        assert r['streetname'] == 'FUNKY STREET'
        assert r['corpnames'] == ['1 FUNKY STREET LLC']
        assert r['businessaddrs'] == ['5 BESPIN AVENUE 11231']
        assert r['ownernames'] == [{
            'title': 'HeadOfficer',
            'value': 'Lobot Jones',
        }]
