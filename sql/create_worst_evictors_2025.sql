DROP TABLE IF EXISTS worst_evictors_2025_map_points;
DROP TABLE IF EXISTS worst_evictors_2025_portfolios;

CREATE TABLE worst_evictors_2025_portfolios AS
WITH owners AS (
    SELECT
        CASE
            WHEN concat(firstname, ' ', lastname) = any(
                '{
                    "DAVID ROSE","EDDIE LJESNJANIN","EDWARD SUAZO","MARC BARHORIN",
                    "ABDIN RADONCIC","ABIDIN RADONCIC","DAVID RADONCIC","DAVID RADONIC",
                    "ELINOR ARZT","RASIM TOSKIC"
                }'
            ) THEN 'PINNACLE'
            ELSE upper(concat(firstname, ' ', lastname))
        END AS ll_name,
        upper(
            concat(
                businesshousenumber, ' ',
                businessstreetname, ' ',
                businessapartment, ', ',
                businesscity, ', ',
                businessstate
            )
        ) AS address,
        r.bbl
    FROM hpd_contacts c
    LEFT JOIN hpd_registrations r ON r.registrationid = c.registrationid
    WHERE type = any('{HeadOfficer,IndividualOwner,CorporateOwner}')
      AND (businesshousenumber IS NOT NULL OR businessstreetname IS NOT NULL)
      AND length(concat(businesshousenumber, businessstreetname)) > 2
      AND (firstname IS NOT NULL OR lastname IS NOT NULL)
      AND r.bbl IS NOT NULL
    GROUP BY ll_name, address, r.bbl
),
owners_with_assoc AS (
    SELECT
        o.*,
        o2.ll_name AS assoc_ll_name,
        o2.bbl AS assoc_bbl
    FROM owners o
    LEFT JOIN owners o2 ON o2.address = o.address
),
associated_owners AS (
    SELECT
        ll_name,
        array_agg(DISTINCT address ORDER BY address) AS ll_business_addresses,
        count(DISTINCT address) AS count_ll_business_addresses,
        array_agg(DISTINCT assoc_ll_name ORDER BY assoc_ll_name) AS associated_ll_names,
        count(DISTINCT assoc_ll_name) AS count_associated_ll_names,
        array_agg(DISTINCT assoc_bbl ORDER BY assoc_bbl) AS associated_bbls,
        count(DISTINCT assoc_bbl) AS count_associated_bbls
    FROM owners_with_assoc
    GROUP BY ll_name
),
portfolios AS (
    SELECT
        ao.associated_bbls,
        array_agg(DISTINCT n.name ORDER BY n.name) AS associated_ll_names,
        array_agg(DISTINCT a.address ORDER BY a.address) AS ll_business_addresses,
        cardinality(ao.associated_bbls) AS count_associated_bbls,
        count(DISTINCT n.name) AS count_associated_ll_names,
        count(DISTINCT a.address) AS count_ll_business_addresses,
        min(n.name) AS ll_name
    FROM associated_owners ao
    LEFT JOIN LATERAL unnest(ao.associated_ll_names) AS n(name) ON true
    LEFT JOIN LATERAL unnest(ao.ll_business_addresses) AS a(address) ON true
    GROUP BY ao.associated_bbls
),
associated_bbls AS (
    SELECT DISTINCT associated_bbls
    FROM portfolios
),
associated_bbls_unnested AS (
    SELECT
        associated_bbls,
        trim(unnest(associated_bbls)::text) AS bbl
    FROM associated_bbls
),
evictions_by_bbl AS (
    SELECT
        bbl,
        count(*) AS evictions
    FROM marshal_evictions_all
    WHERE bbl IS NOT NULL
      AND residentialcommercialind = any('{R,Residential,RESIDENTIAL}')
      AND executeddate >= date '2025-01-01'
      AND executeddate < date '2026-01-01'
    GROUP BY bbl
),
hpd_violations_bc_by_bbl AS (
    SELECT
        bbl,
        count(*) AS hpd_violations_bc
    FROM hpd_violations
    WHERE bbl IS NOT NULL
      AND class = any('{B,C}')
      AND inspectiondate >= date '2025-01-01'
      AND inspectiondate < date '2026-01-01'
    GROUP BY bbl
),
hpd_complaints_by_bbl AS (
    SELECT
        bbl,
        count(*) AS hpd_complaints
    FROM hpd_complaints_and_problems
    WHERE bbl IS NOT NULL
      AND receiveddate >= date '2025-01-01'
      AND receiveddate < date '2026-01-01'
    GROUP BY bbl
),
eviction_filings_by_bbl AS (
    SELECT
        a.bbl,
        count(DISTINCT i.indexnumberid) AS filings
    FROM oca_index i
    LEFT JOIN oca_addresses_with_bbl a USING (indexnumberid)
    WHERE i.fileddate >= date '2025-01-01'
      AND i.fileddate < date '2026-01-01'
      AND i.classification = any('{Holdover,Non-Payment}')
      AND i.propertytype = 'Residential'
      AND a.bbl IS NOT NULL
    GROUP BY a.bbl
),
associated_bbls_with_data AS (
    SELECT
        abu.associated_bbls,
        abu.bbl,
        coalesce(e.evictions, 0) AS evictions,
        coalesce(f.filings, 0) AS filings,
        coalesce(v.hpd_violations_bc, 0) AS hpd_violations_bc,
        coalesce(c.hpd_complaints, 0) AS hpd_complaints,
        coalesce(p.unitsres, 0) AS unitsres,
        coalesce(r.uc2024, 0) AS unitsstab2024
    FROM associated_bbls_unnested abu
    LEFT JOIN evictions_by_bbl e ON e.bbl::text = abu.bbl
    LEFT JOIN eviction_filings_by_bbl f ON f.bbl::text = abu.bbl
    LEFT JOIN hpd_violations_bc_by_bbl v ON v.bbl::text = abu.bbl
    LEFT JOIN hpd_complaints_by_bbl c ON c.bbl::text = abu.bbl
    LEFT JOIN pluto_latest p ON p.bbl::text = abu.bbl
    LEFT JOIN rentstab_v2 r ON r.ucbbl::text = abu.bbl
),
portfolio_metrics AS (
    SELECT
        associated_bbls,
        sum(evictions) AS total_evictions_2025,
        sum(filings) AS total_filings_2025,
        sum(hpd_violations_bc) AS total_hpd_violations_bc_2025,
        sum(hpd_complaints) AS total_hpd_complaints_2025,
        sum(unitsres) AS total_unitsres,
        sum(unitsstab2024) AS total_rs_units_24
    FROM associated_bbls_with_data
    GROUP BY associated_bbls
)
SELECT
    row_number() OVER (
        ORDER BY pm.total_evictions_2025 DESC NULLS LAST, p.ll_name ASC
    )::int AS citywide_rank,
    pm.total_evictions_2025::int,
    pm.total_hpd_violations_bc_2025::int,
    pm.total_hpd_complaints_2025::int,
    pm.total_unitsres::int,
    pm.total_filings_2025::int,
    CASE
        WHEN pm.total_unitsres > 0 THEN round(pm.total_filings_2025::numeric / pm.total_unitsres::numeric, 1)
        ELSE 0
    END AS filings_per_family,
    pm.total_rs_units_24::int,
    CASE
        WHEN pm.total_unitsres > 0 THEN round(pm.total_rs_units_24::numeric / pm.total_unitsres::numeric * 100, 0)
        ELSE 0
    END AS pct_rs,
    p.ll_name,
    trim(BOTH '-' FROM regexp_replace(lower(trim(p.ll_name)), '[^a-z0-9_-]+', '-', 'gi')) AS ll_slug,
    p.ll_business_addresses,
    p.count_ll_business_addresses::int,
    p.associated_ll_names,
    p.count_associated_ll_names::int,
    p.associated_bbls,
    p.count_associated_bbls::int
FROM portfolios p
LEFT JOIN portfolio_metrics pm ON p.associated_bbls = pm.associated_bbls
ORDER BY pm.total_evictions_2025 DESC NULLS LAST, p.ll_name ASC
LIMIT 150;

CREATE INDEX ON worst_evictors_2025_portfolios (citywide_rank);
CREATE INDEX ON worst_evictors_2025_portfolios (ll_slug);

CREATE TABLE worst_evictors_2025_map_points AS
SELECT
    p.citywide_rank,
    p.ll_name,
    p.ll_slug,
    bbls.bbl,
    pl.address,
    CASE
        WHEN pl.borough = 'MN' THEN 'Manhattan'
        WHEN pl.borough = 'BX' THEN 'Bronx'
        WHEN pl.borough = 'BK' THEN 'Brooklyn'
        WHEN pl.borough = 'QN' THEN 'Queens'
        WHEN pl.borough = 'SI' THEN 'Staten Island'
        ELSE pl.borough
    END AS borough,
    pl.zipcode AS zip,
    pl.latitude AS lat,
    pl.longitude AS lng,
    pl.unitsres::int AS units_res,
    p.total_evictions_2025,
    p.total_filings_2025,
    p.total_hpd_violations_bc_2025,
    p.total_hpd_complaints_2025
FROM worst_evictors_2025_portfolios p
CROSS JOIN LATERAL unnest(p.associated_bbls) AS bbls(bbl)
LEFT JOIN pluto_latest pl ON pl.bbl = trim(bbls.bbl::text)
WHERE pl.latitude IS NOT NULL
  AND pl.longitude IS NOT NULL
  AND pl.address IS NOT NULL;

CREATE INDEX ON worst_evictors_2025_map_points (citywide_rank);
CREATE INDEX ON worst_evictors_2025_map_points (ll_slug);
CREATE INDEX ON worst_evictors_2025_map_points (bbl);
