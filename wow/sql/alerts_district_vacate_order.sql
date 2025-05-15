
SELECT 
	bbl,
	x.housenumber,
	x.streetname,
	x.boro,
	x.unitsres,
	x.hpd_link,
	x.hpd_vacate_date,
	x.hpd_vacate_type,
	x.hpd_vacate_units_affected,
	x.hpd_vacate_reason,
	x.dob_vacate_date,
	x.dob_vacate_type,
	x.dob_vacate_complaint_number
FROM wow_bldgs 
LEFT JOIN pluto_latest_districts AS pld USING(bbl)
LEFT JOIN wow_indicators as x using(bbl)
WHERE bbl IS NOT NULL
	and (pld.coun_dist = ANY(%(coun_dist)s)
	or pld.nta = ANY(%(nta)s)
	or pld.borough = ANY(%(borough)s)
    OR pld.community_dist = ANY(%(community_dist)s::int[])
	or pld.cong_dist = ANY(%(cong_dist)s)
	or pld.assem_dist = ANY(%(assem_dist)s)
	or pld.stsen_dist = ANY(%(stsen_dist)s)
	or pld.zipcode = ANY(%(zipcode)s))
	and (x.dob_vacate_date is not null
	or x.hpd_vacate_date is not null);
