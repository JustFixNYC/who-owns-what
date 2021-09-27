from django.urls import path, include


urlpatterns = [
    path("api/", include("wow.urls")),
]

handler500 = "wow.views.server_error"
