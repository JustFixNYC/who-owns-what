SELECT
	"typeValue" as value,
	"typeLabel" as label,
	districts_geojson as "districtsData",
	labels_geojson as "labelsData"
FROM wow_districts_geojson
WHERE "typeValue" = %(district_type)s
