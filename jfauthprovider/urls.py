from django.urls import path

from . import views

app_name = "jfauth"

urlpatterns = [
    path("login", views.login, name="login"),
    path("refresh", views.refresh, name="refresh"),
    path("logout", views.logout, name="logout"),
    path("authenticate", views.authenticate, name="authenticate"),
    path("auth_check", views.auth_check, name="auth_check"),
]
