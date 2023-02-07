import json
from django.http import JsonResponse
import requests
import os

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")


def authenticated_request(url, data):
    post_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    for k, v in data.items():
        post_data[k] = v

    response = requests.post(url, data=post_data)

    try:
        auth_data = response.json()
        json_response = JsonResponse(json.loads(response.content))
        json_response.set_signed_cookie(
            key="access_token",
            value=auth_data["access_token"],
            samesite="None",
            max_age=auth_data["expires_in"],
            secure=True,
            httponly=True,
        )
        return json_response
    except ValueError:
        return JsonResponse({})
