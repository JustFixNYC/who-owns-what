import sys
from django.http import HttpResponse

from .authutil import client_secret_request, authenticated_request, auth_server_request

sys.path.append("..")
from wow.apiutil import api  # noqa: E402


@api
def login(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return client_secret_request("o/token/", post_data, request.headers)


@api
def logout(request):
    post_data = {
        "token": request.get_signed_cookie("access_token"),
    }

    response = auth_server_request("o/revoke_token/", post_data, request.headers)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response


@api
def authenticate(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return client_secret_request("user/authenticate/", post_data, request.headers)


@api
def auth_check(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        refresh_token = request.get_signed_cookie("refresh_token")
        return authenticated_request("user/", access_token, refresh_token, method="GET")
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def password_reset_request(request):
    post_data = {
        "username": request.POST.get("username"),
    }
    return auth_server_request("user/password_reset/request/", post_data, request.headers)

@api
def password_reset(request):
    post_data = {
        "token": request.GET.get("token"),
        "new_password": request.POST.get("new_password"),
    }
    return auth_server_request("user/password_reset/", post_data, request.headers)
