CREATE TABLE wow_districts_geom AS (
	WITH city_council AS (
		SELECT 
			'coun_dist' AS typevalue,
			'City Council' AS typelabel,
			coundist::text AS areavalue,
			'District ' || coundist AS arealabel,
			geom
		FROM nycc
	), state_assembly AS (
		SELECT 
		  'assem_dist' AS typevalue,
			'State Assembly' AS typelabel,
			assemdist::text AS areavalue,
			'District ' || assemdist AS arealabel,
		  geom
		FROM nyad
	), state_senate AS (
		SELECT 
		  'stsen_dist' AS typevalue,
			'State Senate' AS typelabel,
			stsendist::text AS areavalue,
			'District ' || stsendist AS arealabel,
			geom
		FROM nyss
	), congress AS (
		SELECT 
		  'cong_dist' AS typevalue,
			'Congress' AS typelabel,
			congdist::text AS areavalue,
			'District ' || congdist AS arealabel,
		  geom
		FROM nycg
	), nta AS (
		SELECT 
		  'nta' AS typevalue,
			'Neighborhood' AS typelabel,
			nta2020::text AS areavalue,
			ntaname AS arealabel,
		  geom
		FROM nynta2020
	), borough AS (
		SELECT 
		  'borough' AS typevalue,
			'Borough' AS typelabel,
			borocode::text AS areavalue,
			boroname AS arealabel,
		  geom
		FROM nybb
	), cd_names AS (
		SELECT DISTINCT ON (cdta2020)
		  borocode,
		  cdta2020,
		  REGEXP_REPLACE(cdtaname, '\(CD.*$|\(JIA.*$', '') AS cdtaname,
		  -- Extract numbers from cdta2020 and concatenate with borocode
		  borocode || REGEXP_REPLACE(cdta2020, '\D', '', 'g') AS borocd
		FROM nynta2020
	), community_district AS (
		SELECT 
		  'community_dist' AS typevalue,
			'Community District' AS typelabel,
			nycd.borocd::text AS areavalue,
			x.cdtaname AS arealabel,
			nycd.geom AS geom
		FROM cd_names as x
		FULL JOIN nycd ON nycd.borocd::text = x.borocd
	), zip_code AS (
		
		SELECT 
		  'zipcode' AS typevalue,
			'Zip Code' AS typelabel,
			zipcode::text AS areavalue,
			zipcode AS arealabel,
		  geom
		FROM zipcodes
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
	FROM congress
	UNION
	SELECT *
	FROM nta
	UNION
	SELECT *
	FROM borough
	UNION
	SELECT *
	FROM community_district
	UNION
	SELECT *
	FROM zip_code
);

CREATE INDEX ON wow_districts_geom (typevalue, areavalue);
