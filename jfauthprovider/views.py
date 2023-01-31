import sys
from .authutil import authenticated_request

sys.path.append("..")
from wow.apiutil import api  # noqa: E402

# TODO shakao change URL based on local/production
BASE_URL = "http://host.docker.internal:8080"


@api
def login(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return authenticated_request(BASE_URL + "/o/token/", post_data)


@api
def logout(request):
    post_data = {
        "token": request.POST.get("token"),
    }

    return authenticated_request(BASE_URL + "/o/revoke_token/", post_data)


@api
def refresh(request):
    post_data = {
        "grant_type": "refresh_token",
        "refresh_token": request.POST.get("refresh_token"),
    }

    return authenticated_request(BASE_URL + "/o/token/", post_data)


@api
def authenticate(request):
    post_data = {
        "grant_type": "password",
        "username": request.POST.get("username"),
        "password": request.POST.get("password"),
    }

    return authenticated_request(BASE_URL + "/authenticate/", post_data)
