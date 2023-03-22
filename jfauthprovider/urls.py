from django.urls import path

from . import views

app_name = "jfauth"

urlpatterns = [
    path("login", views.login, name="login"),
    path("logout", views.logout, name="logout"),
    path("authenticate", views.authenticate, name="authenticate"),
    path("auth_check", views.auth_check, name="auth_check"),
    path("verify_email", views.verify_email, name="verify_email"),
    path("reset_password", views.password_reset_request, name="password_reset_request"),
    path("set_password", views.password_reset, name="password_reset"),
    path("subscriptions/<int:bbl>", views.subscribe_bbl, name="subscribe_bbl"),
    path("subscriptions", views.user_subscriptions, name="user_subscriptions"),
]
