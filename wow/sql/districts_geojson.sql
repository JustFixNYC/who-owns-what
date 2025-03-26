-- This is just a quick test and the results have been saved as static files,
-- but eventually if we move ahead with the map we can pre-build a table with
-- each type of districts as a row with all the geojson and add an api to get
-- the geojson data for a district type. I think we can essentially just add a
-- group by to this existing set up. This will actually help to ensure the
-- feature id values are unique across all district types, since we'll be
-- copying features out to a separate source with user selections. 

WITH geos AS (
	SELECT
		row_number() OVER () AS id,
		geom_id AS geoid,
		geom_name AS NAME,
		ST_Transform(ST_simplify(geom, 100), 4326) AS geom
	FROM pluto_latest_geom
	WHERE geom_type = 'coun_dist'
), features AS (
	SELECT jsonb_build_object(
    'type',       'Feature',
    'id',         id,
    'geometry',   ST_AsGeoJSON(geom)::jsonb,
    'properties', to_jsonb(geos) - 'id' - 'geom'
  ) AS feature
 FROM geos
)
SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', jsonb_agg(features.feature)
)
FROM features;