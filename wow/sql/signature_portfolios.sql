WITH buildings AS (
	SELECT
		loan_pool_slug as collection_slug,
		sum(buildings_agg) AS buildings_agg
	FROM signature.signature_collections
	WHERE collection_type = 'loan_pool'
	GROUP BY loan_pool_slug
	UNION
	SELECT
		'all' AS collection_slug,
		buildings_agg
	FROM signature.signature_collections
	WHERE collection_type = 'all'
), 
landlords AS (
	SELECT 
		loan_pool_slug AS collection_slug,
		count(distinct collection_name) AS landlords
	FROM signature.signature_collections
	WHERE collection_type = 'landlord'
	GROUP BY loan_pool_slug
	UNION
	SELECT
		'all' AS collection_slug,
		count(distinct collection_name) AS landlords
	FROM signature.signature_collections
	WHERE collection_type = 'landlord'
)
SELECT 
	collection_slug,
	landlords,
	buildings_agg
FROM buildings
LEFT JOIN landlords USING(collection_slug)
