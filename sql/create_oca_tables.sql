-- Set up the table in our WOW db to populate with the data from the OCA level-2
-- process. This table is created from the private address-level data that we in
-- the OCA Data Collective have access to. This table has removed the sensitive
-- street address fields and retains only the BBL (from geocoding process with
-- NYC's Geosupport). Also, the BBL is suppressed (null) any record from a
-- building with < 11 residential units, per our agreement with OCA. So,
-- technically, all of the data here can be published, however within the
-- collective we have decided to not make it fully public yet, because of
-- privacy concerns. We only display a more aggregated/less detailed version on
-- WOW and DAP Portal. 


DROP TABLE IF EXISTS oca_addresses_with_bbl cascade;

CREATE TABLE oca_addresses_with_bbl (
		indexnumberid text,
		city text,
		state text,
		postalcode text,
		borough_code text,
		place_name text,
		boro text,
		cd text,
		ct text, -- legacy: ct is for census 2010 geographies
		bct2020 text,
		bctcb2020 text,
		ct2010 text,
		cb2010 text,
		council text,
		grc text,
		grc2 text,
		msg text,
		msg2 text,
		unitsres text,
        bbl char(10)
);

CREATE INDEX ON oca_addresses_with_bbl (indexnumberid);
CREATE INDEX ON oca_addresses_with_bbl (bbl);


DROP TABLE IF EXISTS oca_evictions_bldgs cascade;

CREATE TABLE oca_evictions_bldgs (
    bbl CHAR(10) PRIMARY KEY,
    eviction_filings_since_2017 INT
);

CREATE INDEX ON oca_evictions_bldgs (bbl);


DROP TABLE IF EXISTS oca_evictions_monthly cascade;

CREATE TABLE oca_evictions_monthly (
    bbl CHAR(10),
    month TEXT,
    evictionfilings INT,
    PRIMARY KEY (bbl, month)
);

CREATE INDEX ON oca_evictions_monthly (bbl);
