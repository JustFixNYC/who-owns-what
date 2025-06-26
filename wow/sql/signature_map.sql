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
WHERE status_current NOT IN ('left_program')
