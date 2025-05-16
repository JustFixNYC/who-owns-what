from django.urls import path

from . import views

app_name = "jfauth"

urlpatterns = [
    path("login", views.login, name="login"),
    path("logout", views.logout, name="logout"),
    path("update", views.update, name="update"),
    path("register", views.register, name="register"),
    path("auth_check", views.auth_check, name="auth_check"),
    path("account_exists/<str:email>", views.account_exists, name="account_exists"),
    path("verify_email", views.verify_email, name="verify_email"),
    path("resend_verification", views.resend_verification, name="resend_verification"),
    path(
        "resend_verification_with_token",
        views.resend_verification_with_token,
        name="resend_verification_with_token",
    ),
    path(
        "reset_password_request",
        views.reset_password_request,
        name="reset_password_request",
    ),
    path(
        "reset_password_request_with_token",
        views.reset_password_request_with_token,
        name="reset_password_request_with_token",
    ),
    path(
        "reset_password/check",
        views.password_reset_token_check,
        name="password_reset_token_check",
    ),
    path("set_password", views.password_reset, name="password_reset"),
    path("change_password", views.password_change, name="password_change"),
    path(
        "email/subscriptions",
        views.email_user_subscriptions,
        name="email_user_subscriptions",
    ),
    # BUILDINGS
    path(
        "subscribe/building",
        views.SubscribeBuildingView.as_view(),
        name="subscribe_building",
    ),
    path(
        "unsubscribe/building/<int:bbl>",
        views.UnsubscribeBuildingView.as_view(),
        name="unsubscribe_building",
    ),
    path(
        "unsubscribe_all/building",
        views.UnsubscribeBuildingAllView.as_view(),
        name="unsubscribe_all_building",
    ),
    path(
        "email/unsubscribe_all/building",
        views.email_unsubscribe_all_building,
        name="email_unsubscribe_all_building",
    ),
    path(
        "email/unsubscribe/building/<int:bbl>",
        views.email_unsubscribe_building,
        name="email_unsubscribe_building",
    ),
    # DISTRICTS
    path(
        "subscribe/district",
        views.SubscribeDistrictView.as_view(),
        name="subscribe_district",
    ),
    path(
        "unsubscribe/district/<int:subscription_id>",
        views.DistrictUnsubscribeView.as_view(),
        name="unsubscribe_district",
    ),
    path(
        "unsubscribe_all/district",
        views.UnsubscribeDistrictAllView.as_view(),
        name="unsubscribe_all_district",
    ),
    path(
        "email/unsubscribe_all/district",
        views.email_unsubscribe_all_district,
        name="email_unsubscribe_district_all",
    ),
    path(
        "email/unsubscribe/district/<int:subscription_id>",
        views.email_unsubscribe_district,
        name="email_unsubscribe_district",
    ),
]
