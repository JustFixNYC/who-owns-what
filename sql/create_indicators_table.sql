-- All indicator values used in weekly Building Alerts and Area Alerts emails. 

-- NOTE: Building Alerts "month" values are different than Area Alerts. For
-- Building it's either the current month-to-date or if the week prior to the
-- email send spans the start of a new month then the "month" indicators are for
-- the entire previous calendar month. For Area alerts all indicators are just a
-- standard period relative to the end of the time range. For example, if the
-- emails are being sent on the morning of Monday June 4, then the building
-- alerts "month" is May 1-31 and the area alerts month is May 4 - June 4. If
-- the emails are sent on Monday July 14, then. building alerts "month" is July
-- 1 - July 13

-- Indicator time period naming convention:
-- "__6mo" - 6 months ending the day before the email send (eg. Dec 4 - June 4, if sent on June 5)
-- "__1mo" - 1 month ending the day before the email send (eg. May 4 - June 4, if sent on June 5)
-- "__week" - 7 days ending the day before the email send (eg. May 28 - June 4, if sent on June 5)
-- "__bldg_month" - "month" range for building alerts, see note above.

CREATE TABLE wow_indicators AS 

	WITH email_dates AS (
		SELECT 
			email_date_send::date,
			(email_date_send - interval '1 day')::date AS email_date_end,
			(email_date_send - interval '8 days')::date AS email_date_start_1_week,
			(email_date_send - interval '1 day 1 month')::date AS email_date_start_1_month,
			(email_date_send - interval '1 day 6 months')::date AS email_date_start_6_month,
			(email_date_send - interval '1 day 1 year')::date AS email_date_start_1_year,
			-- Building Alerts "month" range when "last week" range spans the month
			date_trunc('month', (email_date_send - interval '8 days'))::date AS email_date_bldg_month_start,
			(date_trunc('month', (email_date_send - interval '8 days')) + INTERVAL '1 month - 1 day')::date AS email_date_bldg_month_end,
			-- Building Alerts lagged eviction filings
			(email_date_send - interval '1 week')::date AS email_date_prev_send,
			(email_date_send - interval '1 week + 90 days')::date AS email_oldest_oca_date
		FROM (
			-- Monday of the current week
			SELECT date_trunc('week', CURRENT_DATE) AS email_date_send
		) as x
	),
	hpd_viol AS (
		SELECT 
			bbl,
		    count(*) FILTER (
				WHERE inspectiondate between email_date_bldg_month_start and email_date_bldg_month_end
			) AS hpd_viol_all__bldg_month,

		    count(*) FILTER (
				WHERE inspectiondate between email_date_start_1_week and email_date_end
			) AS hpd_viol_all__week,

		    count(*) FILTER (
				WHERE inspectiondate between email_date_start_6_month and email_date_end
					AND class = any('{B,C}')
			) AS hpd_viol_bc__6mo,

		    count(*) FILTER (
				WHERE inspectiondate between email_date_start_1_month and email_date_end
					AND class = any('{B,C}')
			) AS hpd_viol_bc__1mo,

		    count(*) FILTER (
		    	WHERE inspectiondate between email_date_start_1_week and email_date_end 
					AND class = any('{B,C}')
				AND violationstatus = 'Open'
	    	) AS hpd_viol_bc__week,

			array_agg(DISTINCT apartment) FILTER (
				WHERE inspectiondate between email_date_start_6_month and email_date_end
					AND class = any('{B,C}')
					AND apartment NOT IN ('BLDG', 'BLDNG','BUILDI', 'NA') 
			) AS hpd_viol_bc_apts__6mo,

			array_agg(DISTINCT apartment) FILTER (
				WHERE inspectiondate between email_date_start_1_week and email_date_end 
					AND class = any('{B,C}')
					AND apartment NOT IN ('BLDG', 'BLDNG','BUILDI', 'NA') 
					AND violationstatus = 'Open'
			) AS hpd_viol_bc_apts__week,

			count (DISTINCT date_part('week', inspectiondate::date)) FILTER (
				WHERE inspectiondate between email_date_start_1_year and email_date_end
					AND class = any('{B,C}')
			) AS hpd_viol_distress

		FROM email_dates, hpd_violations
		GROUP BY bbl
	),
	hpd_comp AS (
		SELECT 
			bbl,

		    count(*) FILTER (
				WHERE receiveddate between email_date_start_6_month and email_date_end
			) AS hpd_comp__6mo,

		    count(*) FILTER (
				WHERE receiveddate between email_date_start_1_month and email_date_end
			) AS hpd_comp__1mo,

		    count(*) FILTER (
				WHERE receiveddate between email_date_start_1_week and email_date_end
			) AS hpd_comp__week,

		    count(*) FILTER (
				WHERE receiveddate between email_date_bldg_month_start and email_date_bldg_month_end
			) AS hpd_comp__bldg_month,

		    count(*) FILTER (
		    	WHERE receiveddate between email_date_start_6_month and email_date_end 
					AND type = any('{IMMEDIATE EMERGENCY,HAZARDOUS,EMERGENCY}')
		    ) AS hpd_emergency_comp__6mo,

		    count(*) FILTER (
		    	WHERE receiveddate between email_date_start_1_week and email_date_end
					AND type = any('{IMMEDIATE EMERGENCY,HAZARDOUS,EMERGENCY}')
		    ) AS hpd_emergency_comp__week,

			array_agg(DISTINCT apartment) FILTER (
				WHERE receiveddate between email_date_start_6_month and email_date_end
					AND apartment NOT IN ('BLDG','BLDNG','BUILDI','NA')
			) AS hpd_comp_apts__6mo,

			array_agg(DISTINCT apartment) FILTER (
				WHERE receiveddate between email_date_start_1_week and email_date_end
					AND apartment NOT IN ('BLDG','BLDNG','BUILDI','NA')
			) AS hpd_comp_apts__week,

			count (DISTINCT date_part('week', receiveddate::date)) FILTER (
				WHERE receiveddate between email_date_start_1_year and email_date_end
			) AS hpd_comp_distress

		FROM email_dates, hpd_complaints_and_problems
		GROUP BY bbl
	),
	dob_ecb_stacked AS (
		SELECT
			bbl,
			bin,
			issuedate,
			(violationcategory ~* 'ACTIVE') AS is_active
		FROM email_dates, dob_violations
		WHERE issuedate between email_date_start_6_month and email_date_end
			AND violationtypecode IS NOT NULL
		UNION
		SELECT
			bbl,
			bin,
			issuedate,
			(certificationstatus IS NULL 
			OR certificationstatus in ('REINSPECTION SHOWS STILL IN VIOLATION', 
					'CERTIFICATE PENDING', 'CERTIFICATE DISAPPROVED', 'NO COMPLIANCE RECORDED')
			) AS is_active
		FROM email_dates, ecb_violations
		WHERE issuedate between email_date_start_6_month and email_date_end
			AND severity IS NOT NULL
	),
	dob_ecb_viol AS (
		SELECT
			x.bbl,
			max(bin) AS bin,
			count(*) FILTER (
				WHERE issuedate between email_date_start_6_month and email_date_end
			) AS dob_ecb_viol__6mo,

			count(*) FILTER (
				WHERE issuedate between email_date_start_1_month and email_date_end
			) AS dob_ecb_viol__1mo,

			count(*) FILTER (
				WHERE issuedate between email_date_start_1_week and email_date_end
			) AS dob_ecb_viol__week,

			count(*) FILTER (
				WHERE issuedate between email_date_bldg_month_start and email_date_bldg_month_end
			) AS dob_ecb_viol__bldg_month

		FROM email_dates, dob_ecb_stacked AS x
		LEFT JOIN pad_adr USING(bin)
		GROUP BY x.bbl
	),
	dob_comp AS (
		SELECT
			bbl,
			max(bin) AS bin,
			count(*) FILTER (
				WHERE dateentered between email_date_start_6_month and email_date_end
			) AS dob_comp__6mo,

			count(*) FILTER (
				WHERE dateentered between email_date_start_1_month and email_date_end
			) AS dob_comp__1mo,

			count(*) FILTER (
				WHERE dateentered between email_date_start_1_week and email_date_end
			) AS dob_comp__week,

			count(*) FILTER (
				WHERE dateentered between email_date_bldg_month_start and email_date_bldg_month_end
			) AS dob_comp__bldg_month

		FROM email_dates, dob_complaints
		LEFT JOIN pad_adr USING(bin)
		WHERE GREATEST(dateentered, dispositiondate, inspectiondate) between email_date_start_1_year and email_date_end
		GROUP BY bbl
	),
	evic_oca AS (
		SELECT
			a.bbl,
			count(DISTINCT indexnumberid) FILTER (
				WHERE i.fileddate between email_date_start_6_month and email_date_end
			) AS evictions_filed__6mo,

			count(DISTINCT indexnumberid) FILTER (
				WHERE i.fileddate between email_date_start_1_month and email_date_end
			) AS evictions_filed__1mo,

			count(DISTINCT indexnumberid) FILTER (
				WHERE i.fileddate between email_date_start_1_week and email_date_end
			) AS evictions_filed__week,

			count(DISTINCT indexnumberid) FILTER (
				WHERE i.fileddate between email_date_bldg_month_start and email_date_bldg_month_end
			) AS evictions_filed__bldg_month

		FROM email_dates, oca_index AS i
		LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
		WHERE i.fileddate between email_date_start_1_year and email_date_end
			AND i.classification = any('{Holdover,Non-Payment}') 
			AND i.propertytype = 'Residential'
			AND nullif(a.bbl, '') IS NOT NULL
		GROUP BY a.bbl
	),
	lagged_oca AS (
		SELECT
			bbl,
			coalesce(count(distinct indexnumberid), 0)::numeric AS lagged_eviction_filings,
			max(i.fileddate) AS lagged_eviction_date
		FROM email_dates, oca_addresses_with_bbl AS a
		LEFT JOIN oca_index AS i USING(indexnumberid)
		LEFT JOIN oca_metadata AS m USING(indexnumberid)
		WHERE i.classification = any('{Holdover,Non-Payment}')
			AND i.propertytype = 'Residential'
			AND m.initialdate >= email_date_prev_send 
			AND i.fileddate <= email_date_prev_send 
			AND i.fileddate > email_oldest_oca_date
		GROUP BY bbl
	),
	hpd_vacate AS (
		SELECT DISTINCT ON (bbl)
			bbl,
			to_char(vacateeffectivedate, 'Mon d, YYYY') AS hpd_vacate_date,
			initcap(vacatetype) AS hpd_vacate_type,
			numberofvacatedunits AS hpd_vacate_units_affected,
			primaryvacatereason AS hpd_vacate_reason
		FROM email_dates, hpd_vacateorders
		WHERE vacateeffectivedate between email_date_start_1_week and email_date_end
			AND rescinddate IS NULL
			AND coalesce(bbl, '') != ''
		-- keep 'entire building' orders over 'partial' ones if both
		ORDER BY bbl, vacatetype, vacateeffectivedate DESC
	),
	-- DOB disposition code reference https://www.nyc.gov/assets/buildings/pdf/bis_complaint_disposition_codes.pdf
    dob_vacate_issued AS (
		SELECT 
			bin,
			dispositiondate,
			to_char(dispositiondate, 'Mon d, YYYY') AS dob_vacate_date, 
			'Entire Building' AS dob_vacate_type,
			complaintnumber
		FROM email_dates, dob_complaints
		WHERE dispositiondate between email_date_start_1_week and email_date_end
			AND dispositioncode in ('ME', 'MH', 'Y1')
		UNION ALL
		SELECT 
			bin,
			dispositiondate,
			to_char(dispositiondate, 'Mon d, YYYY') AS dob_vacate_date, 
			'Partial' AS dob_vacate_type,
			complaintnumber
		FROM email_dates, dob_complaints
		WHERE dispositiondate between email_date_start_1_week and email_date_end
			AND dispositioncode in ('MF', 'MI', 'Y3')
	),
	dob_vacate_rescinded AS (
		SELECT 
			bin,
			dispositiondate
		FROM email_dates, dob_complaints
		WHERE dispositiondate between email_date_start_1_week and email_date_end
			AND dispositioncode in ('Y2')
		UNION ALL
		SELECT 
			bin,
			dispositiondate
		FROM email_dates, dob_complaints
		WHERE dispositiondate between email_date_start_1_week and email_date_end
			AND dispositioncode in ('Y4')
	),
	dob_vacate AS (
		SELECT DISTINCT ON (bbl)
			bbl,
			bin,
			dob_vacate_date,
			dob_vacate_type,
			complaintnumber as dob_vacate_complaint_number
		FROM dob_vacate_issued AS i
		LEFT JOIN dob_vacate_rescinded AS r using (bin)
		LEFT JOIN pad_adr USING(bin)
		WHERE r.bin is NULL
			AND bbl IS NOT NULL
		-- keep 'entire building' orders over 'partial' ones if both
		ORDER BY bbl, i.dob_vacate_type, i.dispositiondate DESC
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
			count(*) FILTER (
				WHERE caseopendate between email_date_start_1_week and email_date_end
			) AS hpd_lit__week,
			count(*) FILTER (
				WHERE caseopendate between email_date_start_1_month and email_date_end
			) AS hpd_lit__month
		FROM email_dates, hpd_litigations
		WHERE casestatus not in ('CLOSED')
		GROUP BY bbl
	),
	hpd_link AS (
	    SELECT DISTINCT
	        bbl,
	        CASE 
	            WHEN hpdbuildingid IS NOT NULL AND hpdbuildings = 1
	                THEN concat('https://hpdonline.nyc.gov/hpdonline/building/', hpdbuildingid)
	            ELSE NULL 
	        END AS hpd_link
	    FROM wow_bldgs
	)
	SELECT DISTINCT ON (bbl)
		x.housenumber,
        x.streetname,
        x.zip,
        x.boro,
        x.bbl,
        x.bin,
        x.unitsres,
        x.yearbuilt,
        x.rsunitslatest,
        
		coalesce(hpd_viol.hpd_viol_all__week, 0) AS hpd_viol_all__week,
		coalesce(hpd_viol.hpd_viol_all__bldg_month, 0) AS hpd_viol_all__bldg_month,
		coalesce(hpd_viol.hpd_viol_bc__6mo, 0) AS hpd_viol_bc__6mo,
		coalesce(hpd_viol.hpd_viol_bc__1mo, 0) AS hpd_viol_bc__1mo,
		coalesce(hpd_viol.hpd_viol_bc__week, 0) AS hpd_viol_bc__week,
	    coalesce(hpd_viol.hpd_viol_bc__6mo, 0)::float / nullif(x.unitsres, 0)::float AS hpd_viol_per_unit_bc__6mo,
	    coalesce(hpd_viol.hpd_viol_bc__1mo, 0)::float / nullif(x.unitsres, 0)::float AS hpd_viol_per_unit_bc__1mo,
 	    coalesce(hpd_viol.hpd_viol_bc__week, 0)::float / nullif(x.unitsres, 0)::float AS hpd_viol_per_unit_bc__week,	   
	    round(coalesce(array_length(hpd_viol.hpd_viol_bc_apts__6mo, 1), 0)::float / nullif(x.unitsres, 0)::float * 100) 
	    	AS hpd_viol_unit_pct_bc__6mo,
	    round(coalesce(array_length(hpd_viol.hpd_viol_bc_apts__week, 1), 0)::float / nullif(x.unitsres, 0)::float * 100) 
	    	AS hpd_viol_unit_pct_bc__week,	
		coalesce(hpd_viol.hpd_viol_distress, 0) AS hpd_viol_distressed_weeks,
	    

		coalesce(hpd_comp.hpd_comp__6mo, 0) AS hpd_comp__6mo,
		coalesce(hpd_comp.hpd_comp__1mo, 0) AS hpd_comp__1mo,
		coalesce(hpd_comp.hpd_comp__week, 0) AS hpd_comp__week,
		coalesce(hpd_comp.hpd_comp__bldg_month, 0) AS hpd_comp__bldg_month,
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

        dob_ecb_viol.bin AS dob_ecb_viol_bin,
		coalesce(dob_ecb_viol.dob_ecb_viol__6mo, 0) AS dob_ecb_viol__6mo,
		coalesce(dob_ecb_viol.dob_ecb_viol__1mo, 0) AS dob_ecb_viol__1mo,
		coalesce(dob_ecb_viol.dob_ecb_viol__week, 0) AS dob_ecb_viol__week,
		coalesce(dob_ecb_viol.dob_ecb_viol__bldg_month, 0) AS dob_ecb_viol__bldg_month,
		
		dob_comp.bin AS dob_comp_bin,
		coalesce(dob_comp.dob_comp__6mo, 0) AS dob_comp__6mo,
		coalesce(dob_comp.dob_comp__1mo, 0) AS dob_comp__1mo,
		coalesce(dob_comp.dob_comp__week, 0) AS dob_comp__week,
		coalesce(dob_comp.dob_comp__bldg_month, 0) AS dob_comp__bldg_month,

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
		CASE 
			WHEN x.unitsres > 10 THEN coalesce(evic_oca.evictions_filed__bldg_month, 0)
			ELSE NULL
		END AS evictions_filed__bldg_month,
		CASE 
			WHEN x.unitsres > 10 THEN coalesce(lagged_oca.lagged_eviction_filings, 0)
			ELSE NULL
		END AS lagged_eviction_filings,
		lagged_eviction_date,
		
		hpd_vacate.hpd_vacate_date,
		hpd_vacate.hpd_vacate_type,
		hpd_vacate.hpd_vacate_units_affected,
		hpd_vacate.hpd_vacate_reason,
		dob_vacate.bin AS dob_vacate_bin,
		dob_vacate.dob_vacate_date,
		dob_vacate.dob_vacate_type,
		dob_vacate.dob_vacate_complaint_number,
			
		latest_deeds.lastsaledate,
		latest_deeds.lastsaleamount,
		latest_deeds.lastsaleacrisid,
		
		portfolios.portfolio_id,
		portfolios.landlord_names,
		
		hpd_lit.hpd_lit__week,
		hpd_lit.hpd_lit__month,
		
		CASE 
        WHEN hpd_link.hpd_link IS NOT NULL THEN hpd_link.hpd_link
        ELSE 
            concat(
                'https://hpdonline.nyc.gov/hpdonline/building/search-results', 
                '?boroId=', substr(bbl, 1, 1),
                '&block=', substr(bbl, 2, 5), 
                '&lot=', substr(bbl, 7, 4)
            )
        END AS hpd_link,
		
		pld.coun_dist,
		pld.assem_dist,
		pld.stsen_dist,
		pld.community_dist,
		pld.zipcode, 
		pld.boroct2020 AS census_tract,
		pld.nta2020 AS nta
		
	FROM wow_bldgs AS x
	LEFT JOIN hpd_viol USING(bbl)
	LEFT JOIN hpd_comp USING(bbl)
	LEFT JOIN dob_ecb_viol USING(bbl)
	LEFT JOIN dob_comp USING(bbl)
	LEFT JOIN evic_oca USING(bbl)
	LEFT JOIN lagged_oca USING(bbl)
	LEFT JOIN hpd_vacate USING(bbl)
	LEFT JOIN dob_vacate using (bbl)
	LEFT JOIN pluto_latest_districts_25a AS pld USING(bbl)
	LEFT JOIN latest_deeds using(bbl)
	LEFT JOIN portfolios using (bbl) 
	LEFT JOIN hpd_lit using (bbl)
	LEFT JOIN hpd_link using(bbl)
	WHERE bbl IS NOT NULL;

create index on wow_indicators (bbl);
create index on wow_indicators (coun_dist);
create index on wow_indicators (assem_dist);
create index on wow_indicators (stsen_dist);
create index on wow_indicators (community_dist);
create index on wow_indicators (zipcode);
create index on wow_indicators (census_tract);
create index on wow_indicators (nta);
create index on wow_indicators (lastsaledate);
