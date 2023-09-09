-- Eviction filing counts for timeline

DROP TABLE IF EXISTS oca_evictions_monthly cascade;

CREATE TABLE oca_evictions_monthly (
    bbl CHAR(10),
    month TEXT,
    evictionfilings INT,
    PRIMARY KEY (bbl, month)
);

INSERT INTO oca_evictions_monthly
    SELECT
        a.bbl,
        TO_CHAR(i.fileddate, 'YYYY-MM') AS month,
        count(distinct indexnumberid) AS evictionfilings
    FROM oca_index AS i
    LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
    WHERE i.classification = any('{Holdover,Non-Payment}') 
        AND i.propertytype = 'Residential'
        AND a.bbl IS NOT NULL
        AND nullif(a.unitsres, '')::numeric > 10
    GROUP BY a.bbl, month;

CREATE INDEX ON oca_evictions_monthly (bbl);
