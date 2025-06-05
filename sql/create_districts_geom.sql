CREATE TABLE wow_districts_geom AS (
	WITH city_council AS (
		SELECT 
			'coun_dist'::text AS typevalue,
			'City Council District'::text AS typelabel,
			coundist::text AS areavalue,
			'District '::text || coundist AS arealabel,
			geom
		FROM nycc_25a
	), state_assembly AS (
		SELECT 
		  'assem_dist'::text AS typevalue,
			'State Assembly District'::text AS typelabel,
			assemdist::text AS areavalue,
			'District '::text || assemdist AS arealabel,
		  geom
		FROM nyad_25a
	), state_senate AS (
		SELECT 
		  'stsen_dist'::text AS typevalue,
			'State Senate District'::text AS typelabel,
			stsendist::text AS areavalue,
			'District '::text || stsendist AS arealabel,
			geom
		FROM nyss_25a
	), nta AS (
		SELECT 
			'nta'::text AS typevalue,
			'Neighborhood'::text AS typelabel,
			nta2020::text AS areavalue,
			ntaname AS arealabel,
			geom
		FROM nynta2020_25a
	), cd_names AS (
		SELECT DISTINCT ON (cdta2020)
		  borocode,
		  cdta2020,
		  REGEXP_REPLACE(cdtaname, '\(CD.*$|\(JIA.*$', '') AS cdtaname,
		  -- Extract numbers from cdta2020 and concatenate with borocode
		  borocode || REGEXP_REPLACE(cdta2020, '\D', '', 'g') AS borocd
		FROM nynta2020_25a
	), community_district AS (
		SELECT 
			'community_dist'::text AS typevalue,
			'Community District'::text AS typelabel,
			cd.borocd::text AS areavalue,
			trim(x.cdtaname) AS arealabel,
			cd.geom AS geom
		FROM cd_names as x
		FULL JOIN nycd_25a AS cd ON cd.borocd::text = x.borocd
	), zip_code AS (
		SELECT 
			'zipcode'::text AS typevalue,
			'Zip Code'::text AS typelabel,
			zipcode::text AS areavalue,
			zipcode::text AS arealabel,
			geom
		FROM zipcodes
		WHERE zipcode NOT IN ('00083')
	), census_tract AS (
		SELECT
			'census_tract'::text AS typevalue,
			'Census Tract'::text AS typelabel,
			boroct2020::text AS areavalue,
			SUBSTR(nta2020, 1, 2) || ' ' || ct2020 AS arealabel,
		geom
		FROM nyct2020_25a
	)
	SELECT *
	FROM city_council
	UNION
	SELECT *
	FROM state_assembly
	UNION
	SELECT *
	FROM state_senate
	UNION
	SELECT *
	FROM nta
	UNION
	SELECT *
	FROM community_district
	UNION
	SELECT *
	FROM zip_code
	UNION
	SELECT *
	FROM census_tract
);

CREATE INDEX ON wow_districts_geom (typevalue, areavalue);
