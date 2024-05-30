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
        to_char(coalesce(inspectiondate, novissueddate), 'YYYY-MM') AS month,
        count(*) FILTER (WHERE class = 'A') AS hpdviolations_class_a,
        count(*) FILTER (WHERE class = 'B') AS hpdviolations_class_b,
        count(*) FILTER (WHERE class = 'C') AS hpdviolations_class_c,
        count(*) FILTER (WHERE class = 'I') AS hpdviolations_class_i,
        count(*) FILTER (WHERE class IS NOT NULL) AS hpdviolations_total
        FROM hpd_violations
        INNER JOIN signature.signature_unhp_data USING(bbl)
        WHERE coalesce(inspectiondate, novissueddate) >= '2010-01-01'
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
        coalesce(regulardobviolations_total, 0) + coalesce(ecbviolations_total, 0) AS dobviolations_total
    FROM time_series
    LEFT JOIN hpdviolations USING(bbl, month)
    LEFT JOIN hpdcomplaints USING(bbl, month)
    LEFT JOIN regulardobviolations USING(bbl, month)
    LEFT JOIN ecbviolations USING(bbl, month)
    ORDER BY bbl, month ASC;

CREATE INDEX ON signature_building_charts (bbl);