import csv
from typing import List
from io import StringIO
from django.urls import path
from django.test import Client
import pytest

from wow.apiutil import api
from project.urls import handler500  # noqa


@api
def api_server_error(request):
    raise Exception("kaboom")


def server_error(request):
    raise Exception("kaboom")


urlpatterns = [
    path('api/server-error', api_server_error),
    path('server-error', server_error),
]


class ApiTest:
    HTTP_400_URLS: List[str] = []

    def test_400s_work(self, db, client):
        assert self.HTTP_400_URLS, "No HTTP 400 examples to test!"
        for url in self.HTTP_400_URLS:
            res = client.get(url)
            assert res.status_code == 400, f"{url} should return HTTP 400"
            assert res.json()['error'] == 'Bad request'
            assert 'Access-Control-Allow-Origin' in res


class TestAddressQuery(ApiTest):
    HTTP_400_URLS = [
        '/api/address',
        '/api/address?block=01678&lot=0054&borough=0',
        '/api/address?block=01678&lot=lol&borough=1',
        '/api/address?block=lol&lot=0054&borough=1',
    ]

    def test_it_works(self, db, client):
        res = client.get('/api/address?block=01678&lot=0054&borough=3')
        assert res.status_code == 200
        json = res.json()
        assert len(json['addrs']) > 0
        assert json['geosearch'] == {
            'bbl': '3016780054',
            'geosupportReturnCode': '00',
        }


class TestAddressAggregate(ApiTest):
    HTTP_400_URLS = [
        '/api/address/aggregate',
        '/api/address/aggregate?bbl=1',
    ]

    def test_it_works(self, db, client):
        res = client.get('/api/address/aggregate?bbl=3016780054')
        assert res.status_code == 200
        assert len(res.json()['result']) > 0


class TestAddressDapAggregate(ApiTest):
    HTTP_400_URLS = [
        '/api/address/dap-aggregate',
        '/api/address/dap-aggregate?bbl=1',
    ]

    def test_it_works(self, db, client):
        res = client.get('/api/address/dap-aggregate?bbl=3016780054')
        assert res.status_code == 200
        assert len(res.json()['result']) > 0


class TestAddressBuildingInfo(ApiTest):
    HTTP_400_URLS = [
        '/api/address/buildinginfo',
        '/api/address/buildinginfo?bbl=bop',
    ]

    def test_it_works(self, db, client):
        res = client.get('/api/address/buildinginfo?bbl=3016780054')
        assert res.status_code == 200
        assert res.json()['result'] is not None


class TestAddressIndicatorHistory(ApiTest):
    HTTP_400_URLS = [
        '/api/address/indicatorhistory',
        '/api/address/indicatorhistory?bbl=bop',
    ]

    def test_it_works(self, db, client):
        res = client.get('/api/address/indicatorhistory?bbl=3016780054')
        assert res.status_code == 200
        assert res.json()['result'] is not None


class TestAddressExport(ApiTest):
    HTTP_400_URLS = [
        '/api/address/export',
        '/api/address/export?bbl=bop',
    ]

    def test_it_works(self, db, client):
        res = client.get('/api/address/export?bbl=3016780054')
        assert res.status_code == 200
        assert res['Content-Type'] == 'text/csv'

        f = StringIO(res.content.decode('utf-8'))
        csvreader = csv.DictReader(f)
        assert 'bbl' in (csvreader.fieldnames or [])
        assert len(list(csvreader)) > 0

    def test_it_returns_404_when_no_bbls_exist(self, db, client):
        res = client.get('/api/address/export?bbl=1234567890')
        assert res.status_code == 404
        assert 'Access-Control-Allow-Origin' in res


class TestServerError:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, settings):
        settings.ROOT_URLCONF = __name__
        self.client = Client(raise_request_exception=False)

    def test_it_returns_html_on_non_api_requests(self):
        res = self.client.get('/server-error')
        assert res.status_code == 500
        assert res['Content-Type'] == 'text/html'
        assert b"Server Error" in res.content

    def test_it_returns_json_on_api_requests(self, settings):
        res = self.client.get('/api/server-error')
        assert res.status_code == 500
        assert res['Content-Type'] == 'application/json'
        assert res.json() == {
            'error': 'An internal server error occurred.',
        }
