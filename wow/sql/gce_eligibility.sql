SELECT
    bbl,
    unitsres,
    wow_portfolio_units,
    wow_portfolio_bbls,
    bldgclass,
    yearbuilt,
    co_issued,
    co_bin,
    post_hstpa_rs_units,
    is_nycha,
    is_subsidized,
    subsidy_name,
    end_421a,
    end_j51,
    acris_data
FROM gce_screener
WHERE bbl = %(bbl)s
