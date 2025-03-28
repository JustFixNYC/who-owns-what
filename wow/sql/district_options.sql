-- This isn't used in the code yet, but this is how we have temporarily created
-- the json file with all the options for the district selection dropdowns. The
-- output is currently saved as a static json file, but we may want to convert
-- this into an API later, or otherwise document the code and process for
-- updating this manually way.

WITH grouped_options AS (
	SELECT
		geom_type,
		json_agg(json_build_object('label', COALESCE(geom_name, geom_id), 'value', geom_id)) AS options
	FROM pluto_latest_geom
	WHERE geom_type != 'census_tract'
	GROUP BY geom_type
)
SELECT
	json_object_agg(geom_type, options)
FROM grouped_options;