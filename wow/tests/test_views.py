import csv
from typing import Any, Dict, List
from io import StringIO
from django.urls import path
from django.test import Client
from django.conf import settings
import pytest

from wow.apiutil import api
from project.urls import handler500  # noqa
from wow.views import _fixup_addr_for_csv


@api
def api_server_error(request):
    raise Exception("kaboom")


def server_error(request):
    raise Exception("kaboom")


urlpatterns = [
    path("api/server-error", api_server_error),
    path("server-error", server_error),
]


ALERTS_AUTH_ARG = {"HTTP_AUTHORIZATION": f"Token {settings.ALERTS_API_TOKEN}"}

SIGNATURE_AUTH_ARG = {"HTTP_AUTHORIZATION": f"Token {settings.SIGNATURE_API_TOKEN}"}


class ApiTest:
    HTTP_400_URLS: List[str] = []

    def test_400s_work(self, db, client):
        assert self.HTTP_400_URLS, "No HTTP 400 examples to test!"
        for url in self.HTTP_400_URLS:
            res = client.get(url, **ALERTS_AUTH_ARG)
            assert res.status_code == 400, f"{url} should return HTTP 400"
            assert res.json()["error"] == "Bad request"
            assert "Access-Control-Allow-Origin" in res


class TestAddressQuery(ApiTest):
    HTTP_400_URLS = [
        "/api/address",
        "/api/address?block=01678&lot=0054&borough=0",
        "/api/address?block=01678&lot=lol&borough=1",
        "/api/address?block=lol&lot=0054&borough=1",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address?block=01238&lot=0016&borough=3")
        assert res.status_code == 200
        json = res.json()
        assert len(json["addrs"]) > 0
        assert json["geosearch"] == {
            "bbl": "3012380016",
        }


class TestAddressAggregate(ApiTest):
    HTTP_400_URLS = [
        "/api/address/aggregate",
        "/api/address/aggregate?bbl=1",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address/aggregate?bbl=3012380016")
        assert res.status_code == 200
        assert len(res.json()["result"]) > 0


class TestAddressDapAggregate(ApiTest):
    HTTP_400_URLS = [
        "/api/address/dap-aggregate",
        "/api/address/dap-aggregate?bbl=1",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address/dap-aggregate?bbl=3012380016")
        assert res.status_code == 200
        assert len(res.json()["result"]) > 0


class TestAddressDapPortfolioSize(ApiTest):
    HTTP_400_URLS = [
        "/api/address/dap-portfoliosize",
        "/api/address/dap-portfoliosize?bbl=1",
    ]

    def test_it_returns_portfolio_size_given_bbl(self, db, client):
        res = client.get("/api/address/dap-portfoliosize?bbl=3016780054")
        assert res.status_code == 200
        assert len(res.json()["result"]) == 1
        assert res.json()["result"]["portfolio_size"] > 0

    def test_it_returns_none_for_unregistered_bbl(self, db, client):
        # Using the BBL for the Hudson River!
        res = client.get("/api/address/dap-portfoliosize?bbl=1011100001")
        assert res.status_code == 200
        assert res.json()["result"] is None


class TestAddressBuildingInfo(ApiTest):
    HTTP_400_URLS = [
        "/api/address/buildinginfo",
        "/api/address/buildinginfo?bbl=bop",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address/buildinginfo?bbl=3012380016")
        assert res.status_code == 200
        assert res.json()["result"] is not None


class TestAddressIndicatorHistory(ApiTest):
    HTTP_400_URLS = [
        "/api/address/indicatorhistory",
        "/api/address/indicatorhistory?bbl=bop",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address/indicatorhistory?bbl=3012380016")
        assert res.status_code == 200
        assert res.json()["result"] is not None


class TestAddressLatestDeed(ApiTest):
    HTTP_400_URLS = [
        "/api/address/latestdeed",
        "/api/address/latestdeed?bbl=bop",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address/latestdeed?bbl=3012380016")
        assert res.status_code == 200
        assert res.json()["result"] is not None


class TestAlertsViolations(ApiTest):
    HTTP_400_URLS = [
        "/api/alerts/violations",
        "/api/alerts/violations?bbl=bop",
        "/api/alerts/violations?bbl=3012380016&start_date=2024-01-01",
        "/api/alerts/violations?bbl=3012380016&start_date=2024-01-01&end_date=01-07-2024",
    ]

    def test_it_works(self, db, client):
        res = client.get(
            "/api/alerts/violations?bbl=3012380016&start_date=2024-01-01&end_date=2024-01-07"
        )
        assert res.status_code == 200
        assert res.json()["result"] is not None


class TestAlertsOcaLaggedFilings(ApiTest):
    HTTP_400_URLS = [
        "/api/email_oca_lag",
        "/api/email_oca_lag?bbl=bop",
        "/api/email_oca_lag?bbl=3012380016",
        "/api/email_oca_lag?bbl=3012380016&prev_date=01-07-2024",
    ]

    def test_it_works(self, db, client):
        res = client.get(
            "/api/email_oca_lag?bbl=3012380016&prev_date=2024-01-07", **ALERTS_AUTH_ARG
        )
        assert res.status_code == 200
        assert res.json()["result"] is not None

    def test_auth_works(self, db, client):
        res = client.get("/api/email_oca_lag?bbl=3012380016&prev_date=2024-01-07")
        assert res.status_code == 401


class TestAlertsSingleIndicator(ApiTest):
    HTTP_400_URLS = [
        "/api/email_alerts",
        "/api/email_alerts?bbl=bop",
        "/api/email_alerts?bbl=3012380016&indicator=lagged_eviction_filings",
        "/api/email_alerts?bbl=3012380016&indicator=violations&start_date=2024-01-01",
        "/api/email_alerts?bbl=3012380016&indicator=complaints&end_date=2024-01-01",
        "/api/email_alerts?bbl=3012380016&indicator=eviction_filings&end_date=2024-01-01",
    ]

    def test_it_works(self, db, client):
        url_bbl_base = "/api/email_alerts?bbl=3012380016"
        urls = [
            f"{url_bbl_base}&indicator=lagged_eviction_filings&prev_date=2024-01-07",
            f"{url_bbl_base}&indicator=violations&start_date=2024-01-01&end_date=2024-01-07",
            f"{url_bbl_base}&indicator=complaints&start_date=2024-01-01&end_date=2024-01-07",
            f"{url_bbl_base}&indicator=eviction_filings&start_date=2024-01-01&end_date=2024-01-07",
        ]
        for url in urls:
            res = client.get(url, **ALERTS_AUTH_ARG)
            assert res.status_code == 200
            assert res.json()["result"] is not None

    def test_auth_works(self, db, client):
        res = client.get(
            "/api/email_alerts?bbl=3012380016&indicator=lagged_eviction_filings \
                &prev_date=2024-01-07"
        )
        assert res.status_code == 401


class TestAlertsMultiIndicator(ApiTest):
    HTTP_400_URLS = [
        "/api/email_alerts_multi",
        "/api/email_alerts_multi?bbl=bop",
        "/api/email_alerts_multi?bbl=3012380016&indicators=bop",
        "/api/email_alerts_multi?bbl=3012380016&indicators=violations,lagged_eviction_filings \
            &start_date=2024-01-01&end_date=2024-01-01",
        "/api/email_alerts_multi?bbl=3012380016&indicators=violations,complaints \
            &prev_date=2024-01-01",
    ]

    def test_it_works(self, db, client):
        url_bbl_base = "/api/email_alerts_multi?bbl=3012380016"
        start_date = "start_date=2024-01-01"
        end_date = "end_date=2024-01-07"
        urls = [
            f"{url_bbl_base}&indicators=lagged_eviction_filings&prev_date=2024-01-07",
            f"{url_bbl_base}&indicators=violations&{start_date}&{end_date}",
            f"{url_bbl_base}&indicators=complaints&{start_date}&{end_date}",
            f"{url_bbl_base}&indicators=eviction_filings&{start_date}&{end_date}",
            f"{url_bbl_base}&indicators=hpd_link",
            f"{url_bbl_base}&indicators=violations,complaints,eviction_filings \
                &{start_date}&{end_date}",
            f"{url_bbl_base}&indicators= \
                violations,complaints,eviction_filings,lagged_eviction_filings,hpd_link \
                &{start_date}&{end_date}&prev_date=2024-01-01",
        ]
        for url in urls:
            res = client.get(url, **ALERTS_AUTH_ARG)
            print(res.json())
            assert res.status_code == 200
            assert res.json()["result"] is not None

    def test_auth_works(self, db, client):
        res = client.get(
            "/api/email_alerts_multi?bbl=3012380016&indicator=lagged_eviction_filings \
                &prev_date=2024-01-07"
        )
        assert res.status_code == 401


class TestAddressExport(ApiTest):
    HTTP_400_URLS = [
        "/api/address/export",
        "/api/address/export?bbl=bop",
    ]

    def test_it_works(self, db, client):
        res = client.get("/api/address/export?bbl=3012380016")
        assert res.status_code == 200
        assert res["Content-Type"] == "text/csv"

        f = StringIO(res.content.decode("utf-8"))
        csvreader = csv.DictReader(f)
        assert "bbl" in (csvreader.fieldnames or [])
        assert len(list(csvreader)) > 0

    def test_it_returns_404_when_no_bbls_exist(self, db, client):
        res = client.get("/api/address/export?bbl=1234567890")
        assert res.status_code == 404
        assert "Access-Control-Allow-Origin" in res


class TestFixupAddrForCsv:
    def test_it_works_when_ownernames_is_none(self):
        addr: Dict[str, Any] = {
            "ownernames": None,
            "recentcomplaintsbytype": [],
            "allcontacts": None,
        }
        _fixup_addr_for_csv(addr)
        assert addr == {
            "ownernames": "",
            "recentcomplaintsbytype": "",
            "allcontacts": "",
        }


class TestServerError:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, settings):
        settings.ROOT_URLCONF = __name__
        self.client = Client(raise_request_exception=False)

    def test_it_returns_html_on_non_api_requests(self):
        res = self.client.get("/server-error")
        assert res.status_code == 500
        assert res["Content-Type"] == "text/html"
        assert b"Server Error" in res.content

    def test_it_returns_json_on_api_requests(self, settings):
        res = self.client.get("/api/server-error")
        assert res.status_code == 500
        assert res["Content-Type"] == "application/json"
        assert res.json() == {
            "error": "An internal server error occurred.",
        }
