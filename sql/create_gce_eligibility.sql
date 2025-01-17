--- Good Cause Eligibility
--- ----------------------
-- Use all the data we have available to estimate eligibility for Good Cause
-- Eviction protections. Uses much of the data data we use for the gce_screener
-- table and our standalone tool to guide users through questions and manual
-- research to confirm their coverage with greater certainty. This uses only the
-- data and some assumptions to estimate eligibility. Currently we aren't using
-- this for any tools, but it's helpful for some data requests and the Housing
-- Data Coalition is working on a map to display the results to help with
-- outreach.

-- NOTE: There are some temporary tables used here that are created in "create_gce_common.sql"



-- For each BBL, join together all variables and create an indicator of likely
-- eligibility for Good Cause Eviction protections

CREATE TABLE gce_eligibility2 AS (
    WITH all_data AS (
        SELECT 
            p.bbl,
            p.address,
            p.borough,
            p.zipcode,
            p.unitsres,
            p.yearbuilt,
            p.ownername,


            p.bldgclass,

            (   p.bldgclass !~* '^[RIMHW]|C8|C6|CC|D0|DC|D4' -- No Condo (R), Co-Op (C8,C6,CC,D0,DC,D4), Health (I), Religious (M), Hotel (H), or Educational (W)
                AND p.bbl != '5013920002' -- NYC's only manufactured housing park
            ) AS eligible_bldgclass,


            co.co_bin,
            co.co_issued,
            
            (   co.co_issued IS NULL 
                OR co.co_issued <= '2009-01-01'
            ) AS eligible_co,


            coalesce(s.active_421a, false) AS active_421a,
            coalesce(s.active_j51, false) AS active_j51,
            case 
                when coalesce(nullif(r.uc2023, 0), nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0) > unitsres
                then unitsres
                else coalesce(nullif(r.uc2023, 0), nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0)
            end AS post_hstpa_rs_units,

            (   coalesce(nullif(r.uc2023, 0), nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0) = 0
                AND NOT coalesce(s.active_421a, false)
                AND NOT coalesce(s.active_j51, false)
            ) AS eligible_rent_stab,


            s.subsidy_name,
            
            NOT coalesce(s.is_subsidized, false) AS eligible_subsidy,


            wp.wow_portfolio_units,
            wp.wow_portfolio_bbls,

            (   p.unitsres > 10
                OR (
                    wp.wow_portfolio_units > 10
                    -- AND not owner-occupied (waiting for new STAR exemption indicator)
                )
            ) AS eligible_portfolio_size,

            p.latitude,
            p.longitude,
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326) AS geom

        FROM pluto_latest AS p
        LEFT JOIN rentstab_v2 AS r ON p.bbl = r.ucbbl
        LEFT JOIN x_subsidized AS s USING(bbl)
        LEFT JOIN x_latest_cofos AS co USING(bbl)
        LEFT JOIN x_portfolio_bbls AS wb USING(bbl)
        LEFT JOIN x_portfolio_size AS wp USING(portfolio_id)
    )
    SELECT
        bbl,
        address,
        borough,
        zipcode,
        unitsres,
        yearbuilt,
        ownername,

        bldgclass,
        co_bin,
        co_issued,
        subsidy_name,
        active_421a,
        active_j51,
        post_hstpa_rs_units,
        wow_portfolio_units,
        wow_portfolio_bbls,

        eligible_bldgclass,
        eligible_co,
        eligible_rent_stab,
        eligible_subsidy,
        eligible_portfolio_size,

        (   eligible_bldgclass
            AND eligible_co
            AND eligible_rent_stab
            AND eligible_subsidy
            AND eligible_portfolio_size
        ) AS eligible,

        geom
    FROM all_data
);

CREATE INDEX ON gce_eligibility (bbl);
CREATE INDEX ON gce_eligibility USING GIST (geom);
