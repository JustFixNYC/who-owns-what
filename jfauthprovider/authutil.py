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
        return JsonResponse(json.loads(response.content))
    except ValueError:
        return JsonResponse({})
