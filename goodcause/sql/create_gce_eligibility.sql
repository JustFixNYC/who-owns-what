CREATE TABLE gce_eligibility AS (
  WITH all_cofos AS (
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
  ),
  latest_cofos AS (
      SELECT DISTINCT ON (bbl)
          bbl,
          bin AS co_bin,
          issue_date AS co_issued,
          job_type AS co_type
      FROM all_cofos
      WHERE job_type IN ('NB', 'A1') AND issue_date IS NOT NULL
      ORDER BY bbl, issue_date desc
  ),
  portolfio_bbls as (
    SELECT 
      unnest(bbls) AS bbl, 
      row_number() OVER (ORDER BY bbls) AS portfolio_id
    FROM wow_portfolios
  ),

  portfolio_size AS (
    SELECT
      portfolio_id,
      sum(unitsres)::numeric AS wow_portfolio_units,
      count(*)::numeric AS wow_portfolio_bbls
    FROM portolfio_bbls
    LEFT JOIN pluto_latest USING(bbl)
    GROUP BY portfolio_id
  ),

  nycha_bbls AS (
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

      wp.wow_portfolio_units,
      wp.wow_portfolio_bbls

  FROM pluto_latest AS p
  LEFT JOIN rentstab_v2 AS r ON p.bbl = r.ucbbl
  LEFT JOIN nycha_bbls AS nycha USING(bbl)
  LEFT JOIN article_xi_bbls AS article_xi USING(bbl)
  LEFT JOIN subsidized AS shd USING(bbl)
  LEFT JOIN latest_cofos AS co USING(bbl)
  LEFT JOIN portolfio_bbls as wb USING(bbl)
  LEFT JOIN portfolio_size AS wp USING(portfolio_id)
);

CREATE INDEX ON gce_eligibility (bbl);
