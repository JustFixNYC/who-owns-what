-- For the two GCE tables (screener & eligibility) there are a number of
-- temporary tables that are used in both. To avoid repetition, and any issues
-- of duplicate table warnings when running the job in k8s-loader we'll define
-- those here and run this first so they are available in the other two

--- Array concatenate aggregate function 
--- ------------------------------------
-- This is used when preparing ACRIS party names to look for matches
-- for use in prioritization of related properties on GCE portfolio size guide page
CREATE OR REPLACE AGGREGATE array_concat_agg(anyarray) (
   SFUNC = array_cat,
   STYPE = anyarray
);


--- Certificates of Occupancy
--- -------------------------

-- For each BBL, we need the date of most recent certificate of occupancy, if
-- there is one. We'll keep the BIN, BBL, date, and type for extra context and
-- custom links. Because BBLs change over time, some older CofO records might
-- not match to any current BBLs, so we need to first update the BBL where
-- needed/possible. To do this we use the BIN from the CofO record and use that
-- to join with PAD to get the BBL currently associated with that BIN. Then we
-- join all the CofO records with PLUTO using both the original BBL and the
-- updated BBL from PAD, to make sure that these BBLs exist for currently
-- existing residential buildings that we'd be looking at on the GCE tool. 

CREATE TEMPORARY TABLE x_all_cofos_orig AS (
	SELECT
        bbl,
        bin,
        coissuedate AS issue_date,
        jobtype
	FROM dob_certificate_occupancy
	UNION
	SELECT
        bbl,
        bin,
        issuedate AS issue_date,
        jobtype
	FROM dob_foil_certificate_occupancy
	UNION
	SELECT
        bbl,
        bin,
        cofoissuancedate::date AS issue_date,
        CASE 
            WHEN jobtype ~* 'ALTERATION' THEN 'A1'
            WHEN jobtype ~* 'NEW BUILDING' THEN 'NB'
	    END AS jobtype
	FROM dob_now_certificate_occupancy
);

CREATE INDEX ON x_all_cofos_orig (bin);
CREATE INDEX ON x_all_cofos_orig (bbl);


CREATE TEMPORARY TABLE x_pad_bin_bbl AS (
  -- PAD is address level, and so has some duplicates of bin-bbl we need to
  -- remove before joining
	SELECT DISTINCT bin, bbl
	FROM pad_adr
);
CREATE INDEX ON x_pad_bin_bbl (bin);

CREATE TEMPORARY TABLE x_pluto_latest_w_units AS (
  -- Sometimes a CofO might match to two PLUTO records with the original and
  -- PAD updated BBL the the PLUTO data is for a non-residential building
  -- which is incorrect, so we only want to keep residential PLUTO records
	SELECT *
	FROM pluto_latest
	WHERE unitsres > 0
);
CREATE INDEX ON x_pluto_latest_w_units (bbl);

CREATE TEMPORARY TABLE x_all_cofos AS (
	-- Join the CofOs to PAD using BIN to get BBL, which sometimes differs from
	-- the BBL in the CofO data itself. Then join with pluto using each of the
	-- versions of BBL (CofO and PAD). Then we create our final bbl column
	-- prioritizing the CofO bbl if it matches pluto, then the PAD bbl if it
	-- matches pluto, then the original CofO bbl.
	SELECT
		c.bin,
		COALESCE(pluto_dob.bbl, pluto_pad.bbl, c.bbl) AS bbl,
		c.issue_date,
		jobtype
	FROM x_all_cofos_orig AS c
	LEFT JOIN x_pad_bin_bbl AS p USING(bin)
	LEFT JOIN x_pluto_latest_w_units AS pluto_dob ON c.bbl = pluto_dob.bbl
	LEFT JOIN x_pluto_latest_w_units AS pluto_pad ON p.bbl = pluto_pad.bbl
);

CREATE INDEX ON x_all_cofos (bbl, issue_date);

CREATE TEMPORARY TABLE x_latest_cofos AS (
  SELECT DISTINCT ON (bbl)
	bbl,
	bin AS co_bin,
	issue_date AS co_issued,
	jobtype AS co_type
  FROM x_all_cofos
  WHERE issue_date IS NOT NULL
  ORDER BY bbl, issue_date desc
);

CREATE INDEX ON x_latest_cofos (bbl);


--- Who-Owns-What Portfolios
--- ------------------------

-- For each BBL, get the WOW portfolio_id (these are regenerated each month when
-- HPD registrations are updated)

CREATE TEMPORARY TABLE x_portfolio_bbls AS (
    SELECT 
        unnest(bbls) AS bbl, 
        row_number() OVER (ORDER BY bbls) AS portfolio_id
    FROM wow_portfolios
);

CREATE INDEX ON x_portfolio_bbls (bbl);

-- For each portfolio, get the number of properties and total number of
-- residential units

CREATE TEMPORARY TABLE x_portfolio_size AS (
    SELECT
        portfolio_id,
        sum(unitsres)::numeric AS wow_portfolio_units,
        count(*)::numeric AS wow_portfolio_bbls
    FROM x_portfolio_bbls AS w
    LEFT JOIN pluto_latest AS p USING(bbl)
    GROUP BY portfolio_id
);

CREATE INDEX ON x_portfolio_size (portfolio_id);


--- Subsidized Housing
--- ------------------

-- Combine all sources of data on subsidy status of properties

CREATE TEMPORARY TABLE x_subsidized AS (
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
    )
    SELECT
        bbl,

        (nycha.bbl IS NOT NULL OR coalesce(shd.datanycha, false)) AS is_nycha,

        (   shd.datahpd 
            OR shd.datahcrlihtc 
            OR shd.datahudlihtc 
            OR shd.datahudcon 
            OR shd.datahudfin 
            OR shd.dataml
            OR shd.datanycha
            OR nycha.bbl IS NOT NULL
            OR article_xi.bbl IS NOT NULL
        ) AS is_subsidized,

        shd.end421a AS end_421a,
        shd.endj51 AS end_j51,
        (shd.end421a > CURRENT_DATE) AS active_421a,
        (shd.endj51 > CURRENT_DATE) AS active_j51,

        CASE 
            WHEN (shd.datahudcon OR shd.datahudfin) THEN 'HUD Project-Based'
            WHEN (shd.datahudlihtc OR shd.datahcrlihtc) THEN 'Low-Income Housing Tax Credit (LIHTC)'
            WHEN shd.dataml THEN 'Mitchell-Lama'
            WHEN shd.datahpd THEN 'HPD Program'
            WHEN (article_xi.bbl IS NOT NULL) THEN 'Article XI'
            WHEN (nycha.bbl IS NOT NULL OR shd.datanycha) THEN 'NYCHA'
            ELSE NULL
        END AS subsidy_name

    FROM fc_shd_building AS shd
    FULL JOIN article_xi_bbls AS article_xi USING(bbl)
    FULL JOIN nycha_bbls AS nycha USING(bbl)
);

CREATE INDEX ON x_subsidized (bbl);