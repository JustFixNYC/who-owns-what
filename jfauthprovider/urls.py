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
    path("resend_verify_email", views.resend_verify_email, name="resend_verify_email"),
    path("reset_password", views.password_reset_request, name="password_reset_request"),
    path("reset_password/check", views.password_reset_token_check, name="password_reset_token_check"),
    path("set_password", views.password_reset, name="password_reset"),
    path("change_password", views.password_change, name="password_change"),
    path(
        "subscriptions/<int:bbl>",
        views.SubscriptionView.as_view(),
        name="subscriptions",
    ),
    path(
        "email/subscriptions",
        views.email_user_subscriptions,
        name="email_user_subscriptions",
    ),
    path(
        "email/unsubscribe", views.email_unsubscribe_all, name="email_unsubscribe_all"
    ),
    path("unsubscribe/<int:bbl>", views.email_unsubscribe, name="email_unsubscribe"),
]
