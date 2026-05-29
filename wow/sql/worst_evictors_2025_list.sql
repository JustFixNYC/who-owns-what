SELECT
    citywide_rank,
    ll_name,
    ll_slug,
    total_evictions_2025,
    total_filings_2025,
    total_hpd_violations_bc_2025,
    total_hpd_complaints_2025,
    total_unitsres,
    total_rs_units_24,
    pct_rs,
    count_associated_bbls,
    count_associated_ll_names
FROM worst_evictors_2025_portfolios
ORDER BY citywide_rank ASC;
