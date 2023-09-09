-- Eviction filing counts for property info

DROP TABLE IF EXISTS oca_evictions_bldgs cascade;

CREATE TABLE oca_evictions_bldgs (
    bbl CHAR(10) PRIMARY KEY,
    eviction_filings_since_2017 INT
);

INSERT INTO oca_evictions_bldgs
    SELECT
        a.bbl,
        count(distinct indexnumberid) AS eviction_filings_since_2017
    FROM oca_index AS i
    LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
    WHERE i.fileddate >= '2017-01-01'
        AND i.classification = any('{Holdover,Non-Payment}') 
        AND i.propertytype = 'Residential'
        AND a.bbl IS NOT NULL
        AND nullif(a.unitsres, '')::numeric > 10
    GROUP BY a.bbl;

CREATE INDEX ON oca_evictions_bldgs (bbl);
