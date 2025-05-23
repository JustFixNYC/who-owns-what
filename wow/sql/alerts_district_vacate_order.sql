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
	hpd_link,
	dob_vacate_date,
	dob_vacate_type,
	dob_vacate_complaint_number,
	COALESCE(dob_vacate_date, hpd_vacate_date) AS vacate_date
FROM wow_indicators
WHERE bbl IS NOT NULL
	AND (coun_dist = ANY(%(coun_dist)s)
		OR nta = ANY(%(nta)s)
		OR borough = ANY(%(borough)s)
	    OR community_dist = ANY(%(community_dist)s::int[])
		OR cong_dist = ANY(%(cong_dist)s)
		OR assem_dist = ANY(%(assem_dist)s)
		OR stsen_dist = ANY(%(stsen_dist)s)
		OR zipcode = ANY(%(zipcode)s))
	AND (dob_vacate_date IS NOT NULL
		OR hpd_vacate_date IS NOT NULL)
ORDER BY vacate_date DESC;