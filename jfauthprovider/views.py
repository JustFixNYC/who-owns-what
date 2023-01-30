import json
from django.http import JsonResponse
import requests
import sys
import os

sys.path.append("..")
from wow.apiutil import api  # noqa: E402


# TODO shakao set up development flow to automatically populate local values
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")


@api
def login(request):
    username = request.POST.get("username")
    password = request.POST.get("password")

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


@api
def logout(request):
    token = request.POST.get("token")

    post_data = {
        "token": token,
        # TODO shakao unify client id/secret adding code
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    # TODO shakao change URL based on local/production
    response = requests.post(
        "http://host.docker.internal:8080/o/revoke_token/", data=post_data
    )

    # TODO shakao return a cleaner response
    return JsonResponse({"status": response.status_code})

@api
def refresh(request):
    refresh_token = request.POST.get("refresh_token")

    post_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    # TODO shakao change URL based on local/production
    response = requests.post(
        "http://host.docker.internal:8080/o/token/", data=post_data
    )

    return JsonResponse(json.loads(response.content))

@api
def authenticate(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    # TODO shakao change URL based on local/production
    response = requests.post(
        "http://host.docker.internal:8080/authenticate/", data=post_data
    )

    # TODO shakao return a cleaner response
    return JsonResponse(json.loads(response.content))
