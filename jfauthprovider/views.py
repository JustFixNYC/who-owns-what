import sys
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View

from .authutil import (
    client_secret_request,
    authenticated_request,
    auth_server_request,
    set_response_cookies,
)

sys.path.append("..")
from wow.apiutil import api  # noqa: E402


@api
def login(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    response = client_secret_request("o/token/", post_data)
    return set_response_cookies(response, response.json())


@api
def logout(request):
    access_token = request.get_signed_cookie("access_token")
    refresh_token = request.get_signed_cookie("refresh_token")
    response = client_secret_request(
        "o/revoke_token/",
        {
            "token": access_token,
        },
    )
    client_secret_request(
        "o/revoke_token/",
        {
            "token": refresh_token,
            "token_type_hint": "refresh_token",
        },
    )
    http_response = HttpResponse(
        content_type="application/json", status=response.status_code
    )
    http_response.delete_cookie("access_token")
    http_response.delete_cookie("refresh_token")
    return http_response


@api
def update(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        refresh_token = request.get_signed_cookie("refresh_token")
        post_data = {"new_email": request.POST.get("new_email")}

        return authenticated_request(
            "user/",
            access_token,
            refresh_token,
            data=post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def authenticate(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
        "origin": request.headers["Origin"],
    }

    response = client_secret_request("user/authenticate/", post_data)
    return set_response_cookies(response, response.json())


@api
def auth_check(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        refresh_token = request.get_signed_cookie("refresh_token")
        return authenticated_request("user/", access_token, refresh_token, method="GET")
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def verify_email(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        refresh_token = request.get_signed_cookie("refresh_token")
        code = request.GET.get("code")

        return authenticated_request(
            "user/verify_email/?code=" + code,
            access_token,
            refresh_token,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def password_reset_request(request):
    post_data = {
        "username": request.POST.get("username"),
    }
    return auth_server_request("user/password_reset/request/", post_data)


@api
def password_reset(request):
    post_data = {
        "token": request.GET.get("token"),
        "new_password": request.POST.get("new_password"),
    }
    return auth_server_request("user/password_reset/", post_data)


@method_decorator(api, name="dispatch")
class SubscriptionView(View):
    def post(self, request, *args, **kwargs):
        try:
            bbl = kwargs["bbl"]
            access_token = request.get_signed_cookie("access_token")
            refresh_token = request.get_signed_cookie("refresh_token")
            post_data = {
                "housenumber": request.POST.get("housenumber"),
                "streetname": request.POST.get("streetname"),
                "zip": request.POST.get("zip"),
                "boro": request.POST.get("boro"),
            }
            return authenticated_request(
                "user/subscriptions/" + str(bbl) + "/",
                access_token,
                refresh_token,
                post_data,
            )
        except KeyError:
            return HttpResponse(content_type="application/json", status=401)

    def delete(self, request, *args, **kwargs):
        try:
            bbl = kwargs["bbl"]
            access_token = request.get_signed_cookie("access_token")
            refresh_token = request.get_signed_cookie("refresh_token")
            return authenticated_request(
                "user/subscriptions/" + str(bbl) + "/",
                access_token,
                refresh_token,
                method="DELETE",
            )
        except KeyError:
            return HttpResponse(content_type="application/json", status=401)


@api
def user_subscriptions(request):
    try:
        access_token = request.get_signed_cookie("access_token")
        refresh_token = request.get_signed_cookie("refresh_token")

        return authenticated_request(
            "user/subscriptions/",
            access_token,
            refresh_token,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)
