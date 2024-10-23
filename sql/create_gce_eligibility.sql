
-- For each BBL, find all the other properties it ever appears with on a
-- multi-property mortgage/agreement since the last time there was a deed
-- recorded for the property. For each linked property keep the BBL, ACRIS
-- document id, document date, and number of residential units for custom links
-- and context on the results page.

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

CREATE TEMPORARY TABLE x_docs_all AS (
	SELECT DISTINCT
		l.bbl,
		m.documentid,
		coalesce(m.docdate, m.recordedfiled) as doc_date,
		p.unitsres
	FROM real_property_master AS m
	LEFT JOIN real_property_legals AS l USING(documentid)
	LEFT JOIN x_latest_deeds AS d USING(bbl)
	LEFT JOIN pluto_latest AS p USING(bbl)
	WHERE doctype = any('{AGMT,MTGE}') 
		AND coalesce(m.docdate, m.recordedfiled) >= d.last_sale_date
		AND p.unitsres > 0
);

CREATE INDEX ON x_docs_all (documentid);


CREATE TEMPORARY TABLE x_multi_bbl_docs AS (
	SELECT documentid
	FROM x_docs_all 
	GROUP BY documentid
	HAVING count(*) > 1
);

CREATE INDEX ON x_multi_bbl_docs (documentid);


CREATE TEMPORARY TABLE x_linked_bbls AS (
	SELECT DISTINCT ON (x.bbl, y.bbl)
		x.bbl AS ref_bbl,
		x.documentid AS doc_id,
		x.doc_date,
		y.bbl AS bbl,
		y.unitsres
	FROM x_docs_all AS x
	INNER JOIN x_multi_bbl_docs USING(documentid)
	LEFT JOIN x_docs_all AS y USING (documentid)
	WHERE x.bbl != y.bbl
	ORDER BY x.bbl, y.bbl, x.doc_date DESC
);

CREATE INDEX ON x_linked_bbls (bbl);

CREATE TEMPORARY TABLE x_acris_linked_bbls AS (
  SELECT
    ref_bbl AS bbl,
    array_to_json(array_agg(row_to_json(x)::jsonb-'ref_bbl')) AS acris_data
  FROM x_linked_bbls AS x
  GROUP BY ref_bbl
);

CREATE INDEX ON x_acris_linked_bbls (bbl);


-- For each BBL, we look at all the other properties within its WOW portfolio
-- and add additional information to help prioritize the most likely to have
-- common ownership. This includes the geographic distance, and whether the
-- primary HPD registration contact matches exactly by name and business address
-- (full and without unit number). 

CREATE TEMPORARY TABLE x_portfolio_bbls AS (
	WITH wow_bbls AS (
		SELECT 
			unnest(bbls) AS bbl, 
			row_number() OVER (ORDER BY bbls) AS portfolio_id
		FROM wow_portfolios
	)
	SELECT
		w.bbl, 
		w.portfolio_id,
		l.name,
		l.bizaddr,
		l.bizhousestreet, 
		l.bizzip,
		p.unitsres,
		ST_Transform(ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326), 2263) AS geom
	FROM wow_bbls w
	LEFT JOIN pluto_latest AS p USING(bbl)
	LEFT JOIN wow_landlords AS l USING(bbl)
);

CREATE TEMPORARY TABLE x_matched_bbls AS (
	SELECT
		x.bbl AS ref_bbl,
		y.bbl,
		x.unitsres,
		ST_Distance(x.geom, y.geom) AS distance_m,
		(x.name = y.name) AS match_name,
		(x.bizaddr = y.bizaddr) AS match_bizaddr_unit,
		(x.bizhousestreet = y.bizhousestreet AND x.bizzip = y.bizzip) AS match_bizaddr_nounit
	FROM x_portfolio_bbls AS x
	LEFT JOIN x_portfolio_bbls AS y USING(portfolio_id)
	WHERE x.bbl != y.bbl
		AND (
			x.name = y.name 
			OR (x.bizhousestreet = y.bizhousestreet AND x.bizzip = y.bizzip)
		)
);

CREATE INDEX ON x_matched_bbls (ref_bbl);

CREATE TEMPORARY TABLE x_wow_portolio_bldgs AS (
	SELECT 
		ref_bbl AS bbl,
	    array_to_json(array_agg(row_to_json(x)::jsonb-'ref_bbl')) AS wow_data
	FROM x_matched_bbls AS x
	GROUP BY ref_bbl
);

-- For each BBL, get the date of most recent certificate of occupancy, if there
-- is one. Keep the BIN, date, and type for extra context and custom links.
CREATE TEMPORARY TABLE x_all_cofos AS (
  SELECT
    bbl,
    bin,
    coissuedate AS issue_date,
    jobtype AS job_type
  FROM dob_certificate_occupancy
  UNION
  SELECT
    bbl,
    bin,
    issuedate AS issue_date,
    jobtype AS job_type
  FROM dob_foil_certificate_occupancy
);

CREATE INDEX ON x_all_cofos (bbl, issue_date);

CREATE TEMPORARY TABLE x_latest_cofos AS (
  SELECT DISTINCT ON (bbl)
    bbl,
    bin AS co_bin,
    issue_date AS co_issued,
    job_type AS co_type
  FROM x_all_cofos
  WHERE job_type IN ('NB', 'A1') AND issue_date IS NOT NULL
  ORDER BY bbl, issue_date desc
);


-- For each BBL, get the number of additional properties and residential units
-- there are in its WOW portfolio.
CREATE TEMPORARY TABLE x_portolfio_bbls as (
  SELECT 
    unnest(bbls) AS bbl, 
    row_number() OVER (ORDER BY bbls) AS portfolio_id
  FROM wow_portfolios
);

CREATE INDEX ON x_portolfio_bbls (bbl);
CREATE INDEX ON x_portolfio_bbls (portfolio_id);

CREATE TEMPORARY TABLE x_portfolio_size AS (
  SELECT
    portfolio_id,
    sum(unitsres)::numeric AS wow_portfolio_units,
    count(*)::numeric AS wow_portfolio_bbls
  FROM x_portolfio_bbls
  LEFT JOIN pluto_latest USING(bbl)
  GROUP BY portfolio_id
);

CREATE INDEX ON x_portfolio_size (portfolio_id);


-- For each BBL, all variables used for data-driven survey questions and helper
-- text and eligibility results.
CREATE TABLE gce_screener AS (
  WITH nycha_bbls AS (
    SELECT DISTINCT bbl
    FROM nycha_bbls_24
  ),

  article_xi_bbls AS (
    SELECT distinct bbl
    FROM hpd_ll44_projects AS p
    LEFT JOIN hpd_ll44_tax_incentive AS t USING(projectid)
    LEFT JOIN hpd_ll44_buildings AS b USING(projectid)
    WHERE t.taxincentivename = 'Article XI'
  ),

  subsidized AS (
    SELECT
      bbl,
      datahpd,
      datahcrlihtc,
      datahudlihtc,
      datahudcon,
      datahudfin,
      dataml,
      datanycha,
      (datahpd OR datahcrlihtc OR datahudlihtc OR datahudcon OR datahudfin OR dataml) AS is_subsidized,
      end421a AS end_421a,
      endj51 AS end_j51
    FROM fc_shd_building
  )

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
      co.co_type,

      coalesce(r.uc2019, 0) AS rs_units_2019,
      coalesce(r.uc2020, 0) AS rs_units_2020, 
      coalesce(r.uc2021, 0) AS rs_units_2021, 
      coalesce(r.uc2022, 0) AS rs_units_2022,

      coalesce(nullif(r.uc2022, 0), nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0) as post_hstpa_rs_units,

      (nycha.bbl IS NOT NULL OR coalesce(shd.datanycha, false)) AS is_nycha,
      (article_xi.bbl IS NOT NULL) AS is_article_xi,
      coalesce(shd.is_subsidized, false) AS is_subsidized,

      CASE 
        WHEN (datahudcon OR datahudfin) THEN 'HUD Project-Based'
        WHEN (datahudlihtc OR datahcrlihtc) THEN 'Low-Income Housing Tax Credit (LIHTC)'
        WHEN dataml THEN 'Mitchell-Lama'
        WHEN datahpd THEN 'HPD Program'
        WHEN (article_xi.bbl IS NOT NULL) THEN 'Article XI'
        WHEN (nycha.bbl IS NOT NULL OR shd.datanycha) THEN 'NYCHA'
        ELSE NULL
      END AS subsidy_name,

      shd.end_421a,
      shd.end_j51,

      wp.wow_portfolio_units,
      wp.wow_portfolio_bbls,

      a.acris_data,

      wd.wow_data

  FROM pluto_latest AS p
  LEFT JOIN rentstab_v2 AS r ON p.bbl = r.ucbbl
  LEFT JOIN nycha_bbls AS nycha USING(bbl)
  LEFT JOIN article_xi_bbls AS article_xi USING(bbl)
  LEFT JOIN subsidized AS shd USING(bbl)
  LEFT JOIN x_latest_cofos AS co USING(bbl)
  LEFT JOIN x_portolfio_bbls as wb USING(bbl)
  LEFT JOIN x_portfolio_size AS wp USING(portfolio_id)
  LEFT JOIN x_wow_portolio_bldgs AS wd USING(bbl)
  LEFT JOIN x_acris_linked_bbls AS a USING(bbl)
);

CREATE INDEX ON gce_screener (bbl);
