-- Eviction filing counts for property info

DROP TABLE IF EXISTS oca_evictions_bldgs cascade;
CREATE TABLE oca_evictions_bldgs (
    bbl CHAR(10) PRIMARY KEY,
    eviction_filings_since_2017 INT
);
CREATE INDEX ON oca_evictions_bldgs (bbl);

