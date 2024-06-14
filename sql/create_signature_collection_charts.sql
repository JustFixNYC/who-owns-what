DROP TABLE IF EXISTS signature_collection_charts CASCADE;
CREATE TABLE IF NOT EXISTS signature_collection_charts AS (
	WITH stacked_data AS (
		SELECT
			s.landlord AS collection_name,
			s.landlord_slug AS collection_slug,
			'landlord' AS collection_type,
			c.*
		FROM signature_buildings AS s
		LEFT JOIN signature_building_charts AS c USING(bbl)
		UNION
		SELECT
			s.lender AS collection_name,
			s.lender_slug AS collection_slug,
			'lender' AS collection_type,
			c.*
		FROM signature_buildings AS s
		LEFT JOIN signature_building_charts AS c USING(bbl)
		UNION
		select
			'all' AS collection_name,
			'all' AS collection_slug,
			'all' AS collection_type,
			c.*
		FROM signature_buildings AS s
		LEFT JOIN signature_building_charts AS c USING(bbl)
	)
	SELECT
		collection_name,
		collection_slug,
		collection_type,
		month,
		sum(hpdviolations_class_a) AS hpdviolations_class_a,
		sum(hpdviolations_class_b) AS hpdviolations_class_b,
		sum(hpdviolations_class_c) AS hpdviolations_class_c,
		sum(hpdviolations_class_i) AS hpdviolations_class_i,
		sum(hpdviolations_total) AS hpdviolations_total,
		sum(hpdcomplaints_emergency) AS hpdcomplaints_emergency,
		sum(hpdcomplaints_nonemergency) AS hpdcomplaints_nonemergency,
		sum(hpdcomplaints_total) AS hpdcomplaints_total,
		sum(dobviolations_regular) AS dobviolations_regular,
		sum(dobviolations_ecb) AS dobviolations_ecb,
		sum(dobviolations_total) AS dobviolations_total
	FROM stacked_data
	GROUP BY collection_name, collection_slug, collection_type, month
	ORDER BY collection_name, collection_slug, collection_type, month
);

CREATE INDEX ON signature_collection_charts (collection_slug);
