import json
from django.http import JsonResponse
import requests
import os

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")


def client_secret_request(url, data={}):
    post_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    for k, v in data.items():
        post_data[k] = v

    auth_response = requests.post(url, data=post_data)

    try:
        auth_data = auth_response.json()
        response = JsonResponse(json.loads(auth_response.content))
        response.set_signed_cookie(
            key="access_token",
            value=auth_data["access_token"],
            samesite="None",
            max_age=auth_data["expires_in"],
            secure=True,
            httponly=True,
        )
        return response
    except ValueError:
        return JsonResponse({})


def authenticated_request(url, access_token, data={}):
    headers = {"Authorization": "Bearer " + access_token}

    try:
        auth_response = requests.post(url, data=data, headers=headers)
        return JsonResponse(json.loads(auth_response.content))
    except ValueError:
        return JsonResponse({})
