SELECT 
	lender_slug AS collection_slug,
	count(*) AS landlords,
	sum(buildings) AS buildings
FROM signature.signature_collections
WHERE collection_type = 'landlord'
GROUP BY lender_slug
UNION
SELECT
	'all' AS collection_slug,
	count(*) AS landlords,
	sum(buildings) AS buildings
FROM signature.signature_collections
WHERE collection_type = 'landlord'
