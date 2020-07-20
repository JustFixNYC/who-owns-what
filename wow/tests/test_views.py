import csv
from io import StringIO
import pytest


def test_hello_works(client):
    res = client.get('/api/hello')
    assert res.status_code == 200
    assert res.content == b"hello world"


class TestAddressQuery:
    def test_it_works(self, db, client):
        res = client.get('/api/address?block=01678&lot=0054&borough=3')
        assert res.status_code == 200
        json = res.json()
        assert len(json['addrs']) > 0
        assert json['geosearch'] == {
            'bbl': '3016780054',
            'geosupportReturnCode': '00',
        }


class TestAddressAggregate:
    def test_it_works(self, db, client):
        res = client.get('/api/address/aggregate?bbl=3016780054')
        assert res.status_code == 200
        assert len(res.json()['result']) > 0


class TestAddressDapAggregate:
    def test_it_works(self, db, client):
        res = client.get('/api/address/dap-aggregate?bbl=3016780054')
        assert res.status_code == 200
        assert len(res.json()['result']) > 0


class TestAddressBuildingInfo:
    def test_it_works(self, db, client):
        res = client.get('/api/address/buildinginfo?bbl=3016780054')
        assert res.status_code == 200
        assert res.json()['result'] is not None


class TestAddressIndicatorHistory:
    def test_it_works(self, db, client):
        res = client.get('/api/address/indicatorhistory?bbl=3016780054')
        assert res.status_code == 200
        assert res.json()['result'] is not None


class TestAddressExport:
    def test_it_works(self, db, client):
        res = client.get('/api/address/export?bbl=3016780054')
        assert res.status_code == 200
        assert res['Content-Type'] == 'text/csv'

        f = StringIO(res.content.decode('utf-8'))
        csvreader = csv.DictReader(f)
        assert 'bbl' in csvreader.fieldnames
        assert len(list(csvreader)) > 0
