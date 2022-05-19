-- Eviction filing counts for property info

CREATE TABLE oca_evictions_bldgs_temporary AS (
    SELECT
        a.bbl,
        count(distinct indexnumberid) AS eviction_filings_since_2017
    FROM oca_index AS i
    LEFT JOIN oca_addresses AS a USING(indexnumberid)
    LEFT JOIN pluto_21v4 AS p USING(bbl)
    WHERE i.fileddate < '2017-01-01'
    AND i.classification = any('{Holdover,Non-Payment}') 
    AND i.propertytype = 'Residential'
    AND a.bbl IS NOT NULL
    AND p.unitsres > 10
    GROUP BY a.bbl
);

DROP TABLE IF EXISTS oca_evictions_bldgs cascade;
ALTER TABLE oca_evictions_bldgs_temporary RENAME TO oca_evictions_bldgs;

CREATE INDEX ON oca_evictions_bldgs (bbl);


-- Indicators for WOW timeline tab

CREATE TABLE oca_evictions_monthly_temporary AS (
    SELECT
        a.bbl,
        date_trunc('month', i.fileddate)::date AS filedmonth,
        count(distinct indexnumberid) AS evictionfilings
    FROM oca_index AS i
    LEFT JOIN oca_addresses AS a USING(indexnumberid)
    LEFT JOIN pluto_21v4 AS p USING(bbl)
    WHERE i.fileddate < '2017-01-01'
    AND i.classification = any('{Holdover,Non-Payment}') 
    AND i.propertytype = 'Residential'
    AND a.bbl IS NOT NULL
    AND p.unitsres > 10
    GROUP BY a.bbl, filedmonth
);

DROP TABLE IF EXISTS oca_evictions_monthly cascade;
ALTER TABLE oca_evictions_monthly_temporary RENAME TO oca_evictions_monthly;

CREATE INDEX ON oca_evictions_monthly (bbl);
CREATE INDEX ON oca_evictions_monthly (bbl, month);

