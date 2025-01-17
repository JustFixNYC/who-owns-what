from django.urls import path

from . import views

app_name = "wow"

urlpatterns = [
    path("address", views.address_query, name="address_query"),
    path(
        "address/wowza",
        views.address_query_wowza,
        name="address_query_wowza",
    ),
    path("address/aggregate", views.address_aggregate, name="address_aggregate"),
    path(
        "address/dap-aggregate",
        views.address_dap_aggregate,
        name="address_dap_aggregate",
    ),
    path(
        "address/dap-portfoliosize",
        views.address_dap_portfoliosize,
        name="address_dap_portfoliosize",
    ),
    path(
        "address/buildinginfo", views.address_buildinginfo, name="address_buildinginfo"
    ),
    path(
        "address/indicatorhistory",
        views.address_indicatorhistory,
        name="address_indicatorhistory",
    ),
    path("address/export", views.address_export, name="address_export"),
    path("address/latestdeed", views.address_latestdeed, name="address_latestdeed"),
    path("alerts/building", views.email_alerts_building, name="email_alerts_building"),
    path("signature/building", views.signature_building, name="signature_building"),
    path(
        "signature/building/charts",
        views.signature_building_charts,
        name="signature_building_charts",
    ),
    path(
        "signature/collection", views.signature_collection, name="signature_collection"
    ),
    path(
        "signature/collection/charts",
        views.signature_collection_charts,
        name="signature_collection_charts",
    ),
    path("signature/landlords", views.signature_landlords, name="signature_landlords"),
    path(
        "signature/portfolios", views.signature_portfolios, name="signature_portfolios"
    ),
    path("signature/map", views.signature_map, name="signature_map"),
    path(
        "dataset/last_updated", views.dataset_last_updated, name="dataset_last_updated"
    ),
    path("gce/screener", views.gce_screener, name="gce_screener"),
]
