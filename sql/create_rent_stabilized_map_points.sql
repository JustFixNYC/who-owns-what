DROP TABLE IF EXISTS rent_stabilized_map_points;

CREATE TABLE rent_stabilized_map_points AS
SELECT
    p.bbl,
    p.address,
    CASE p.borough
        WHEN 'MN' THEN 'Manhattan'
        WHEN 'BX' THEN 'Bronx'
        WHEN 'BK' THEN 'Brooklyn'
        WHEN 'QN' THEN 'Queens'
        WHEN 'SI' THEN 'Staten Island'
        ELSE p.borough
    END AS borough,
    TRIM(p.postcode::text) AS zip,
    p.latitude AS lat,
    p.longitude AS lng,
    p.unitsres::int AS units_res,
    coalesce(
        nullif(r.uc2024, 0), nullif(r.uc2023, 0), nullif(r.uc2022, 0),
        nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0
    )::int AS rs_units
FROM pluto_latest AS p
LEFT JOIN rentstab_v2 AS r ON p.bbl = r.ucbbl
WHERE p.unitsres > 0
  AND p.latitude IS NOT NULL
  AND p.longitude IS NOT NULL
  AND p.address IS NOT NULL
  AND coalesce(
        nullif(r.uc2024, 0), nullif(r.uc2023, 0), nullif(r.uc2022, 0),
        nullif(r.uc2021, 0), nullif(r.uc2020, 0), nullif(r.uc2019, 0), 0
      ) > 0;

CREATE INDEX ON rent_stabilized_map_points (bbl);
CREATE INDEX ON rent_stabilized_map_points (borough);
