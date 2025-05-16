SELECT 
	bbl,
	housenumber,
	streetname,
	boro,
	unitsres,
	hpd_vacate_date,
	hpd_vacate_type,
	hpd_vacate_units_affected,
	hpd_vacate_reason,
	dob_vacate_date,
	dob_vacate_type,
	dob_vacate_complaint_number
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
	and (dob_vacate_date is not null
	or hpd_vacate_date is not null);