import json
from unittest.mock import MagicMock, patch

import pytest
import requests
from django.http import JsonResponse

ORIGIN = "https://whoownswhat.justfix.org"

TOKEN_RESPONSE = {
    "access_token": "test-access-token",
    "refresh_token": "test-refresh-token",
    "expires_in": 3600,
    "token_type": "Bearer",
}


def make_auth_response(status_code, json_data):
    response = MagicMock()
    response.status_code = status_code
    response.content = json.dumps(json_data).encode()
    response.headers = {}
    response.json.return_value = json_data
    return response


@pytest.mark.django_db
class TestLoginStartProxy:
    @patch("jfauthprovider.views.client_secret_request")
    def test_login_start_does_not_set_cookies(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, {"created": True})

        res = client.post("/auth/login/start", {"email": "test@example.com"})

        assert res.status_code == 200
        assert "access_token" not in res.cookies
        assert "refresh_token" not in res.cookies
        mock_request.assert_called_once_with("user/login/start/", {"email": "test@example.com"})


@pytest.mark.django_db
class TestLoginSendCodeProxy:
    @patch("jfauthprovider.views.client_secret_request")
    def test_login_send_code_does_not_set_cookies(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, {"otp": "123456"})

        res = client.post(
            "/auth/login/send-code",
            {
                "email": "test@example.com",
                "user_type": "tenant",
                "phone_number": "555-0100",
            },
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 200
        assert "access_token" not in res.cookies
        assert "refresh_token" not in res.cookies
        mock_request.assert_called_once_with(
            "user/login/send-code/",
            {
                "email": "test@example.com",
                "user_type": "tenant",
                "phone_number": "555-0100",
                "origin": ORIGIN,
            },
        )

    @patch("jfauthprovider.views.client_secret_request")
    def test_login_send_code_forwards_building_fields(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, {"otp": "123456"})

        res = client.post(
            "/auth/login/send-code",
            {
                "email": "test@example.com",
                "bbl": "3012380016",
                "housenumber": "654",
                "streetname": "Park Place",
                "zip": "11261",
                "boro": "Brooklyn",
            },
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 200
        mock_request.assert_called_once_with(
            "user/login/send-code/",
            {
                "email": "test@example.com",
                "user_type": None,
                "phone_number": None,
                "origin": ORIGIN,
                "bbl": "3012380016",
                "housenumber": "654",
                "streetname": "Park Place",
                "zip": "11261",
                "boro": "Brooklyn",
            },
        )

    @patch("jfauthprovider.views.client_secret_request")
    def test_login_send_code_forwards_district(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, {"otp": "123456"})
        district_json = json.dumps(
            [
                {
                    "areaLabel": "11201",
                    "areaValue": "11201",
                    "typeLabel": "Zip Code",
                    "typeValue": "zipcode",
                }
            ]
        )

        res = client.post(
            "/auth/login/send-code",
            {
                "email": "test@example.com",
                "district": district_json,
            },
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 200
        mock_request.assert_called_once_with(
            "user/login/send-code/",
            {
                "email": "test@example.com",
                "user_type": None,
                "phone_number": None,
                "origin": ORIGIN,
                "district": district_json,
            },
        )

    @patch("jfauthprovider.views.client_secret_request")
    def test_login_send_code_without_origin_does_not_500(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, {"otp": {"status": "sent"}})

        res = client.post(
            "/auth/login/send-code",
            {"email": "test@example.com"},
        )

        assert res.status_code == 200
        mock_request.assert_called_once_with(
            "user/login/send-code/",
            {
                "email": "test@example.com",
                "user_type": None,
                "phone_number": None,
            },
        )

    @patch("jfauthprovider.authutil.logger")
    @patch("jfauthprovider.authutil.requests.post")
    def test_login_send_code_upstream_connection_error_returns_502(
        self, mock_post, mock_logger, client
    ):
        mock_post.side_effect = requests.ConnectionError("auth provider down")

        res = client.post(
            "/auth/login/send-code",
            {"email": "test@example.com"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 502
        assert res.json()["error"] == "Auth service unavailable"
        mock_logger.exception.assert_called()


@pytest.mark.django_db
class TestVerifyOtpProxy:
    @patch("jfauthprovider.views.client_secret_request")
    def test_verify_otp_sets_cookies_on_success(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, TOKEN_RESPONSE)

        res = client.post(
            "/auth/verify-otp",
            {"email": "test@example.com", "code": "123456"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 200
        assert res.cookies["access_token"].value
        assert res.cookies["refresh_token"].value
        mock_request.assert_called_once_with(
            "user/verify-otp-token/",
            {
                "email": "test@example.com",
                "code": "123456",
                "origin": ORIGIN,
            },
        )

    @patch("jfauthprovider.views.client_secret_request")
    def test_verify_otp_does_not_set_cookies_on_error(self, mock_request, client):
        mock_request.return_value = make_auth_response(400, {"error": "Invalid code"})

        res = client.post(
            "/auth/verify-otp",
            {"email": "test@example.com", "code": "000000"},
        )

        assert res.status_code == 400
        assert "access_token" not in res.cookies
        assert "refresh_token" not in res.cookies

    @patch("jfauthprovider.authutil.logger")
    @patch("jfauthprovider.views.client_secret_request")
    def test_verify_otp_malformed_token_payload_returns_502(
        self, mock_request, mock_logger, client
    ):
        mock_request.return_value = make_auth_response(200, {"access_token": "test-access-token"})

        res = client.post(
            "/auth/verify-otp",
            {"email": "test@example.com", "code": "123456"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 502
        assert res.json()["error"] == "Auth service unavailable"
        assert "access_token" not in res.cookies
        mock_logger.error.assert_called()

    @patch("jfauthprovider.authutil.logger")
    @patch("jfauthprovider.authutil.requests.post")
    def test_verify_otp_upstream_timeout_returns_502(self, mock_post, mock_logger, client):
        mock_post.side_effect = requests.Timeout("auth provider timeout")

        res = client.post(
            "/auth/verify-otp",
            {"email": "test@example.com", "code": "123456"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 502
        assert res.json()["error"] == "Auth service unavailable"
        mock_logger.exception.assert_called()


@pytest.mark.django_db
class TestVerifyMagicLinkProxy:
    @patch("jfauthprovider.views.client_secret_request")
    def test_verify_magic_link_forwards_origin_and_sets_cookies(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, TOKEN_RESPONSE)

        res = client.post(
            "/auth/verify-magic-link",
            {"code": "signed-code", "utm_source": "email"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 200
        assert res.cookies["access_token"].value
        assert res.cookies["refresh_token"].value
        mock_request.assert_called_once_with(
            "user/verify-magic-link/",
            {
                "code": "signed-code",
                "utm_source": "email",
                "origin": ORIGIN,
            },
        )

    @patch("jfauthprovider.views.client_secret_request")
    def test_verify_magic_link_does_not_set_cookies_on_error(self, mock_request, client):
        mock_request.return_value = make_auth_response(400, {"error": "Invalid or expired link"})

        res = client.post(
            "/auth/verify-magic-link",
            {"code": "bad-code"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 400
        assert "access_token" not in res.cookies
        assert "refresh_token" not in res.cookies

    @patch("jfauthprovider.views.client_secret_request")
    def test_verify_magic_link_without_origin_does_not_500(self, mock_request, client):
        mock_request.return_value = make_auth_response(200, TOKEN_RESPONSE)

        res = client.post(
            "/auth/verify-magic-link",
            {"code": "signed-code"},
        )

        assert res.status_code == 200
        mock_request.assert_called_once_with(
            "user/verify-magic-link/",
            {
                "code": "signed-code",
                "utm_source": None,
            },
        )


@pytest.mark.django_db
class TestEmailChangeProxy:
    @patch("jfauthprovider.views.authenticated_request")
    def test_email_change_send_code_is_reachable(self, mock_request, client):
        mock_request.return_value = JsonResponse({"otp": "654321"}, status=200)

        res = client.post(
            "/auth/email/change/send-code",
            {"new_email": "new@example.com"},
            HTTP_ORIGIN=ORIGIN,
        )

        assert res.status_code == 200
        mock_request.assert_called_once()
        assert mock_request.call_args.args[0] == "user/email/change/send-code/"
        assert mock_request.call_args.kwargs["data"] == {
            "new_email": "new@example.com",
            "origin": ORIGIN,
        }

    @patch("jfauthprovider.views.authenticated_request")
    def test_email_change_send_code_without_origin_does_not_401(self, mock_request, client):
        mock_request.return_value = JsonResponse({"otp": {"status": "sent"}}, status=200)

        res = client.post(
            "/auth/email/change/send-code",
            {"new_email": "new@example.com"},
        )

        assert res.status_code == 200
        assert mock_request.call_args.kwargs["data"] == {
            "new_email": "new@example.com",
        }

    @patch("jfauthprovider.views.authenticated_request")
    def test_email_change_verify_otp_is_reachable(self, mock_request, client):
        mock_request.return_value = JsonResponse({"user": {"email": "new@example.com"}}, status=200)

        res = client.post(
            "/auth/email/change/verify-otp",
            {"new_email": "new@example.com", "code": "654321"},
        )

        assert res.status_code == 200
        mock_request.assert_called_once()
        assert mock_request.call_args.args[0] == "user/email/change/verify-otp/"
        assert mock_request.call_args.kwargs["data"] == {
            "new_email": "new@example.com",
            "code": "654321",
        }
