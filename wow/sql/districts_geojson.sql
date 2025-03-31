SELECT
	typevalue,
	districts_geojson,
	labels_geojson
FROM wow_districts_geojson
WHERE typevalue = %(district_type)s