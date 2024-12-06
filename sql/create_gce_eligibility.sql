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


---- Who-Owns-What Portfolios

-- For each BBL, get the WOW portfolio_id (these are regenerated each month when
-- HPD registrations are updated)

CREATE TEMPORARY TABLE x_portfolio_bbls AS (
    SELECT 
        unnest(bbls) AS bbl, 
        row_number() OVER (ORDER BY bbls) AS portfolio_id
    FROM wow_portfolios
);

CREATE INDEX ON x_portfolio_bbls (bbl);

-- For each portfolio, get the number of properties and total number of
-- residential units

CREATE TEMPORARY TABLE x_portfolio_size AS (
    SELECT
        portfolio_id,
        sum(unitsres)::numeric AS wow_portfolio_units,
        count(*)::numeric AS wow_portfolio_bbls
    FROM x_portfolio_bbls AS w
    LEFT JOIN pluto_latest AS p USING(bbl)
    GROUP BY portfolio_id
);

CREATE INDEX ON x_portfolio_size (portfolio_id);


--- Certificates of Occupancy

-- For each BBL, get the date of most recent certificate of occupancy, if there
-- is one. Keep the BIN, date, and type for extra context and custom links.

CREATE TEMPORARY TABLE x_all_cofos AS (
  SELECT
    bbl,
    bin,
    coissuedate AS issue_date,
    jobtype AS job_type
  FROM dob_certificate_occupancy
  UNION
  SELECT
    bbl,
    bin,
    issuedate AS issue_date,
    jobtype AS job_type
  FROM dob_foil_certificate_occupancy
);

CREATE INDEX ON x_all_cofos (bbl, issue_date);

CREATE TEMPORARY TABLE x_latest_cofos AS (
  SELECT DISTINCT ON (bbl)
    bbl,
    bin AS co_bin,
    issue_date AS co_issued,
    job_type AS co_type
  FROM x_all_cofos
  WHERE job_type IN ('NB', 'A1') AND issue_date IS NOT NULL
  ORDER BY bbl, issue_date desc
);

CREATE INDEX ON x_latest_cofos (bbl);


--- Subsidized Housing

-- Combine all sources of data on subsidy status of properties

CREATE TEMPORARY TABLE x_subsidized AS (
    WITH nycha_bbls AS (
        SELECT DISTINCT bbl
        FROM nycha_bbls_24
    ),

    article_xi_bbls AS (
        SELECT distinct bbl
        FROM hpd_ll44_projects AS p
        LEFT JOIN hpd_ll44_tax_incentive AS t USING(projectid)
        LEFT JOIN hpd_ll44_buildings AS b USING(projectid)
        WHERE t.taxincentivename = 'Article XI'
    )
    SELECT
    bbl,
 
    (   shd.datahpd 
        OR shd.datahcrlihtc 
        OR shd.datahudlihtc 
        OR shd.datahudcon 
        OR shd.datahudfin 
        OR shd.dataml
        OR shd.datanycha
        OR nycha.bbl IS NOT NULL
        OR article_xi.bbl IS NOT NULL
    ) AS is_subsidized,

    (end421a > CURRENT_DATE) AS active_421a,

    (endj51 > CURRENT_DATE) AS active_j51,

    CASE 
        WHEN (shd.datahudcon OR shd.datahudfin) THEN 'HUD Project-Based'
        WHEN (shd.datahudlihtc OR shd.datahcrlihtc) THEN 'Low-Income Housing Tax Credit (LIHTC)'
        WHEN shd.dataml THEN 'Mitchell-Lama'
        WHEN shd.datahpd THEN 'HPD Program'
        WHEN (article_xi.bbl IS NOT NULL) THEN 'Article XI'
        WHEN (nycha.bbl IS NOT NULL OR shd.datanycha) THEN 'NYCHA'
        ELSE NULL
    END AS subsidy_name

    FROM fc_shd_building AS shd
    FULL JOIN article_xi_bbls AS article_xi USING(bbl)
    FULL JOIN nycha_bbls AS nycha USING(bbl)
);

CREATE INDEX ON x_subsidized (bbl);


--- Good Cause Eligibility

-- For each BBL, join together all variables and create an indicator of likely
-- eligibility for Good Cause Eviction protections

CREATE TABLE gce_eligibility AS (
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
            coalesce(nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0) AS post_hsta_rs_units,

            (   coalesce(nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0) = 0
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
        post_hsta_rs_units,
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
