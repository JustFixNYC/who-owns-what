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
		sum(hpdviolations_class_a)::float AS hpdviolations_class_a,
		sum(hpdviolations_class_b)::float AS hpdviolations_class_b,
		sum(hpdviolations_class_c)::float AS hpdviolations_class_c,
		sum(hpdviolations_class_i)::float AS hpdviolations_class_i,
		sum(hpdviolations_total)::float AS hpdviolations_total,
		sum(hpdcomplaints_emergency)::float AS hpdcomplaints_emergency,
		sum(hpdcomplaints_nonemergency)::float AS hpdcomplaints_nonemergency,
		sum(hpdcomplaints_total)::float AS hpdcomplaints_total,
		sum(dobviolations_regular)::float AS dobviolations_regular,
		sum(dobviolations_ecb)::float AS dobviolations_ecb,
		sum(dobviolations_total)::float AS dobviolations_total,
    	sum(evictions_filed)::float AS evictions_filed,
    	sum(evictions_executed)::float AS evictions_executed,
        sum(rentstab_units)::float AS rentstab_units,
        sum(dobpermits_jobs)::float AS dobpermits_jobs,
        sum(hpderp_charges)::float AS hpderp_charges
	FROM stacked_data
	GROUP BY collection_name, collection_slug, collection_type, month
	ORDER BY collection_name, collection_slug, collection_type, month
);

CREATE INDEX ON signature_collection_charts (collection_slug);
