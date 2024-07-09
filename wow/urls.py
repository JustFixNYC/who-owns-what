from django.urls import path

from . import views

app_name = "wow"

urlpatterns = [
    path("address", views.address_query, name="address_query"),
    path(
        "address/wowza",
        views.address_query_with_portfolio_graph,
        name="address_query_with_portfolio_graph",
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
    path("alerts/violations", views.alerts_violations, name="alerts_violations"),
    path("email_alerts", views.email_alerts, name="email_alerts"),
    path(
        "email_oca_lag",
        views.email_alerts_lagged_eviction_filings,
        name="email_alerts_lagged_eviction_filings",
    ),
    path("email_alerts_multi", views.email_alerts_multi, name="email_alerts_multi"),
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
]
