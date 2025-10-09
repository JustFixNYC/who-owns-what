SELECT
    bbl,
    address,
    borough,
    zip,
    landlord_slug,
    landlord,
    loan_pool_slug,
    lat,
    lng
FROM signature_buildings2
WHERE latest_action NOT IN ('satisfied', 'sold_market', 'sold_preservation', 'sold_foreclosure')
