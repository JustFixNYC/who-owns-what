CREATE TABLE wow_indicators AS 

	WITH hpd_viol AS (
		SELECT 
			bbl,
		    count(*) FILTER (WHERE inspectiondate >= (CURRENT_DATE - interval '6' month)) AS hpd_viol__6mo,
		    count(*) FILTER (WHERE inspectiondate >= (CURRENT_DATE - interval '1' month)) AS hpd_viol__1mo,
		    count(*) FILTER (
		    	WHERE inspectiondate >= (CURRENT_DATE - interval '7' day) AND violationstatus = 'Open'
	    	) AS hpd_viol__week,
			array_agg(DISTINCT apartment) FILTER (
				WHERE apartment NOT IN ('BLDG', 'BLDNG','BUILDI', 'NA') AND inspectiondate >= (CURRENT_DATE - interval '6' month)
			) AS hpd_viol_apts__6mo,
			array_agg(DISTINCT apartment) FILTER (
				WHERE apartment NOT IN ('BLDG', 'BLDNG','BUILDI', 'NA') AND inspectiondate >= (CURRENT_DATE - interval '7' day) AND violationstatus = 'Open'
			) AS hpd_viol_apts__week,
			count (DISTINCT date_part('week', inspectiondate::date)) FILTER (
				WHERE inspectiondate >= (CURRENT_DATE - interval '1' year)
			) AS hpd_viol_distress
		FROM hpd_violations
		WHERE class = any('{B,C}') 
		GROUP BY bbl
	),
	hpd_comp AS (
		SELECT 
			bbl,
		    count(*) FILTER (WHERE receiveddate >= (CURRENT_DATE - interval '6' month)) AS hpd_comp__6mo,
		    count(*) FILTER (WHERE receiveddate >= (CURRENT_DATE - interval '1' month)) AS hpd_comp__1mo,
		    count(*) FILTER (WHERE receiveddate >= (CURRENT_DATE - interval '7' day)) AS hpd_comp__week,
		    count(*) FILTER (
		    	WHERE receiveddate >= (CURRENT_DATE - interval '6' month) AND type = any('{IMMEDIATE EMERGENCY,HAZARDOUS,EMERGENCY}')
		    ) AS hpd_emergency_comp__6mo,
		    count(*) FILTER (
		    	WHERE receiveddate >= (CURRENT_DATE - interval '7' day) AND type = any('{IMMEDIATE EMERGENCY,HAZARDOUS,EMERGENCY}')
		    ) AS hpd_emergency_comp__week,
			array_agg(DISTINCT apartment) FILTER (
				WHERE apartment NOT IN ('BLDG','BLDNG','BUILDI','NA') AND receiveddate >= (CURRENT_DATE - interval '6' month)
			) AS hpd_comp_apts__6mo,
			array_agg(DISTINCT apartment) FILTER (
				WHERE apartment NOT IN ('BLDG','BLDNG','BUILDI','NA') AND receiveddate >= (CURRENT_DATE - interval '7' day)
			) AS hpd_comp_apts__week,
			count (DISTINCT date_part('week', receiveddate::date)) FILTER (
				WHERE receiveddate >= (CURRENT_DATE - interval '1' year)
			) AS hpd_comp_distress
		FROM hpd_complaints_and_problems
		GROUP BY bbl
	),
	dob_ecb_stacked AS (
		SELECT
			bbl,
			issuedate,
			(violationcategory ~* 'ACTIVE') AS is_active
		FROM dob_violations 
		WHERE issuedate >= (CURRENT_DATE - interval '6' month)
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
		WHERE issuedate >= (CURRENT_DATE - interval '6' month)
			AND severity IS NOT NULL
	),
	dob_ecb_viol AS (
		SELECT
			bbl,
			count(*) FILTER (WHERE issuedate >= (CURRENT_DATE - interval '6' month)) AS dob_ecb_viol__6mo,
			count(*) FILTER (WHERE issuedate >= (CURRENT_DATE - interval '1' month)) AS dob_ecb_viol__1mo,
			count(*) FILTER (WHERE issuedate >= (CURRENT_DATE - interval '7' day)) AS dob_ecb_viol__week
		FROM dob_ecb_stacked
		GROUP BY bbl
	),
	dob_comp AS (
		SELECT
			bin,
			count(*) FILTER (WHERE dateentered >= (CURRENT_DATE - interval '6' month)) AS dob_comp__6mo,
			count(*) FILTER (WHERE dateentered >= (CURRENT_DATE - interval '1' month)) AS dob_comp__1mo,
			count(*) FILTER (WHERE dateentered >= (CURRENT_DATE - interval '7' day)) AS dob_comp__week
		FROM dob_complaints
		WHERE GREATEST(dateentered, dispositiondate, inspectiondate) >= (CURRENT_DATE - interval '1' year)
		GROUP BY bin
	),
	evic_oca AS (
		SELECT
			a.bbl,
			count(DISTINCT indexnumberid) FILTER (WHERE i.fileddate >= (CURRENT_DATE - interval '6' month)) AS evictions_filed__6mo,
			count(DISTINCT indexnumberid) FILTER (WHERE i.fileddate >= (CURRENT_DATE - interval '1' month)) AS evictions_filed__1mo,
			count(DISTINCT indexnumberid) FILTER (WHERE i.fileddate >= (CURRENT_DATE - interval '7' day)) AS evictions_filed__week
		FROM oca_index AS i
		LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
		WHERE i.fileddate >= (CURRENT_DATE - interval '1' year)
			AND i.classification = any('{Holdover,Non-Payment}') 
			AND i.propertytype = 'Residential'
			AND nullif(a.bbl, '') IS NOT NULL
		GROUP BY a.bbl
	),
	hpd_vacate AS (
		SELECT DISTINCT ON (bbl)
			bbl,
			concat(initcap(vacatetype), ' (', to_char(vacateeffectivedate, 'Mon d, YYYY'), ')') AS hpd_active_vacate
		FROM hpd_vacateorders
		WHERE vacateeffectivedate >= (CURRENT_DATE - interval '7' day)
			AND rescinddate IS NULL
			AND coalesce(bbl, '') != ''
		-- keep 'entire building' orders over 'partial' ones if both
		ORDER BY bbl, vacatetype, vacateeffectivedate DESC
	),
	dob_vacate_issued AS (
		SELECT 
			bin,
			concat('Entire Building', ' (', to_char(dispositiondate, 'Mon d, YYYY'), ')') AS dob_active_vacate
		FROM dob_complaints
			WHERE dispositioncode in ('ME', 'MH', 'Y1')
			AND dispositiondate > (CURRENT_DATE - interval '7' day)
		UNION ALL
		SELECT 
			bin,
			concat('Partial', ' (', to_char(dispositiondate, 'Mon d, YYYY'), ')') AS dob_active_vacate
		FROM dob_complaints
			WHERE dispositioncode in ('MF', 'MI', 'Y3')
			AND dispositiondate > (CURRENT_DATE - interval '7' day)
	),
	dob_vacate_rescinded AS (
		SELECT 
			bin,
			concat('Entire Building', ' (', to_char(dispositiondate, 'Mon d, YYYY'), ')') AS dob_vacate_rescind
		FROM dob_complaints
			WHERE dispositioncode in ('Y2')
			AND dispositiondate > (CURRENT_DATE - interval '7' day)
		UNION ALL
		SELECT 
			bin,
			concat('Partial', ' (', to_char(dispositiondate, 'Mon d, YYYY'), ')') AS dob_vacate_rescind
		FROM dob_complaints
			WHERE dispositioncode in ('Y4')
			AND dispositiondate > (CURRENT_DATE - interval '7' day)
	),
	dob_vacate AS (
		SELECT
			bin,
			dob_active_vacate
		FROM dob_vacate_issued
		LEFT JOIN dob_vacate_rescinded using (bin)
		WHERE dob_vacate_rescinded is null	
	),
	latest_deeds AS (
		SELECT DISTINCT ON (bbl)
			l.bbl,
			coalesce(m.docdate, m.recordedfiled) AS lastsaledate,
			m.docamount AS lastsaleamount, 
			m.documentid AS lastsaleacrisid
		FROM real_property_master AS m
		LEFT JOIN real_property_legals AS l USING(documentid)
		WHERE docamount > 1 AND doctype = any('{DEED,DEEDO}')
		ORDER BY bbl, coalesce(m.docdate, m.recordedfiled) DESC
	),
	portfolios AS (
		SELECT 
	        unnest(bbls) AS bbl, 
	        row_number() OVER (ORDER BY bbls) AS portfolio_id,
	        landlord_names
	    FROM wow_portfolios
	),
	hpd_lit AS (
		SELECT 
			bbl,
			count(*) FILTER (WHERE caseopendate >= (CURRENT_DATE - interval '7' day)) AS hpd_lit__week,
			count(*) FILTER (WHERE caseopendate >= (CURRENT_DATE - interval '30' day)) AS hpd_lit__month
		FROM hpd_litigations
		WHERE casestatus not in ('CLOSED')
		GROUP BY bbl
	)
	
--	select 
--		x.housenumber,
--        x.streetname,
--        x.zip,
--        x.boro,
--        x.bbl,
--        x.bin,
--        x.unitsres,
--        latest_deeds.last_sale_date
--	from wow_bldgs as x
--	left join latest_deeds using(bbl)
--	where last_sale_date is not null;
--	
--	
	SELECT
		x.housenumber,
        x.streetname,
        x.zip,
        x.boro,
        x.bbl,
        x.bin,
        x.unitsres,
        x.yearbuilt,
        x.rsunitslatest,
        
		coalesce(hpd_viol.hpd_viol__6mo, 0) AS hpd_viol__6mo,
		coalesce(hpd_viol.hpd_viol__1mo, 0) AS hpd_viol__1mo,
		coalesce(hpd_viol.hpd_viol__week, 0) AS hpd_viol__week,
	    coalesce(hpd_viol.hpd_viol__6mo, 0)::float / nullif(x.unitsres, 0)::float AS hpd_viol_per_unit__6mo,
	    coalesce(hpd_viol.hpd_viol__1mo, 0)::float / nullif(x.unitsres, 0)::float AS hpd_viol_per_unit__1mo,
 	    coalesce(hpd_viol.hpd_viol__week, 0)::float / nullif(x.unitsres, 0)::float AS hpd_viol_per_unit__week,	   
	    round(coalesce(array_length(hpd_viol.hpd_viol_apts__6mo, 1), 0)::float / nullif(x.unitsres, 0)::float * 100) 
	    	AS hpd_viol_unit_pct__6mo,
	    round(coalesce(array_length(hpd_viol.hpd_viol_apts__week, 1), 0)::float / nullif(x.unitsres, 0)::float * 100) 
	    	AS hpd_viol_unit_pct__week,	
		coalesce(hpd_viol.hpd_viol_distress, 0) AS hpd_viol_distressed_weeks,
	    

		coalesce(hpd_comp.hpd_comp__6mo, 0) AS hpd_comp__6mo,
		coalesce(hpd_comp.hpd_comp__1mo, 0) AS hpd_comp__1mo,
		coalesce(hpd_comp.hpd_comp__week, 0) AS hpd_comp__week,
		coalesce(hpd_comp.hpd_emergency_comp__6mo, 0) AS hpd_emergency_comp__6mo,
		coalesce(hpd_comp.hpd_emergency_comp__week, 0) AS hpd_emergency_comp__week,
	    coalesce(hpd_comp.hpd_comp__6mo, 0)::float / nullif(x.unitsres, 0)::float AS hpd_comp_per_unit__6mo,
	    coalesce(hpd_comp.hpd_comp__1mo, 0)::float / nullif(x.unitsres, 0)::float AS hpd_comp_per_unit__1mo,
 	    coalesce(hpd_comp.hpd_comp__week, 0)::float / nullif(x.unitsres, 0)::float AS hpd_comp_per_unit__week,	   
	    round(coalesce(array_length(hpd_comp.hpd_comp_apts__6mo, 1), 0)::float / nullif(x.unitsres, 0)::float * 100) 
	    	AS hpd_comp_unit_pct__6mo,
	    round(coalesce(array_length(hpd_comp.hpd_comp_apts__week, 1), 0)::float / nullif(x.unitsres, 0)::float * 100) 
	    	AS hpd_comp_unit_pct__week,
		coalesce(hpd_comp.hpd_comp_distress, 0) AS hpd_comp_distressed_weeks,

		
		coalesce(dob_ecb_viol.dob_ecb_viol__6mo, 0) AS dob_ecb_viol__6mo,
		coalesce(dob_ecb_viol.dob_ecb_viol__1mo, 0) AS dob_ecb_viol__1mo,
		coalesce(dob_ecb_viol.dob_ecb_viol__week, 0) AS dob_ecb_viol__week,		
		
		coalesce(dob_comp.dob_comp__6mo, 0) AS dob_comp__6mo,
		coalesce(dob_comp.dob_comp__1mo, 0) AS dob_comp__1mo,
		coalesce(dob_comp.dob_comp__week, 0) AS dob_comp__week,

		CASE 
			WHEN x.unitsres > 10 THEN coalesce(evic_oca.evictions_filed__6mo, 0)
			ELSE NULL
		END AS evictions_filed__6mo,
		CASE 
			WHEN x.unitsres > 10 THEN coalesce(evic_oca.evictions_filed__1mo, 0)
			ELSE NULL
		END AS evictions_filed__1mo,
		CASE 
			WHEN x.unitsres > 10 THEN coalesce(evic_oca.evictions_filed__week, 0)
			ELSE NULL
		END AS evictions_filed__week,
		
		hpd_vacate.hpd_active_vacate,
		dob_vacate.dob_active_vacate,
		
		latest_deeds.lastsaledate,
		latest_deeds.lastsaleamount,
		latest_deeds.lastsaleacrisid,
		
		portfolios.portfolio_id,
		portfolios.landlord_names,
		
		hpd_lit.hpd_lit__week,
		hpd_lit.hpd_lit__month,
		
		pld.coun_dist,
		pld.assem_dist,
		pld.stsen_dist,
		pld.cong_dist,
		pld.community_dist,
		pld.zipcode, 
		pld.census_tract,
		pld.nta,
		pld.borough

		
	FROM x_wow_bldgs AS x
	LEFT JOIN hpd_viol USING(bbl)
	LEFT JOIN hpd_comp USING(bbl)
	LEFT JOIN dob_ecb_viol USING(bbl)
	LEFT JOIN dob_comp USING(bin)
	LEFT JOIN evic_oca USING(bbl)
	LEFT JOIN hpd_vacate USING(bbl)
	LEFT JOIN dob_vacate using (bin)
	LEFT JOIN pluto_latest_districts AS pld USING(bbl)
	LEFT JOIN latest_deeds using(bbl)
	LEFT JOIN portfolios using (bbl) 
	LEFT JOIN hpd_lit using (bbl)
	WHERE bbl IS NOT NULL;

create index on wow_indicators (bbl);
