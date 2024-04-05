from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("wow.urls")),
    path("auth/", include("jfauthprovider.urls")),
]

handler500 = "wow.views.server_error"
