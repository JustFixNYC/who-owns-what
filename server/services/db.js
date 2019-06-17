// Set up DB instance
const Promise = require('bluebird');
const pgp = require('pg-promise')({ promiseLib: Promise });
const db = pgp(process.env.DATABASE_URL);


// WOW Indicators Custom Queries
const saleHistorySQL = 
  `SELECT * 
   FROM real_property_legals l 
    LEFT JOIN real_property_master m ON l.documentid = m.documentid
   WHERE bbl = $1 AND doctype = 'DEED'
   ORDER BY COALESCE(docdate,recordedfiled) DESC`;

const indicatorHistorySQL = 
	`WITH TIME_SERIES AS (
        SELECT TO_CHAR(I::DATE , 'YYYY-MM') AS MONTH 
        FROM GENERATE_SERIES('2010-01-01', CURRENT_DATE - INTERVAL '1 MONTH', '1 MONTH'::INTERVAL) I
    ),
    
    VIOLS AS (
        SELECT T.MONTH,
           SUM(CASE WHEN CLASS = 'A' THEN 1 ELSE 0 END) AS VIOLS_CLASS_A,
           SUM(CASE WHEN CLASS = 'B' THEN 1 ELSE 0 END) AS VIOLS_CLASS_B,
           SUM(CASE WHEN CLASS = 'C' THEN 1 ELSE 0 END) AS VIOLS_CLASS_C,
           SUM(CASE WHEN CLASS IS NOT NULL THEN 1 ELSE 0 END) AS VIOLS_TOTAL
              FROM TIME_SERIES T
              LEFT JOIN (
                    SELECT 
                        TO_CHAR(NOVISSUEDDATE, 'YYYY-MM') AS MONTH, 
                         CLASS,
                         BBL
                    FROM HPD_VIOLATIONS
                    WHERE BBL = $1
                    AND NOVISSUEDDATE >= '2010-01-01'
                    ) SUB ON T.MONTH = SUB.MONTH
        GROUP BY T.MONTH
    ),

    COMPLAINTS AS (
        SELECT T.MONTH,
           SUM(CASE WHEN TYPEID = ANY('{1,2,4}') THEN 1 ELSE 0 END) AS COMPLAINTS_EMERGENCY,
           SUM(CASE WHEN TYPEID = ANY('{3,8}') THEN 1 ELSE 0 END) AS COMPLAINTS_NONEMERGENCY,
           SUM(CASE WHEN TYPEID IS NOT NULL THEN 1 ELSE 0 END) AS COMPLAINTS_TOTAL
              FROM TIME_SERIES T
              LEFT JOIN (
                    SELECT 
                        TO_CHAR(RECEIVEDDATE, 'YYYY-MM') AS MONTH, 
                         TYPEID,
                         BBL
                    FROM HPD_COMPLAINT_PROBLEMS P
                    LEFT JOIN HPD_COMPLAINTS C ON P.COMPLAINTID = C.COMPLAINTID
                    WHERE BBL = $1
                    AND RECEIVEDDATE >= '2010-01-01'
                    ) SUB ON T.MONTH = SUB.MONTH
        GROUP BY T.MONTH
    ),

    PERMITS AS (
        SELECT T.MONTH,
           SUM(CASE WHEN JOBTYPE IS NOT NULL THEN 1 ELSE 0 END) AS PERMITS_TOTAL
              FROM TIME_SERIES T
              LEFT JOIN (
                    SELECT 
                        TO_CHAR(PREFILINGDATE, 'YYYY-MM') AS MONTH, 
                         JOBTYPE,
                         BBL
                    FROM DOBJOBS
                    WHERE BBL = $1
                    AND PREFILINGDATE >= '2010-01-01'
                    ) SUB ON T.MONTH = SUB.MONTH
        GROUP BY T.MONTH
    )

    SELECT 
        T.MONTH,
        VIOLS_CLASS_A::NUMERIC,
        VIOLS_CLASS_B::NUMERIC,
        VIOLS_CLASS_C::NUMERIC,
        VIOLS_TOTAL::NUMERIC,
        COMPLAINTS_EMERGENCY::NUMERIC,
        COMPLAINTS_NONEMERGENCY::NUMERIC,
        COMPLAINTS_TOTAL::NUMERIC,
        PERMITS_TOTAL::NUMERIC
    FROM TIME_SERIES T
    LEFT JOIN VIOLS V ON T.MONTH = V.MONTH
    LEFT JOIN COMPLAINTS C ON T.MONTH = C.MONTH
    LEFT JOIN PERMITS P ON T.MONTH = P.MONTH
    ORDER BY T.MONTH ASC`;

module.exports = {
  queryAddress: bbl => db.func('get_assoc_addrs_from_bbl', bbl),
  queryAggregate: bbl => db.func('get_agg_info_from_bbl', bbl),
  queryLandlord: bbl => db.any('SELECT * FROM hpd_landlord_contact WHERE bbl = $1', bbl),
  querySaleHistory: bbl => db.any(saleHistorySQL, bbl),
  queryIndicatorHistory: bbl => db.any(indicatorHistorySQL, bbl)
};
