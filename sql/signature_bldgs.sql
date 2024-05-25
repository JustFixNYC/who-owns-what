-- TODO: remove schema prefix from table names
DROP TABLE IF EXISTS signature_pluto_geos;
CREATE TEMP TABLE IF NOT EXISTS signature_pluto_geos AS (
	SELECT
		p.*,
		s.landlord,
		s.lender,
		s.origination_date,
		s.debt_building,
		s.debt_unit,
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
	LEFT JOIN nyad AS ad ON st_within(p.geom_point, ad.geom)
	LEFT JOIN nyss AS ss ON st_within(p.geom_point, ss.geom)
	LEFT JOIN nycg AS cg ON st_within(p.geom_point, cg.geom)
);

CREATE INDEX ON signature_pluto_poli (bbl);

DROP TABLE IF EXISTS signature_bldgs;
CREATE TABLE if not exists signature_bldgs AS (
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
			array_agg(DISTINCT apartment) FILTER (WHERE apartment NOT IN ('BLDG', 'NA')) AS hpd_comp_apts
		FROM HPD_COMPLAINTS_AND_PROBLEMS
		WHERE RECEIVEDDATE >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl
	)
	SELECT
		sp.bbl,
		sp.address,
		sp.zipcode AS zip,
		sp.borough,
		
		sp.council AS coun_dist,
		sp.assem_dist,
		sp.stsen_dist,
		sp.cong_dist,
			
		sp.unitsres AS units_res,
		sp.unitstotal - sp.unitsres AS units_comm,
		sp.yearbuilt AS year_built,
	
	    coalesce(evictions.evictions, 0) AS evictions,
	    
	    coalesce(hpd_viol.hpd_viol_bc_open, 0) AS hpd_viol_bc_open,
	    coalesce(hpd_viol.hpd_viol_bc_total, 0) AS hpd_viol_bc_total,
	    
	    coalesce(hpd_comp.hpd_comp_emerg_total, 0) AS hpd_comp_emerg_total,
	    coalesce(array_length(hpd_comp.hpd_comp_apts, 1), 0)::numeric / nullif(sp.unitsres, 0)::numeric AS hpd_comp_apts_pct,
	    array_to_string(hpd_comp.hpd_comp_apts, ', ') AS hpd_comp_apts,
		
		sp.landlord,
		sp.lender,
		nullif(sp.origination_date, '')::date AS origination_date,
		nullif(sp.debt_building, '')::numeric AS debt_total,
		nullif(sp.debt_unit, '')::numeric AS debt_per_unit,
		
		sp.latitude AS lat,
		sp.longitude AS lng
	FROM signature_pluto_poli AS sp
	LEFT JOIN evictions USING(bbl)
	LEFT JOIN hpd_viol USING(bbl)
	LEFT JOIN hpd_comp USING(bbl)
);

CREATE INDEX ON signature_bldgs (bbl);
CREATE INDEX ON signature_bldgs (landlord);
CREATE INDEX ON signature_bldgs (lender);
