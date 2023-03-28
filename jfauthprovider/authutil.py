import json
from django.http import HttpResponse, JsonResponse
import requests
import os

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
AUTH_BASE_URL = os.environ.get("AUTH_BASE_URL") or ""


def add_client_secret(data={}):
    post_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    for k, v in data.items():
        post_data[k] = v

    return post_data


def set_response_cookies(response, json_data):
    response_with_cookies = JsonResponse(json.loads(response.content))

    response_with_cookies.set_signed_cookie(
        key="access_token",
        value=json_data.get("access_token", None),
        samesite="None",
        max_age=json_data["expires_in"],
        secure=True,
        httponly=True,
    )
    response_with_cookies.set_signed_cookie(
        key="refresh_token",
        value=json_data.get("refresh_token", None),
        samesite="None",
        secure=True,
        httponly=True,
    )

    response_with_cookies.headers = response.headers

    return response_with_cookies


def auth_server_request(url, data={}, headers={}):
    try:
        response = requests.post(
            os.path.join(AUTH_BASE_URL, url),
            data=data,
            headers=headers,
        )
        json_response = JsonResponse(json.loads(response.content))
        json_response.headers = response.headers
        return json_response
    except ValueError as e:
        return JsonResponse({"msg": str(e)}, status=500)


def client_secret_request(url, data={}, headers={}):
    try:
        return requests.post(
            os.path.join(AUTH_BASE_URL, url),
            data=add_client_secret(data),
            headers=headers,
        )
    except ValueError as e:
        return JsonResponse({"msg": str(e)}, status=500)


def authenticated_request(url, access_token, refresh_token, data={}, method="POST"):
    try:
        if access_token is None:
            return HttpResponse(content_type="application/json", status=401)

        headers = {"Authorization": "Bearer " + access_token}
        if method == "GET":
            auth_response = requests.get(
                os.path.join(AUTH_BASE_URL, url), data=data, headers=headers
            )
        elif method == "DELETE":
            auth_response = requests.delete(
                os.path.join(AUTH_BASE_URL, url), data=data, headers=headers
            )
        else:
            auth_response = requests.post(
                os.path.join(AUTH_BASE_URL, url), data=data, headers=headers
            )

        # Attempt to automatically refresh token if expired
        if auth_response.status_code == 403:
            # Request to /o/token with refresh_token
            refresh_data = {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            }
            refresh_response = requests.post(
                os.path.join(AUTH_BASE_URL, "o/token/"),
                data=add_client_secret(refresh_data),
            )
            refresh_response_json = refresh_response.json()

            # Retry original request with updated access_token
            headers = {
                "Authorization": "Bearer " + refresh_response_json["access_token"]
            }
            auth_response = requests.post(
                os.path.join(AUTH_BASE_URL, url), data=data, headers=headers
            )
            # Set updated token for user
            return set_response_cookies(auth_response, refresh_response_json)

        return JsonResponse(
            json.loads(auth_response.content), status=auth_response.status_code
        )
    except ValueError:
        return JsonResponse({}, status=auth_response.status_code)
