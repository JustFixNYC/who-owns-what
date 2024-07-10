DROP TABLE IF EXISTS signature_pluto_geos;
CREATE TEMP TABLE IF NOT EXISTS signature_pluto_geos AS (
	SELECT
		bbl,
		s.landlord,
		trim(BOTH '-' FROM regexp_replace(lower(trim(s.landlord)), '[^a-z0-9_-]+', '-', 'gi')) AS landlord_slug,
		s.lender,
		trim(BOTH '-' FROM regexp_replace(lower(trim(s.lender)), '[^a-z0-9_-]+', '-', 'gi')) AS lender_slug,
		-- having issues with the csv nulls, so all imported as strings
		nullif(s.bip, '')::integer AS bip,
		nullif(s.water_charges, '')::float AS water_charges,
		nullif(s.origination_date, '')::date AS origination_date,
		nullif(s.debt_total, '')::float AS debt_total,
		-- temporarily adding these here, later they'll be included in the data from UNHP
		'active' AS loan_status,
		NULL AS loan_action,
		p.borocode,
		p.block,
		p.lot,
		p.address,
		p.zipcode,
		p.borough,
		p.council,
		p.latitude,
		p.longitude,
		p.unitsres,
		p.unitstotal,
		p.yearbuilt,
		ST_TRANSFORM(ST_SetSRID(ST_MakePoint(longitude, latitude),4326), 2263) AS geom_point
	FROM signature_unhp_data AS s
	LEFT JOIN pluto_latest AS p USING(bbl)
);

CREATE INDEX ON signature_pluto_geos using gist (geom_point);

DROP TABLE IF EXISTS signature_pluto_poli;
CREATE TEMP TABLE IF NOT EXISTS signature_pluto_poli AS (
	SELECT
		p.*,
		council::text AS coun_dist,
		ad.assemdist::text AS assem_dist,
		ss.stsendist::text AS stsen_dist,
		cg.congdist::text AS cong_dist
	FROM signature_pluto_geos AS p
	LEFT JOIN nyad AS ad ON ST_Within(p.geom_point, ad.geom)
	LEFT JOIN nyss AS ss ON ST_Within(p.geom_point, ss.geom)
	LEFT JOIN nycg AS cg ON ST_Within(p.geom_point, cg.geom)
);

CREATE INDEX ON signature_pluto_poli (bbl);

DROP TABLE IF EXISTS signature_buildings CASCADE;
CREATE TABLE IF NOT EXISTS signature_buildings AS (
	WITH evic_marshal AS (
	    SELECT
	        bbl,
	        count(*) AS evictions_executed
	    FROM marshal_evictions_all
	    WHERE residentialcommercialind = 'RESIDENTIAL'
	    GROUP BY bbl
	), 

	evic_oca AS (
		SELECT
			a.bbl,
			count(distinct indexnumberid) AS evictions_filed
		FROM oca_index AS i
		LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
		WHERE i.fileddate >= (CURRENT_DATE - interval '1' year)
			AND i.classification = any('{Holdover,Non-Payment}') 
			AND i.propertytype = 'Residential'
			AND nullif(a.bbl, '') IS NOT NULL
		GROUP BY a.bbl
	),

	hp_cases AS (
		SELECT
			bbl,
			count(*) AS hp_total,
			count(*) FILTER (WHERE openjudgement = 'YES') AS hp_open_judgements,
			coalesce(sum(penalty::float) FILTER (WHERE openjudgement = 'YES'), 0) AS hp_penalies,
			count(*) FILTER (WHERE findingofharassment IN ('After Trial', 'After Inquest')) AS hp_find_harassment,
			count(*) FILTER (WHERE casestatus IN ('APPLICATION PENDING', 'PENDING')) AS hp_active
		FROM hpd_litigations
		GROUP BY bbl
	),

	rs_units AS (
		SELECT
			ucbbl AS bbl,
			coalesce(nullif(uc2022, 0), nullif(uc2021, 0), nullif(uc2020, 0), nullif(uc2019, 0), 0) as rs_units
		FROM rentstab_v2
	),
	
	hpd_erp_charges_all AS (
		SELECT 
			c.bbl, 
			c.omocreatedate AS order_date,
			sum(i.chargeamount) AS charge_amount
		FROM hpd_omo_charges AS c
		LEFT JOIN hpd_omo_invoices AS i USING(omonumber)
		GROUP BY bbl, omonumber, c.omocreatedate
		UNION
		SELECT 
			bbl, 
			hwocreatedate AS order_date, 
			chargeamount AS charge_amount
		FROM hpd_hwo_charges
	), 
	
	hpd_erp AS (
		SELECT
			bbl,
			count(*) AS hpd_erp_orders,
			sum(charge_amount)::float AS hpd_erp_charges
		FROM hpd_erp_charges_all
		WHERE order_date >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl
	), 
	
	hpd_viol_open AS (
	    SELECT 
	    	bbl,
	        count(*) AS hpd_viol_bc_open
	    FROM hpd_violations
	    WHERE class = any('{B,C}') 
			AND violationstatus = 'Open' 
			AND novissueddate >= (CURRENT_DATE - interval '5' year)
	    GROUP BY bbl
	), 

	hpd_viol_total AS (
	    SELECT 
	    	bbl,
	        count(*) FILTER (WHERE class = any('{B,C}')) AS hpd_viol_bc_total,
			-- https://regex101.com/r/73lWqr/1
			-- https://www.nyc.gov/assets/buildings/pdf/HousingMaintenanceCode.pdf#page=29
			count(*) FILTER (WHERE novdescription ~* '27-[\d\s,]*?20(?:(?:2[8-9])|(?:3[0-3]))') AS hpd_viol_heat,
			-- Sections used are too broad to use, not perfect but better than nothing
			count(*) FILTER (WHERE novdescription ~* '(leak)|(mold)' AND novdescription !~* 'gas') AS hpd_viol_water,
			-- https://www.nyc.gov/assets/buildings/pdf/HousingMaintenanceCode.pdf#page=18
			count(*) FILTER (WHERE novdescription ~* '27-[\d\s,]*?201[7-9]') AS hpd_viol_pests
	    FROM hpd_violations
	    WHERE novissueddate >= (CURRENT_DATE - interval '1' year)
	    GROUP BY bbl
	), 
	
	hpd_comp AS (
		SELECT 
			bbl,
			COUNT(*) FILTER (WHERE TYPE = ANY('{IMMEDIATE EMERGENCY,HAZARDOUS,EMERGENCY}')) AS hpd_comp_emerg_total,
			array_agg(DISTINCT apartment) FILTER (WHERE apartment NOT IN ('BLDG', 'NA')) AS hpd_comp_apts,
			COUNT(*) FILTER (
				WHERE majorcategory = ANY('{HEAT/HOT WATER,HEATING}') OR minorcategory = ANY('{HEAT/HOT WATER,HEATING}')
			) as hpd_comp_heat,
			COUNT(*) FILTER (
				WHERE majorcategory = ANY('{MOLD,WATER LEAK}') OR minorcategory = ANY('{MOLD,WATER LEAK}')
			) as hpd_comp_water,
			COUNT(*) FILTER (
				WHERE majorcategory = 'PESTS' OR minorcategory = 'PESTS'
			) as hpd_comp_pests
		FROM HPD_COMPLAINTS_AND_PROBLEMS
		WHERE RECEIVEDDATE >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl
	), 

	hpd_vacate AS (
		SELECT DISTINCT ON (bbl)
			bbl,
			concat(initcap(vacatetype), ' (', to_char(vacateeffectivedate, 'Mon d, YYYY'), ")") AS hpd_active_vacate
		FROM hpd_vacateorders
		WHERE vacateeffectivedate <= CURRENT_DATE
			AND rescinddate IS NULL
			AND coalesce(bbl, '') != ''
		-- keep 'entire building' orders over 'partial' ones if both
		ORDER BY bbl, vacatetype, vacateeffectivedate DESC
	),
	
	aep AS (
		SELECT DISTINCT
			bbl,
			true as in_aep
		FROM hpd_aep
		WHERE currentstatus = 'AEP Active'
	), 
	
	conh AS (
		-- TODO: this is only the pilot program, need to also include SROs and special districts
		SELECT DISTINCT
			bbl,
			true as in_conh
		FROM hpd_conh
	), 
	
	ucp AS (
		SELECT DISTINCT
			bbl,
			true as in_ucp
		FROM hpd_underlying_conditions
		WHERE currentstatus = 'Active'
	), 
	
	hpd_reg AS (
		SELECT 
			bbl,
			CASE WHEN count(*) = 1 THEN max(buildingid) ELSE NULL END AS buildingid
		FROM hpd_registrations
		GROUP BY bbl
	), 
	
	acris_deed AS (
		SELECT DISTINCT ON (bbl)
			l.bbl,
			coalesce(m.docdate, m.recordedfiled) AS last_sale_date
		FROM real_property_master AS m
		LEFT JOIN real_property_legals AS l USING(documentid)
		WHERE docamount > 1 AND doctype = any('{DEED,DEEDO}')
		ORDER BY bbl, docdate DESC
	), 
	
	rodents AS (
		SELECT DISTINCT ON (bbl)
			bbl,
			coalesce(approveddate, inspectiondate)::date AS last_rodent_date,
			CASE WHEN 
				result IN ('Rat Activity', 'Failed for Other R') THEN 'Failed'
				ELSE 'Passed'
			END AS last_rodent_result
		FROM dohmh_rodent_inspections
		WHERE inspectiontype IN ('Initial', 'Compliance') 
			AND result IS NOT NULL
			AND coalesce(approveddate, inspectiondate) IS NOT NULL
		ORDER BY bbl, coalesce(approveddate, inspectiondate) DESC
	),

	dob_jobs_all AS (
		SELECT 
			bbl,
			count(DISTINCT jobfilingnumber) AS dob_jobs
		FROM dob_now_jobs
		WHERE filingdate >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl
		UNION 
		SELECT 
			bbl,
			count(DISTINCT job) AS dob_jobs
		FROM dobjobs
		WHERE prefilingdate >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl
	),

	dob_jobs AS (
		SELECT
			bbl,
			sum(dob_jobs)::int as dob_jobs
		FROM dob_jobs_all
		GROUP BY bbl
	),

	dob_ecb_stacked as (
		SELECT
			bbl,
			issuedate,
			(violationcategory ~* 'ACTIVE') AS is_active
		FROM dob_violations 
		WHERE issuedate >= (CURRENT_DATE - interval '5' year)
			AND violationtypecode IS NOT NULL
		UNION
		SELECT
			bbl,
			issuedate,
			(certificationstatus IS NULL 
			OR certificationstatus in ('REINSPECTION SHOWS STILL IN VIOLATION', 
					'CERTIFICATE PENDING', 'CERTIFICATE DISAPPROVED', 'NO COMPLIANCE RECORDED')
			) AS is_active
		FROM ecb_violations 
		WHERE issuedate >= (CURRENT_DATE - interval '5' year)
			AND severity IS NOT NULL
	),

	dob_ecb_viol AS (
		SELECT
			bbl,
			count(*) FILTER (WHERE issuedate >= (CURRENT_DATE - interval '1' year)) AS dob_ecb_viol_total,
			count(*) FILTER (WHERE is_active) AS dob_ecb_viol_open
		FROM dob_ecb_stacked
		GROUP BY bbl
	)

	SELECT
		-- LOCATION
		sp.bbl,
		sp.address,
		sp.zipcode AS zip,
		CASE 
			WHEN sp.borough = 'MN' THEN 'Manhattan'
			WHEN sp.borough = 'BX' THEN 'Bronx'
			WHEN sp.borough = 'BK' THEN 'Brooklyn'
			WHEN sp.borough = 'QN' THEN 'Queens'
			WHEN sp.borough = 'SI' THEN 'Staten Island'
		END AS borough,
		sp.latitude AS lat,
		sp.longitude AS lng,
		
		-- POLITICAL DISTRICTS
		sp.coun_dist,
		sp.assem_dist,
		sp.stsen_dist,
		sp.cong_dist,
		
		-- BUILDING CHARACTERISTICS
		sp.unitsres AS units_res,
		(sp.unitstotal - sp.unitsres > 0) AS units_nonres,
		sp.yearbuilt AS year_built,
		coalesce(rs_units.rs_units, 0) AS rs_units,

		-- EXTERNAL LINKS
		CASE 
			WHEN hpd_reg.buildingid IS NOT NULL 
				THEN concat('https://hpdonline.nyc.gov/hpdonline/building/', hpd_reg.buildingid)
			ELSE
				concat(
				'https://hpdonline.nyc.gov/hpdonline/building/search-results', 
				'?boroId=', sp.borocode,
				'&block=', sp.block, 
				'&lot=', sp.lot
				)
		END AS link_hpd,
		concat(
			'http://a836-acris.nyc.gov/bblsearch/bblsearch.asp', 
			'?borough=', sp.borocode,
			'&block=', sp.block, 
			'&lot=', sp.lot
		) AS link_acris,
		concat(
			'http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet', 
			'?boro=', sp.borocode,
			'&block=', sp.block, 
			'&lot=', sp.lot
		) AS link_dob,
		concat('https://portal.displacementalert.org/property/', sp.bbl) AS link_dap,
		concat('https://whoownswhat.justfix.org/bbl/', sp.bbl) AS link_wow,
		concat('https://www.mygovnyc.org/?lnglat=', sp.longitude, '%2C', sp.latitude) AS link_political,

		-- HPD PROGRAMS
		coalesce(aep.in_aep, false) AS in_aep,
		coalesce(conh.in_conh, false) AS in_conh,
		coalesce(ucp.in_ucp, false) AS in_ucp,
	
		-- EVICTIONS
	    coalesce(evic_marshal.evictions_executed, 0) AS evictions_executed,
		CASE 
			WHEN sp.unitsres > 10 THEN coalesce(evic_oca.evictions_filed, 0)
			ELSE NULL
		END AS evictions_filed,

		-- HP CASES
		coalesce(hp_cases.hp_total, 0) AS hp_total,
		coalesce(hp_cases.hp_open_judgements, 0) AS hp_open_judgements,
		coalesce(hp_cases.hp_penalies, 0) AS hp_penalies,
		coalesce(hp_cases.hp_find_harassment, 0) AS hp_find_harassment,
		coalesce(hp_cases.hp_active, 0) AS hp_active,

		-- HPD EMERGENCY REPAIR PROGRAM
		coalesce(hpd_erp.hpd_erp_orders, 0) AS hpd_erp_orders,
		coalesce(hpd_erp.hpd_erp_orders, 0)::float / nullif(sp.unitsres, 0)::float AS hpd_erp_orders_per_unit,
		coalesce(hpd_erp.hpd_erp_charges, 0) AS hpd_erp_charges,
		coalesce(hpd_erp.hpd_erp_charges, 0)::float / nullif(sp.unitsres, 0)::float AS hpd_erp_charges_per_unit,
	    
		-- HPD VIOLATIONS
	    coalesce(hpd_viol_open.hpd_viol_bc_open, 0) AS hpd_viol_bc_open,
	    coalesce(hpd_viol_open.hpd_viol_bc_open, 0)::float / nullif(sp.unitsres, 0)::float AS hpd_viol_bc_open_per_unit,
	    coalesce(hpd_viol_total.hpd_viol_bc_total, 0) AS hpd_viol_bc_total,
	    coalesce(hpd_viol_total.hpd_viol_heat, 0) AS hpd_viol_heat,
	    coalesce(hpd_viol_total.hpd_viol_water, 0) AS hpd_viol_water,
	    coalesce(hpd_viol_total.hpd_viol_pests, 0) AS hpd_viol_pests,
	    
		-- HPD COMPLAINTS
	    coalesce(hpd_comp.hpd_comp_emerg_total, 0) AS hpd_comp_emerg_total,
		coalesce(hpd_comp.hpd_comp_emerg_total, 0)::float / nullif(sp.unitsres, 0)::float AS hpd_comp_emerg_total_per_unit,
	    round(coalesce(array_length(hpd_comp.hpd_comp_apts, 1), 0)::float / nullif(sp.unitsres, 0)::float * 100) AS hpd_comp_apts_pct,
	    array_to_string(hpd_comp.hpd_comp_apts, ', ') AS hpd_comp_apts,
		coalesce(hpd_comp_heat, 0) AS hpd_comp_heat,
		coalesce(hpd_comp_water, 0) AS hpd_comp_water,
		coalesce(hpd_comp_pests, 0) AS hpd_comp_pests,

		-- HPD ACTIVE VACATE ORDERS
		hpd_vacate.hpd_active_vacate,

		-- DOHMH RODENTS
		rodents.last_rodent_date,
		rodents.last_rodent_result,

		-- DOB Jobs/Permits
		coalesce(dob_jobs.dob_jobs, 0) AS dob_jobs,

		-- DOB/ECB Violations
		coalesce(dob_ecb_viol.dob_ecb_viol_total, 0) AS dob_ecb_viol_total,
		coalesce(dob_ecb_viol.dob_ecb_viol_open, 0) AS dob_ecb_viol_open,

		-- DEP Water Charges
		sp.water_charges,

		-- BIP Score (UNHP)
		sp.bip,
		
		-- LANDLORD/LENDER
		sp.landlord,
		sp.landlord_slug,
		sp.lender,
		sp.lender_slug,

		-- LOAN
		loan_status,
 		loan_action,
		
		-- FINANCIAL
		acris_deed.last_sale_date,
		sp.origination_date,
		sp.debt_total,
		sp.debt_total / nullif(sp.unitsres, 0)::float AS debt_per_unit

	FROM signature_pluto_poli AS sp
	LEFT JOIN evic_marshal USING(bbl)
	LEFT JOIN evic_oca USING(bbl)
	LEFT JOIN hp_cases USING(bbl)
	LEFT JOIN rs_units USING(bbl)
	LEFT JOIN hpd_erp USING(bbl)
	LEFT JOIN hpd_viol_open USING(bbl)
	LEFT JOIN hpd_viol_total USING(bbl)
	LEFT JOIN hpd_comp USING(bbl)
	LEFT JOIN hpd_vacate USING(bbl)
	LEFT JOIN aep USING(bbl)
	LEFT JOIN conh USING(bbl)
	LEFT JOIN ucp USING(bbl)
	LEFT JOIN hpd_reg USING(bbl)
	LEFT JOIN acris_deed USING(bbl)
	LEFT JOIN rodents USING(bbl)
	LEFT JOIN dob_jobs USING(bbl)
	LEFT JOIN dob_ecb_viol USING(bbl)
	WHERE bbl IS NOT NULL
);

CREATE INDEX ON signature_buildings (bbl);
CREATE INDEX ON signature_buildings (landlord);
CREATE INDEX ON signature_buildings (lender);
