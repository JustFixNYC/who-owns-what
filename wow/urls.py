from django.urls import path
from django.shortcuts import redirect

from . import views

app_name = "wow"


def redirect_to_bbl(request):
    """
    Redirect address-based URLs to BBL-based URLs.
    """
    # Extract parameters from the request (e.g., city, street, number)
    city = request.GET.get("city")
    street = request.GET.get("street")
    number = request.GET.get("number")

    # Fetch the corresponding BBL from the database
    bbl = call_db_func("get_bbl_from_address", [city, street, number])

    if not bbl:
        return JsonResponse({"error": "Address not found"}, status=404)

    return redirect("wow:property_by_bbl", bbl=bbl)

urlpatterns += [
    path("address/<str:city>/<str:street>/<str:number>/", redirect_to_bbl),
]

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
    path("dataset/tracker", views.dataset_tracker, name="dataset_tracker"),
    path("gce/screener", views.gce_screener, name="gce_screener"),
]
