import sys
import os
from django.http import HttpResponse

from .authutil import client_secret_request, authenticated_request

sys.path.append("..")
from wow.apiutil import api  # noqa: E402

AUTH_BASE_URL = os.environ.get("AUTH_BASE_URL") or ""


@api
def login(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return client_secret_request(AUTH_BASE_URL + "/o/token/", post_data)


@api
def logout(request):
    post_data = {
        "token": request.get_signed_cookie("access_token"),
    }

    response = client_secret_request(AUTH_BASE_URL + "/o/revoke_token/", post_data)
    response.delete_cookie("access_token")
    return response


@api
def refresh(request):
    post_data = {
        "grant_type": "refresh_token",
        "refresh_token": request.POST.get("refresh_token"),
    }

    return client_secret_request(AUTH_BASE_URL + "/o/token/", post_data)


@api
def authenticate(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return client_secret_request(AUTH_BASE_URL + "/authenticate/", post_data)


@api
def auth_check(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        return authenticated_request(AUTH_BASE_URL + "/profile/", access_token)
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)
