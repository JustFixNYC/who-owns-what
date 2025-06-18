-- with req_bbl as (
--     SELECT %(bbl)s::text AS bbl
-- ),
-- violations as (
--     SELECT
--         bbl,
--         count(*) AS violations
--     FROM hpd_violations
--     WHERE bbl = %(bbl)s::text
--         AND coalesce(inspectiondate, novissueddate) BETWEEN %(start_date)s AND %(end_date)s
--     GROUP BY bbl
-- ),
-- complaints AS (
--     SELECT
--         bbl,
--         count(*) AS complaints
--     FROM hpd_complaints_and_problems
--     WHERE bbl = %(bbl)s::text
--         AND receiveddate BETWEEN %(start_date)s AND %(end_date)s
--     GROUP BY bbl
-- ),
-- oca_report_threshold AS (
--     SELECT 
--     	bbl,
--         (coalesce(unitsres, 0) < 11) AS cant_report_oca
--     FROM pluto_latest
--     WHERE bbl = %(bbl)s::text
-- ),
-- eviction_filings AS (
--     SELECT
--         bbl,
--         coalesce(count(distinct indexnumberid), 0)::numeric AS eviction_filings
--     FROM oca_index AS i
--     LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
--     WHERE a.bbl = %(bbl)s::text
--         AND i.fileddate BETWEEN %(start_date)s AND %(end_date)s
--         AND i.classification = any('{Holdover,Non-Payment}')
--         AND i.propertytype = 'Residential'
--     GROUP BY bbl
-- ),
-- lagged_oca AS (
--     SELECT
--         bbl,
--         coalesce(count(distinct indexnumberid), 0)::numeric AS lagged_eviction_filings,
--         max(i.fileddate) AS lagged_eviction_date
--     FROM oca_addresses_with_bbl AS a
--     LEFT JOIN oca_index AS i USING(indexnumberid)
--     LEFT JOIN oca_metadata AS m USING(indexnumberid)
--     WHERE a.bbl = %(bbl)s::text
--         AND i.classification = any('{Holdover,Non-Payment}')
--         AND i.propertytype = 'Residential'
--         AND m.initialdate > %(prev_date)s 
--         AND i.fileddate < %(prev_date)s 
--         AND i.fileddate > %(oldest_filed_date)s
--     GROUP BY BBL
-- ),
-- hpd_link AS (
--     SELECT DISTINCT
--         bbl,
--         CASE 
--             WHEN hpdbuildingid IS NOT NULL AND hpdbuildings = 1
--                 THEN concat('https://hpdonline.nyc.gov/hpdonline/building/', hpdbuildingid)
--             ELSE NULL 
--         END AS hpd_link
--     FROM wow_bldgs
--     WHERE bbl = %(bbl)s::text
-- )
-- SELECT
--     bbl,
--     coalesce(v.violations, 0)::numeric AS violations,
--     coalesce(c.complaints, 0)::numeric AS complaints,
--     CASE 
--         WHEN coalesce(o.cant_report_oca, true) THEN NULL
--         ELSE coalesce(e.eviction_filings, 0)::numeric 
--         END AS eviction_filings,
--     CASE 
--         WHEN coalesce(o.cant_report_oca, true) THEN NULL
--         ELSE coalesce(l.lagged_eviction_filings, 0)::numeric 
--         END AS lagged_eviction_filings,
--     l.lagged_eviction_date,
--     CASE 
--         WHEN h.hpd_link IS NOT NULL THEN h.hpd_link
--         ELSE 
--             concat(
--                 'https://hpdonline.nyc.gov/hpdonline/building/search-results', 
--                 '?boroId=', substr(bbl, 1, 1),
--                 '&block=', substr(bbl, 2, 5), 
--                 '&lot=', substr(bbl, 7, 4)
--             )
--         END AS hpd_link
-- FROM req_bbl
-- LEFT JOIN violations AS v USING(bbl)
-- LEFT JOIN complaints AS c USING(bbl)
-- LEFT JOIN oca_report_threshold AS o USING(bbl)
-- LEFT JOIN eviction_filings AS e USING(bbl)
-- LEFT JOIN lagged_oca AS l USING(bbl)
-- LEFT JOIN hpd_link AS h USING(bbl)


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
FROM wow_indicators
WHERE bbl = %(bbl)s