import sys
from django.http import HttpResponse

from .authutil import client_secret_request, authenticated_request

sys.path.append("..")
from wow.apiutil import api  # noqa: E402


@api
def login(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return client_secret_request("o/token/", post_data)


@api
def logout(request):
    post_data = {
        "token": request.get_signed_cookie("access_token"),
    }

    response = client_secret_request("o/revoke_token/", post_data)
    response.delete_cookie("access_token")
    return response


@api
def authenticate(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return client_secret_request("authenticate/", post_data)


@api
def auth_check(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        refresh_token = request.get_signed_cookie("refresh_token")
        return authenticated_request("profile/", access_token, refresh_token)
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)
