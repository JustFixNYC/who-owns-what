--- Good Cause Screener
--- -------------------
-- Create a BBL-level table with all the data we need to for the GCE screener
-- tool. Includes information about the property to provide helper text for
-- survey questions and assess GCE coverage, and data on potentially related
-- properties for guide ownership portfolio research on ACRIS.

-- NOTE: There are some temporary tables used here that are created in "create_gce_common.sql"


--- ACRIS Documents
--- ---------------

-- For each BBL, find all the documents since the most recent deed transfer that
-- might have the owner's name/signature on them, and keep the most recent 5
-- documents to generate links for the user to research. For each BBL we also
-- get the number of residential units, and for each of the upt to 5 documents
-- we keep the ACRIS document id, type, and date.

-- Find the most recent deed transfer
CREATE TEMPORARY TABLE x_latest_deeds AS (
	SELECT DISTINCT ON (bbl)
		l.bbl,
		coalesce(m.docdate, m.recordedfiled) AS last_sale_date
	FROM real_property_master AS m
	LEFT JOIN real_property_legals AS l USING(documentid)
	WHERE docamount > 1 AND doctype = any('{DEED,DEEDO}')
	ORDER BY bbl, coalesce(m.docdate, m.recordedfiled) DESC
);

CREATE INDEX ON x_latest_deeds (bbl);

-- Find all the docs with possible owner names since the deed transfer
CREATE TEMPORARY TABLE x_docs_since_latest_deed AS (
	SELECT DISTINCT
		l.bbl,
		m.documentid,
    m.doctype,
		coalesce(m.docdate, m.recordedfiled) AS doc_date,
		row_number() OVER (
			PARTITION BY bbl 
			ORDER BY coalesce(m.docdate, m.recordedfiled) DESC
		) AS doc_order,
		p.unitsres
	FROM real_property_master AS m
	LEFT JOIN real_property_legals AS l USING(documentid)
	LEFT JOIN x_latest_deeds AS d USING(bbl)
	LEFT JOIN pluto_latest AS p USING(bbl)
	WHERE doctype = any('{AGMT,MTGE,AL&R}') 
		AND (
			d.last_sale_date IS NULL
			OR coalesce(m.docdate, m.recordedfiled) > d.last_sale_date
		)
		AND p.unitsres > 0
  ORDER BY bbl, doc_order
);

CREATE INDEX ON x_docs_since_latest_deed (bbl);
CREATE INDEX ON x_docs_since_latest_deed (documentid);
CREATE INDEX ON x_docs_since_latest_deed (doc_order);

-- Take the most recent 5 documents and restructure for a bbl-level table
CREATE TEMPORARY TABLE x_bbl_acris_docs AS (
  SELECT 
    bbl,
    array_to_json(array_agg(json_build_object('doc_id', documentid, 'doc_type', doctype, 'doc_date', doc_date))) AS acris_docs
  FROM x_docs_since_latest_deed
  WHERE doc_order <= 5
  GROUP BY bbl 
);

CREATE INDEX ON x_bbl_acris_docs (bbl);


--- BBLs with Common Ownername (PLUTO) 
--- -----------------------------------

-- Find all BBLs that have the exact same ownername in PLUTO where the ownername
-- is some sort of corporation (LLC, Corp, etc. so we don't include people's
-- names that happen to be the same)

CREATE TEMPORARY TABLE x_ownername_related_bbls AS (
  WITH multi_corp_owners AS (
    SELECT ownername
    FROM pluto_latest
    WHERE unitsres > 0
      AND ownername ~* '\s+(LLC|L\.?P|PARTNERSHIP|PTRSHP|CO|COMPANY|CORP|CORPORATION|FUND|ASSOCIATES|ASSOC|TRUST|INC|BANK|HDFC)\.?$'
    GROUP BY ownername
    HAVING count(*) > 1
  )
  SELECT
    x.bbl AS ref_bbl,
    y.bbl,
    true AS match_ownername
  FROM pluto_latest AS x
  INNER JOIN multi_corp_owners USING(ownername)
  LEFT JOIN pluto_latest AS y USING(ownername)
  WHERE x.bbl != y.bbl
);

CREATE INDEX ON x_ownername_related_bbls (ref_bbl);
CREATE INDEX ON x_ownername_related_bbls (bbl);
CREATE INDEX ON x_ownername_related_bbls (ref_bbl, bbl);


--- BBLs with Multi-BBL Documents
--- -----------------------------

-- For each BBL, find all the other properties it ever appears alongside on a
-- multi-property mortgage/agreement since the last time there was a deed
-- transfer for the property. This indicates they are very likely owned by the
-- same entity (with some possible exceptions, eg. air rights, etc.)

-- Find all the multi-bbl documents
CREATE TEMPORARY TABLE x_multi_bbl_docs AS (
	SELECT documentid
	FROM x_docs_since_latest_deed 
	GROUP BY documentid
	HAVING count(*) > 1
);

CREATE INDEX ON x_multi_bbl_docs (documentid);

-- Link all the BBLs from these docments
CREATE TEMPORARY TABLE x_multi_doc_related_bbls AS (
	SELECT DISTINCT ON (x.bbl, y.bbl)
		x.bbl AS ref_bbl,
		y.bbl AS bbl,
    true AS match_multidoc
	FROM x_docs_since_latest_deed AS x
	INNER JOIN x_multi_bbl_docs USING(documentid)
	LEFT JOIN x_docs_since_latest_deed AS y USING (documentid)
	WHERE x.bbl != y.bbl
	ORDER BY x.bbl, y.bbl, x.doc_date DESC
);

CREATE INDEX ON x_multi_doc_related_bbls (bbl);
CREATE INDEX ON x_multi_doc_related_bbls (ref_bbl);
CREATE INDEX ON x_multi_doc_related_bbls (ref_bbl, bbl);


--- WOW_DATA
--- --------

-- For each BBL, we look at all the other properties within its WOW portfolio
-- and add additional information to help prioritize the most likely to have
-- common ownership. This includes the geographic distance, and whether the
-- primary HPD registration contact matches exactly by name and business address.

-- Get all all the portfolio bbls and fields needed for match quality
CREATE TEMPORARY TABLE x_portfolio_bbls_pluto AS (
	SELECT
		w.bbl, 
		w.portfolio_id,
    (b.housenumber || ' ' || initcap(b.streetname) || ', ' || initcap(b.boro) || ', ' || b.zip) as addr,
		l.name,
		l.bizaddr,
		l.bizhousestreet, 
		l.bizzip,
		p.unitsres,
		ST_Transform(ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326), 2263) AS geom
	FROM x_portfolio_bbls w
	LEFT JOIN wow_bldgs AS b USING(bbl)
	LEFT JOIN pluto_latest AS p USING(bbl)
	LEFT JOIN wow_landlords AS l USING(bbl)
);

-- Create match quality fields
CREATE TEMPORARY TABLE x_wow_related_bbls AS (
	SELECT
		x.bbl AS ref_bbl,
		y.bbl,
    true AS match_wow,
		ST_Distance(x.geom, y.geom) AS distance_ft,
		(x.name = y.name) AS wow_match_name,
		(x.bizaddr = y.bizaddr) AS wow_match_bizaddr_unit
	FROM x_portfolio_bbls_pluto AS x
	LEFT JOIN x_portfolio_bbls_pluto AS y USING(portfolio_id)
	WHERE x.bbl != y.bbl
		AND (
			x.name = y.name 
			OR (x.bizhousestreet = y.bizhousestreet AND x.bizzip = y.bizzip)
		)
);

CREATE INDEX ON x_wow_related_bbls (ref_bbl);
CREATE INDEX ON x_wow_related_bbls (bbl);
CREATE INDEX ON x_wow_related_bbls (ref_bbl, bbl);


--- Related Properties
--- ------------------

-- Combine the 3 sources of related properties, join in ACRIS docs, and
-- restructure for a bbl-level table with json for all related properties and
-- their details.

CREATE TEMPORARY TABLE x_all_related_bbls AS (
  SELECT
    ref_bbl,
    bbl,
    coalesce(o.match_ownername, false) AS match_ownername,
    coalesce(m.match_multidoc, false) AS match_multidoc,
    coalesce(w.match_wow, false) AS match_wow,
    p.unitsres,
    p.address || ', ' || CASE 
			WHEN p.borough = 'MN' THEN 'Manhattan'
			WHEN p.borough = 'BX' THEN 'Bronx'
			WHEN p.borough = 'BK' THEN 'Brooklyn'
			WHEN p.borough = 'QN' THEN 'Queens'
			WHEN p.borough = 'SI' THEN 'Staten Island'
		END || ', ' || p.zipcode AS address,
		w.distance_ft,
		w.wow_match_name,
		w.wow_match_bizaddr_unit,
    coalesce(a.acris_docs, '[]'::json) AS acris_docs
  FROM x_wow_related_bbls AS w
  FULL JOIN x_ownername_related_bbls AS o USING(ref_bbl, bbl)
  FULL JOIN x_multi_doc_related_bbls AS m  USING(ref_bbl, bbl)
  LEFT JOIN pluto_latest AS p USING(bbl)
  LEFT JOIN x_bbl_acris_docs AS a USING(bbl)
  WHERE p.unitsres > 0
);


CREATE TEMPORARY TABLE x_related_bbl_acris_docs AS (
  SELECT
    ref_bbl AS bbl,
    array_to_json(array_agg(row_to_json(x)::jsonb-'ref_bbl')) AS related_properties
  FROM x_all_related_bbls AS x
  GROUP BY ref_bbl
);

CREATE INDEX ON x_related_bbl_acris_docs (bbl);


-- For each BBL, all variables used for data-driven survey questions and helper
-- text and eligibility results.
CREATE TABLE gce_screener AS (
  SELECT 
      p.bbl,
      p.address,
      p.borough,
      p.unitsres,
      p.yearbuilt,
      p.bldgclass,
      p.ownername,
      p.latitude,
      p.longitude,

      co.co_bin,
      co.co_issued,

      coalesce(r.uc2019, 0) AS rs_units_2019,
      coalesce(r.uc2020, 0) AS rs_units_2020, 
      coalesce(r.uc2021, 0) AS rs_units_2021, 
      coalesce(r.uc2022, 0) AS rs_units_2022,
      coalesce(r.uc2023, 0) AS rs_units_2023,

      case 
          when coalesce(nullif(r.uc2023, 0), nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0) > p.unitsres
          then p.unitsres
          else coalesce(nullif(r.uc2023, 0), nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0)
      end AS post_hstpa_rs_units,

      coalesce(s.is_nycha, false) AS is_nycha,
      coalesce(s.is_subsidized, false) AS is_subsidized,
      s.subsidy_name,
      s.end_421a,
      s.end_j51,

      wp.wow_portfolio_units,
      wp.wow_portfolio_bbls,

      coalesce(a.acris_docs, '[]'::json) AS acris_docs,

      coalesce(ra.related_properties, '[]'::json) AS related_properties

  FROM pluto_latest AS p
  LEFT JOIN rentstab_v2 AS r ON p.bbl = r.ucbbl
  LEFT JOIN x_subsidized AS s USING(bbl)
  LEFT JOIN x_latest_cofos AS co USING(bbl)
  LEFT JOIN x_portfolio_bbls_pluto as wb USING(bbl)
  LEFT JOIN x_portfolio_size AS wp USING(portfolio_id)
  LEFT JOIN x_bbl_acris_docs AS a USING(bbl)
  LEFT JOIN x_related_bbl_acris_docs AS ra USING(bbl)
);

CREATE INDEX ON gce_screener (bbl);
