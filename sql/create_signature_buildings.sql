-- TODO: remove schema prefix from table names
DROP TABLE IF EXISTS signature_pluto_geos;
CREATE TEMP TABLE IF NOT EXISTS signature_pluto_geos AS (
	SELECT
		p.*,
		s.landlord,
		trim(BOTH '-' FROM regexp_replace(lower(trim(s.landlord)), '[^a-z0-9_-]+', '-', 'gi')) AS landlord_slug,
		s.lender,
		trim(BOTH '-' FROM regexp_replace(lower(trim(s.lender)), '[^a-z0-9_-]+', '-', 'gi')) AS lender_slug,
		-- having issues with the csv nulls, so all imported as strings
		nullif(s.origination_date, '')::date AS origination_date,
		nullif(s.debt_building, '')::numeric AS debt_total,
		nullif(s.debt_unit, '')::numeric AS debt_per_unit,
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

DROP TABLE IF EXISTS signature_buildings;
CREATE TABLE if not exists signature_buildings AS (
	WITH evictions AS (
	    SELECT
	        bbl,
	        count(*) AS evictions
	    FROM marshal_evictions_all
	    WHERE residentialcommercialind = 'RESIDENTIAL'
	    GROUP BY bbl
	), hpd_viol AS (
	    SELECT 
	    	bbl,
	        count(*) FILTER (WHERE violationstatus = 'Open' AND inspectiondate >= '2010-01-01') AS hpd_viol_bc_open,
	        count(*) FILTER (WHERE inspectiondate >= (CURRENT_DATE - interval '1' year)) AS hpd_viol_bc_total
	    FROM hpd_violations
	    WHERE class = any('{B,C}')
	    GROUP BY bbl
	), hpd_comp AS (
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
	), aep AS (
		SELECT DISTINCT
			bbl,
			true as in_aep
		FROM hpd_aep
		WHERE currentstatus = 'AEP Active'
	), conh AS (
		-- TODO: this is only the pilot program, need to also include SROs and special districts
		SELECT DISTINCT
			bbl,
			true as in_conh
		FROM hpd_conh
	), ucp AS (
		SELECT DISTINCT
			bbl,
			true as in_ucp
		FROM hpd_underlying_conditions
		WHERE currentstatus = 'Active'
	), hpd_reg AS (
		SELECT 
			bbl,
			CASE WHEN count(*) = 1 THEN max(buildingid) ELSE NULL END AS buildingid
		FROM hpd_registrations
		GROUP BY bbl
	), acris_deed AS (
		SELECT DISTINCT ON (bbl)
			l.bbl,
			coalesce(m.docdate, m.recordedfiled) AS last_sale_date
		FROM real_property_master AS m
		LEFT JOIN real_property_legals AS l USING(documentid)
		WHERE docamount > 1 AND doctype = any('{DEED,DEEDO}')
		ORDER BY bbl, docdate DESC
	)
	SELECT
		-- LOCATION
		sp.bbl,
		sp.address,
		sp.zipcode AS zip,
		sp.borough,
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

		-- https://www.google.com/maps/place/801%20NEILL%20AVENUE%2C%20BRONX%2C%20NY%2010462 AS link_google,

		-- HPD PROGRAMS
		coalesce(aep.in_aep, false) AS in_aep,
		coalesce(conh.in_conh, false) AS in_conh,
		coalesce(ucp.in_ucp, false) AS in_ucp,
	
		-- HOUSING COURT
	    coalesce(evictions.evictions, 0) AS evictions,
	    
		-- HPD VIOLATIONS
	    coalesce(hpd_viol.hpd_viol_bc_open, 0) AS hpd_viol_bc_open,
	    coalesce(hpd_viol.hpd_viol_bc_total, 0) AS hpd_viol_bc_total,
	    
		-- HPD COMPLAINTS
	    coalesce(hpd_comp.hpd_comp_emerg_total, 0) AS hpd_comp_emerg_total,
	    coalesce(array_length(hpd_comp.hpd_comp_apts, 1), 0)::numeric / nullif(sp.unitsres, 0)::numeric AS hpd_comp_apts_pct,
	    array_to_string(hpd_comp.hpd_comp_apts, ', ') AS hpd_comp_apts,
		coalesce(hpd_comp_heat, 0) AS hpd_comp_heat,
		coalesce(hpd_comp_water, 0) AS hpd_comp_water,
		coalesce(hpd_comp_pests, 0) AS hpd_comp_pests,
		
		-- LANDLORD/LENDER
		sp.landlord,
		sp.landlord_slug,
		sp.lender,
		sp.lender_slug,
		
		-- FINANCIAL
		acris_deed.last_sale_date,
		sp.origination_date,
		sp.debt_total,
		sp.debt_unit
	FROM signature_pluto_poli AS sp
	LEFT JOIN evictions USING(bbl)
	LEFT JOIN hpd_viol USING(bbl)
	LEFT JOIN hpd_comp USING(bbl)
	LEFT JOIN aep USING(bbl)
	LEFT JOIN conh USING(bbl)
	LEFT JOIN ucp USING(bbl)
	LEFT JOIN hpd_reg USING(bbl)
	LEFT JOIN acris_deed USING(bbl)
);

CREATE INDEX ON signature_buildings (bbl);
CREATE INDEX ON signature_buildings (landlord);
CREATE INDEX ON signature_buildings (lender);
