
WITH last_updated AS (
	SELECT 
		(VALUE::date - interval '1' DAY) AS last_updated
	FROM dataset_tracker
	WHERE KEY = 'acris'
)
SELECT 
	bbl,
	housenumber,
	streetname,
	boro,
	lastsaleacrisid,
	lastsaleamount,
	lastsaledate,
	count(*) over () as total_sales,
	d.last_updated
FROM last_updated AS d,
	wow_indicators
WHERE bbl IS NOT NULL
	and (
		coun_dist = ANY(%(coun_dist)s)
		or nta = ANY(%(nta)s)
		or borough = ANY(%(borough)s)
		or census_tract = ANY(%(census_tract)s)
		or community_dist = ANY(%(community_dist)s::int[])
		or assem_dist = ANY(%(assem_dist)s)
		or stsen_dist = ANY(%(stsen_dist)s)
		or zipcode = ANY(%(zipcode)s)
	)
	and lastsaledate > (d.last_updated - interval '30' day)
	and lastsaleamount >= 10000
ORDER BY lastsaledate DESC
LIMIT 10;
