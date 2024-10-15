SELECT
    bbl,
    unitsres,
    wow_portfolio_units,
    wow_portfolio_bbls,
    bldgclass,
    bldgclass_desc,
    eligible_bldgclass,
    yearbuilt,
    latest_co,
    co_bin,
    post_hstpa_rs_units,
    is_nycha,
    is_subsidized
FROM gce_screener
WHERE bbl = %(bbl)s
