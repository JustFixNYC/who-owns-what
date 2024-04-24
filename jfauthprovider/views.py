import json
import sys
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View

from .authutil import (
    auth_server_request,
    client_secret_request,
    authenticated_request,
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

    response = client_secret_request("user/login/", post_data)
    if response.status_code == 200:
        return set_response_cookies(response, response.json())
    else:
        return HttpResponse(
            content=json.dumps(response.json()), status=response.status_code
        )


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
        post_data = {
            "new_email": request.POST.get("new_email"),
            "origin": request.headers["Origin"],
        }

        return authenticated_request(
            "user/",
            request,
            data=post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def register(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
        "user_type": request.POST.get("user_type"),
        "origin": request.headers["Origin"],
    }

    response = client_secret_request("user/register/", post_data)
    if response.status_code == 200:
        return set_response_cookies(response, response.json())
    else:
        return HttpResponse(
            content_type="application/json", status=response.status_code
        )


@api
def auth_check(request):
    try:
        return authenticated_request("user/", request, method="GET")
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def verify_email(request):
    try:
        post_data = {"code": request.GET.get("code")}
        return auth_server_request(
            "POST",
            "user/verify_email/",
            post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def resend_verification(request):
    try:
        return authenticated_request(
            "user/resend_verification/",
            request,
            {
                "origin": request.headers["Origin"],
            },
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def resend_verification_with_token(request):
    try:
        post_data = {
            "token": request.GET.get("u"),
            "origin": request.headers["Origin"],
        }

        return auth_server_request(
            "POST",
            "user/resend_verification_with_token/",
            post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def reset_password_request(request):
    try:
        post_data = {
            "username": request.POST.get("username"),
            "origin": request.headers["Origin"],
        }
        return auth_server_request(
            "POST",
            "user/password_reset/request/",
            post_data,
            {"Cookie": request.headers.get("Cookie")},
        )
    except Exception:
        print("failed")
        return HttpResponse(content_type="application/json", status=401)


@api
def reset_password_request_with_token(request):
    try:
        post_data = {
            "token": request.GET.get("token"),
            "origin": request.headers["Origin"],
        }

        return auth_server_request(
            "POST",
            "user/email/password_reset/request/",
            post_data,
            {"Cookie": request.headers.get("Cookie")},
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def password_reset_token_check(request):
    try:
        post_data = {
            "token": request.GET.get("token"),
        }
        return auth_server_request(
            "POST",
            "user/email/password_reset/check/",
            post_data,
            {"Cookie": request.headers.get("Cookie")},
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def password_reset(request):
    try:
        post_data = {
            "token": request.GET.get("token"),
            "new_password": request.POST.get("new_password"),
        }
        return auth_server_request(
            "POST",
            "user/password_reset/",
            post_data,
            {"Cookie": request.headers.get("Cookie")},
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def password_change(request):
    post_data = {
        "current_password": request.POST.get("current_password"),
        "new_password": request.POST.get("new_password"),
    }
    return authenticated_request("user/password_change/", request, post_data)


@method_decorator(api, name="dispatch")
class SubscriptionView(View):
    def post(self, request, *args, **kwargs):
        try:
            bbl = kwargs["bbl"]
            post_data = {
                "housenumber": request.POST.get("housenumber"),
                "streetname": request.POST.get("streetname"),
                "zip": request.POST.get("zip"),
                "boro": request.POST.get("boro"),
                "origin": request.headers["Origin"],
            }
            return authenticated_request(
                "user/subscriptions/" + str(bbl) + "/",
                request,
                post_data,
            )
        except KeyError:
            return HttpResponse(content_type="application/json", status=401)

    def delete(self, request, *args, **kwargs):
        try:
            bbl = kwargs["bbl"]
            return authenticated_request(
                "user/subscriptions/" + str(bbl) + "/",
                request,
                method="DELETE",
            )
        except KeyError:
            return HttpResponse(content_type="application/json", status=401)


@api
def email_user_subscriptions(request):
    try:
        post_data = {"token": request.GET.get("u")}

        return auth_server_request(
            "POST",
            "user/email/subscriptions/",
            post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def email_unsubscribe_all(request):
    try:
        post_data = {"token": request.GET.get("u")}

        return auth_server_request(
            "POST",
            "user/email/unsubscribe/",
            post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def email_unsubscribe(request, bbl):
    try:
        post_data = {"token": request.GET.get("u")}

        return auth_server_request(
            "POST",
            "user/unsubscribe/" + str(bbl) + "/",
            post_data,
        )
    except KeyError:
        return HttpResponse(content_type="application/json", status=401)


@api
def account_exists(request, email):
    try:
        return auth_server_request("GET", "user/" + email, request)
    except KeyError:
        return HttpResponse(content_type="application/json", status=400)
