from django.contrib import admin
from django.urls import path, include
from . import views


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("wow.urls")),
    path("auth/", include("jfauthprovider.urls")),
    path("address", views.address_query, name="address_query"),
    path("bbl/<str:bbl>/", views.property_by_bbl, name="property_by_bbl"),
]

handler500 = "wow.views.server_error"
