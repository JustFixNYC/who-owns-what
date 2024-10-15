SELECT
    bbl,
    unitsres,
    wow_portfolio_units,
    wow_portfolio_bbls,
    bldgclass,
    bldgclass_desc,
    yearbuilt,
    latest_co,
    co_bin,
    post_hstpa_rs_units,
    is_nycha,
    is_subsidized,
    end_421a,
    end_j51
FROM gce_screener
WHERE bbl = %(bbl)s
