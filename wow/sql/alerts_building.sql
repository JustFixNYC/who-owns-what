SELECT
    bbl,
    hpd_viol_all__week,
    hpd_viol_all__bldg_month AS hpd_viol__month,
    hpd_comp__week,
    hpd_comp__bldg_month AS hpd_comp__month,
    dob_ecb_viol__week,
    dob_ecb_viol__bldg_month AS dob_ecb_viol__month,
    dob_comp__week,
    dob_comp__bldg_month AS dob_comp__month,
    evictions_filed__week,
    evictions_filed__bldg_month AS evictions_filed__month,
    lagged_eviction_filings,
    lagged_eviction_date,
    hpd_link
FROM wow_indicators2
WHERE bbl = ANY(%(bbls)s)
