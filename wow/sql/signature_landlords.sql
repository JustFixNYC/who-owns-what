SELECT
    collection_name as landlord_name,
    collection_slug as landlord_slug,
    loan_pool_name,
    loan_pool_slug,
    buildings_agg,
    units_res_agg,
    hpd_viol_bc_open_per_unit_agg,
    debt_per_unit_agg,
    bip_500_pct_agg
FROM signature_collections
WHERE collection_type = 'landlord'
