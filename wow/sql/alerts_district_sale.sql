SELECT 
	bbl,
	housenumber,
	streetname,
	boro,
	lastsaleacrisid,
	lastsaleamount,
	lastsaledate,
	count(*) over () as total_sales
FROM wow_indicators
WHERE bbl IS NOT NULL
	and (coun_dist = ANY(%(coun_dist)s)
		or nta = ANY(%(nta)s)
		or borough = ANY(%(borough)s)
		OR community_dist = ANY(%(community_dist)s::int[])
		or cong_dist = ANY(%(cong_dist)s)
		or assem_dist = ANY(%(assem_dist)s)
		or stsen_dist = ANY(%(stsen_dist)s)
		or zipcode = ANY(%(zipcode)s))
	and lastsaledate > (CURRENT_DATE - interval '7' day)
	and lastsaleamount >= 10000
ORDER BY lastsaledate DESC
LIMIT 10;

	