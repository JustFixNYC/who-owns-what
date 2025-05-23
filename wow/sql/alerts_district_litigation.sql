
WITH last_updated AS (
	SELECT 
		(VALUE::date - interval '1' DAY) AS last_updated
	FROM dataset_tracker
	WHERE KEY = 'hpd_litigations'
)
SELECT 
	bbl,
	x.housenumber,
	x.streetname,
	x.boro,
	l.caseopendate,
	l.casetype,
	l.respondent,
	count(*) over () as total_litigations,
	d.last_updated
FROM last_updated AS d, 
	wow_indicators AS x
LEFT JOIN hpd_litigations as l using(bbl)
WHERE bbl IS NOT NULL
	and (
		x.coun_dist = ANY(%(coun_dist)s)
		or x.nta = ANY(%(nta)s)
		or x.borough = ANY(%(borough)s)
		or x.census_tract = ANY(%(census_tract)s)
		or x.community_dist = ANY(%(community_dist)s::int[])
		or x.cong_dist = ANY(%(cong_dist)s)
		or x.assem_dist = ANY(%(assem_dist)s)
		or x.stsen_dist = ANY(%(stsen_dist)s)
		or x.zipcode = ANY(%(zipcode)s)
	)
	and l.casetype IN ('Tenant Action', 'Tenant Action/Harrassment', 'Heat and Hot Water')
	and l.caseopendate > (d.last_updated - interval '30' day)
	and l.caseopendate < CURRENT_DATE
ORDER BY l.caseopendate DESC
LIMIT 10;