WITH bbl_link AS (
  SELECT
    %(bbl)s AS BBL,
    concat(
      'https://hpdonline.nyc.gov/hpdonline/building/search-results', 
      '?boroId=', substr(%(bbl)s, 1, 1),
      '&block=', substr(%(bbl)s, 2, 5), 
      '&lot=', substr(%(bbl)s, 7, 4)
    ) AS bbl_link
),
hpd_link AS (
  SELECT DISTINCT
    BBL,
    CASE 
      WHEN hpdbuildingid is not null AND hpdbuildings = 1
        THEN concat('https://hpdonline.nyc.gov/hpdonline/building/', hpdbuildingid)
      ELSE
          concat(
            'https://hpdonline.nyc.gov/hpdonline/building/search-results', 
            '?boroId=', substr(bbl, 1, 1),
            '&block=', substr(bbl, 2, 5), 
            '&lot=', substr(bbl, 7, 4)
          )
      END AS HPD_LINK
  FROM WOW_BLDGS
  WHERE BBL = %(bbl)s
)
SELECT
  BBL,
  COALESCE(hpd_link, bbl_link) AS hpd_link
FROM bbl_link
LEFT JOIN hpd_link USING(bbl)
