from django.urls import path

from . import views

app_name = "jfauth"

urlpatterns = [
    path("login", views.login, name="login"),
    path("logout", views.logout, name="logout"),
    path("authenticate", views.authenticate, name="authenticate"),
    path("auth_check", views.auth_check, name="auth_check"),
    path("reset_password", views.password_reset_request, name="password_reset_request"),
    path("set_password", views.password_reset, name="password_reset"),
]
