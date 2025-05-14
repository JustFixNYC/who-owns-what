SELECT 
	bbl,
	x.housenumber,
	x.streetname,
	x.boro,
	l.caseopendate,
	l.casetype,
	l.respondent,
	count(*) over () as total_litigations
FROM wow_bldgs as x
LEFT JOIN pluto_latest_districts AS pld USING(bbl)
LEFT JOIN hpd_litigations as l using(bbl)
WHERE bbl IS NOT NULL
	and (pld.coun_dist = ANY(%(coun_dist)s)
	or pld.nta = ANY(%(nta)s)
	or pld.borough = ANY(%(borough)s)
    OR pld.community_dist = ANY(%(community_dist)s::int[])
	or pld.cong_dist = ANY(%(cong_dist)s)
	or pld.assem_dist = ANY(%(assem_dist)s)
	or pld.stsen_dist = ANY(%(stsen_dist)s)
	or pld.zipcode = ANY(%(zipcode)s))
	and l.casetype IN ('Tenant Action', 'Heat and Hot Water', '7A')
	and l.caseopendate > (CURRENT_DATE - interval '30' day) -- TODO FIX DATE LOGIC 
	and l.caseopendate < CURRENT_DATE
ORDER BY l.caseopendate DESC
LIMIT 10;