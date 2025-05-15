SELECT 
	bbl,
	x.housenumber,
	x.streetname,
	x.boro,
	x.lastsaleacrisid,
	x.lastsaleamount,
	x.lastsaledate,
	count(*) over () as total_sales
FROM wow_bldgs 
LEFT JOIN pluto_latest_districts AS pld USING(bbl)
LEFT JOIN wow_indicators as x using(bbl)
WHERE bbl IS NOT NULL
	and (pld.coun_dist = ANY(%(coun_dist)s)
	or pld.nta2020 = ANY(%(nta)s)
	or pld.borough = ANY(%(borough)s)
    OR pld.community_dist = ANY(%(community_dist)s::int[])
	or pld.cong_dist = ANY(%(cong_dist)s)
	or pld.assem_dist = ANY(%(assem_dist)s)
	or pld.stsen_dist = ANY(%(stsen_dist)s)
	or pld.zipcode = ANY(%(zipcode)s))
	and x.lastsaledate > (CURRENT_DATE - interval '7' day) 
	and x.lastsaleamount >= 10000
ORDER BY x.lastsaledate DESC
LIMIT 10;
	

	