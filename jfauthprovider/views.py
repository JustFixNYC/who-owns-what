import json
from django.http import JsonResponse
import requests
import sys
import os

sys.path.append("..")
from wow.apiutil import api  # noqa: E402


@api
def login(request):
    username = request.POST.get("username")
    password = request.POST.get("password")

    # TODO shakao set up development flow to automatically populate local values
    CLIENT_ID = os.environ.get("CLIENT_ID")
    CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

    post_data = {
        "grant_type": "password",
        "username": username,
        "password": password,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    # TODO shakao change URL based on local/production
    response = requests.post(
        "http://host.docker.internal:8080/o/token/", data=post_data
    )

    return JsonResponse(json.loads(response.content))
