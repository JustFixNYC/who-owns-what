SELECT
    collection_name as landlord_name,
    collection_slug as landlord_slug,
    lender_name,
    lender_slug,
    buildings,
    units_res,
    hpd_viol_bc_open_per_unit,
    debt_per_unit,
    bip_500_pct
FROM signature_collections
WHERE collection_type = 'landlord'
