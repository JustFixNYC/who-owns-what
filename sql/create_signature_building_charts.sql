DROP TABLE IF EXISTS signature_building_charts CASCADE;
CREATE TABLE IF NOT EXISTS signature_building_charts AS

    WITH time_series AS (
        SELECT 
            bbl, 
            to_char(i::date , 'YYYY-MM') AS month 
        FROM 
            signature_unhp_data, 
            generate_series('2010-01-01', CURRENT_DATE - INTERVAL '1 MONTH', '1 MONTH'::INTERVAL) AS i 
    ), 

    hpdviolations AS (
        SELECT
            bbl,
            to_char(inspectiondate, 'YYYY-MM') AS month,
            count(*) FILTER (WHERE class = 'A') AS hpdviolations_class_a,
            count(*) FILTER (WHERE class = 'B') AS hpdviolations_class_b,
            count(*) FILTER (WHERE class = 'C') AS hpdviolations_class_c,
            count(*) FILTER (WHERE class = 'I') AS hpdviolations_class_i,
            count(*) FILTER (WHERE class IS NOT NULL) AS hpdviolations_total
        FROM hpd_violations
        INNER JOIN signature_unhp_data USING(bbl)
        WHERE inspectiondate >= '2010-01-01'
        GROUP BY bbl, month
    ),

    hpdcomplaints AS (
        SELECT 
            bbl,
            to_char(receiveddate, 'YYYY-MM') AS month, 
            count(*) FILTER (WHERE type = ANY('{IMMEDIATE EMERGENCY,HAZARDOUS,EMERGENCY}')) AS hpdcomplaints_emergency,
            count(*) FILTER (WHERE type = ANY('{REFERRAL,NON EMERGENCY}')) AS hpdcomplaints_nonemergency,
            count(*) FILTER (WHERE type IS NOT NULL) AS hpdcomplaints_total
        FROM hpd_complaints_and_problems
        INNER JOIN signature_unhp_data USING(bbl)
        WHERE receiveddate >= '2010-01-01'
        GROUP BY bbl, month
    ),

    regulardobviolations AS (
        SELECT
            bbl,
            to_char(issuedate, 'YYYY-MM') AS month,
            count(*) FILTER (WHERE violationtypecode IS NOT NULL) regulardobviolations_total
        FROM dob_violations
        INNER JOIN signature_unhp_data USING(bbl)   
        WHERE issuedate >= '2010-01-01'
        GROUP BY bbl, month
    ),

    ecbviolations AS (
        SELECT
            bbl,
            to_char(issuedate, 'YYYY-MM') AS month,
            count(*) FILTER (WHERE severity IS NOT NULL) AS ecbviolations_total
        FROM ecb_violations
        INNER JOIN signature_unhp_data USING(bbl)   
        WHERE issuedate >= '2010-01-01'
        GROUP BY bbl, month
    ),

    eviction_filings AS (
        SELECT
            a.bbl,
            -- can only report annual data per ODC privacy concerns
            TO_CHAR(i.fileddate, 'YYYY') || '-01' AS month,
            count(distinct indexnumberid) AS evictions_filed
        FROM oca_index AS i
        LEFT JOIN oca_addresses_with_bbl AS a USING(indexnumberid)
        LEFT JOIN pluto_latest AS p USING(bbl)
        INNER JOIN signature_unhp_data USING(bbl)   
        WHERE i.classification = any('{Holdover,Non-Payment}') 
            AND i.propertytype = 'Residential'
            AND a.bbl IS NOT NULL
            AND coalesce(p.unitsres, 0) > 10
            AND i.fileddate >= '2010-01-01'
        GROUP BY a.bbl, TO_CHAR(i.fileddate, 'YYYY')
    ),

    eviction_executions AS (
        SELECT
            bbl,
            -- only reporting annual data to match filings
            TO_CHAR(executeddate, 'YYYY') || '-01' AS month,
            count(*) AS evictions_executed
        FROM marshal_evictions_all
        INNER JOIN signature_unhp_data USING(bbl)   
        WHERE executeddate >= '2010-01-01'
        GROUP BY bbl, TO_CHAR(executeddate, 'YYYY')
    ),

    rentstab_data as (
        SELECT s.bbl, r1.*, r2.*
        FROM rentstab AS r1
        FULL JOIN rentstab_v2 AS r2 USING(ucbbl)
        INNER JOIN signature_unhp_data AS s ON r2.ucbbl = s.bbl
    ),
    
    rentstab_units AS (
      SELECT bbl, '2007-01' AS month, uc2007 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2008-01' AS month, uc2008 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2009-01' AS month, uc2009 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2010-01' AS month, uc2010 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2011-01' AS month, uc2011 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2012-01' AS month, uc2012 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2013-01' AS month, uc2013 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2014-01' AS month, uc2014 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2015-01' AS month, uc2015 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2016-01' AS month, uc2016 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2017-01' AS month, uc2017 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2018-01' AS month, uc2018 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2020-01' AS month, uc2020 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2021-01' AS month, uc2021 AS rentstab_units FROM rentstab_data
      UNION
      SELECT bbl, '2022-01' AS month, uc2022 AS rentstab_units FROM rentstab_data
    ),

    dob_jobs_all AS (
		SELECT 
			bbl,
            to_char(filingdate, 'YYYY-MM') AS month, 
			count(DISTINCT jobfilingnumber) AS dob_jobs
		FROM dob_now_jobs
        INNER JOIN signature_unhp_data USING(bbl) 
		WHERE filingdate >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl, month
		UNION 
		SELECT 
			bbl,
            to_char(prefilingdate, 'YYYY-MM') AS month, 
			count(DISTINCT job) AS dob_jobs
		FROM dobjobs
        INNER JOIN signature_unhp_data USING(bbl) 
		WHERE prefilingdate >= (CURRENT_DATE - interval '1' year)
		GROUP BY bbl, month
	),

	dob_permits_jobs AS (
		SELECT
			bbl,
            month, 
			sum(dob_jobs)::int as dobpermits_jobs
		FROM dob_jobs_all
		GROUP BY bbl, month
	),

    hpd_erp_charges_all AS (
		SELECT 
			c.bbl, 
			c.omocreatedate AS order_date,
			sum(i.chargeamount) AS charge_amount
		FROM hpd_omo_charges AS c
		LEFT JOIN hpd_omo_invoices AS i USING(omonumber)
        WHERE c.omocreatedate >= '2010-01-01'
		GROUP BY bbl, omonumber, c.omocreatedate
		UNION
		SELECT 
			bbl, 
			hwocreatedate AS order_date, 
			chargeamount AS charge_amount
		FROM hpd_hwo_charges
        WHERE hwocreatedate >= '2010-01-01'
	), 
	
	hpd_erp AS (
		SELECT
			bbl,
            to_char(order_date, 'YYYY-MM') AS month, 
			sum(charge_amount)::float AS hpderp_charges
		FROM hpd_erp_charges_all
        INNER JOIN signature_unhp_data USING(bbl)   
		GROUP BY bbl, month
	)

    SELECT 
        bbl, 
        month,
        coalesce(hpdviolations_class_a, 0) AS hpdviolations_class_a,
        coalesce(hpdviolations_class_b, 0) AS hpdviolations_class_b,
        coalesce(hpdviolations_class_c, 0) AS hpdviolations_class_c,
        coalesce(hpdviolations_class_i, 0) AS hpdviolations_class_i,
        coalesce(hpdviolations_total, 0) AS hpdviolations_total,

        coalesce(hpdcomplaints_emergency, 0) AS hpdcomplaints_emergency,
        coalesce(hpdcomplaints_nonemergency, 0) AS hpdcomplaints_nonemergency,
        coalesce(hpdcomplaints_total, 0) AS hpdcomplaints_total,

        -- combine regular dob violations and ecb violations into one grouping called "dobviolations"
        coalesce(regulardobviolations_total, 0) AS dobviolations_regular,
        coalesce(ecbviolations_total, 0) AS dobviolations_ecb,
        coalesce(regulardobviolations_total, 0) + coalesce(ecbviolations_total, 0) AS dobviolations_total,

        CASE 
            WHEN pluto_latest.unitsres > 10 THEN coalesce(evictions_filed, 0)
			ELSE NULL
		END AS evictions_filed,
        coalesce(evictions_executed, 0) AS evictions_executed,

        coalesce(rentstab_units, 0) AS rentstab_units,

        coalesce(dobpermits_jobs, 0) AS dobpermits_jobs,

        coalesce(hpderp_charges, 0) AS hpderp_charges

    FROM time_series
    LEFT JOIN pluto_latest USING(bbl)
    LEFT JOIN hpdviolations USING(bbl, month)
    LEFT JOIN hpdcomplaints USING(bbl, month)
    LEFT JOIN regulardobviolations USING(bbl, month)
    LEFT JOIN ecbviolations USING(bbl, month)
    LEFT JOIN eviction_filings USING(bbl, month)
    LEFT JOIN eviction_executions USING(bbl, month)
    LEFT JOIN rentstab_units USING(bbl, month)
    LEFT JOIN dob_permits_jobs USING(bbl, month)
    LEFT JOIN hpd_erp USING(bbl, month)
    ORDER BY bbl, month ASC;

CREATE INDEX ON signature_building_charts (bbl);