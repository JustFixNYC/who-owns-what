-- This is just a quick test and the results have been saved as static files,
-- but eventually if we move ahead with the map we can pre-build a table and the
-- API can just pull the row for whatever district type we need. 

-- Note: It's important that this is generated all at once like this so that the
-- feature IDs are unique across all district types, since we'll be copying
-- features out to a separate source with user selections. 

WITH geos AS (
	SELECT
		row_number() OVER () AS id,
		geom_id AS areavalue,
		COALESCE(geom_name, geom_id) AS arealabel,
		geom_type AS typevalue,
		CASE 
			WHEN geom_type = 'borough' THEN 'Borough'
			WHEN geom_type = 'community_board' THEN 'Community District'
			WHEN geom_type = 'cong_dist' THEN 'Congressional District'
			WHEN geom_type = 'coun_dist' THEN 'City Council District'
			WHEN geom_type = 'nta' THEN 'Neighborhood'
			WHEN geom_type = 'assem_dist' THEN 'State Assembly District'
			WHEN geom_type = 'stsen_dist' THEN 'State Senate District'
			WHEN geom_type = 'zipcode' THEN 'Zip Code'
		END AS typelabel,
		ST_Transform(ST_simplify(geom, 100), 4326) AS geom
	FROM pluto_latest_geom
	WHERE geom_type != 'census_tract'
), features AS (
	SELECT 
		typeValue, 
		jsonb_build_object(
			'type',       'Feature',
			'id',         id,
			'geometry',   ST_AsGeoJSON(geom)::jsonb,
			'properties', to_jsonb(geos) - 'id' - 'geom'
		) AS feature
	FROM geos
)
SELECT
	typevalue, 
	jsonb_build_object(
		'type',     'FeatureCollection',
		'features', jsonb_agg(features.feature)
	)
FROM features
GROUP BY typevalue;