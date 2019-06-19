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
      SELECT
        TO_CHAR(NOVISSUEDDATE, 'YYYY-MM') AS MONTH,
        COUNT(*) FILTER (WHERE CLASS = 'A') AS VIOLS_CLASS_A,
        COUNT(*) FILTER (WHERE CLASS = 'B') AS VIOLS_CLASS_B,
        COUNT(*) FILTER (WHERE CLASS = 'C') AS VIOLS_CLASS_C,
        COUNT(*) FILTER (WHERE CLASS IS NOT NULL) AS VIOLS_TOTAL
      FROM HPD_VIOLATIONS
      WHERE BBL = $1
      AND NOVISSUEDDATE >= '2010-01-01'
      GROUP BY MONTH
    ),

    COMPLAINTS AS (
      SELECT 
        TO_CHAR(RECEIVEDDATE, 'YYYY-MM') AS MONTH, 
        COUNT(*) FILTER (WHERE TYPEID = ANY('{1,2,4}')) AS COMPLAINTS_EMERGENCY,
        COUNT(*) FILTER (WHERE TYPEID = ANY('{3,8}')) AS COMPLAINTS_NONEMERGENCY,
        COUNT(*) FILTER (WHERE TYPEID IS NOT NULL) AS COMPLAINTS_TOTAL
      FROM HPD_COMPLAINT_PROBLEMS P
      LEFT JOIN HPD_COMPLAINTS C ON P.COMPLAINTID = C.COMPLAINTID
      WHERE BBL = $1
      AND RECEIVEDDATE >= '2010-01-01'
      GROUP BY MONTH
    ),

    PERMITS AS (
      SELECT 
          TO_CHAR(PREFILINGDATE, 'YYYY-MM') AS MONTH, 
          COUNT(*) FILTER (WHERE JOBTYPE IS NOT NULL) AS PERMITS_TOTAL
      FROM DOBJOBS
      WHERE BBL = $1
      AND PREFILINGDATE >= '2010-01-01'
      GROUP BY MONTH
    )

  SELECT 
      T.MONTH,
      COALESCE(VIOLS_CLASS_A, 0) AS VIOLS_CLASS_A,
      COALESCE(VIOLS_CLASS_B, 0) AS VIOLS_CLASS_B,
      COALESCE(VIOLS_CLASS_C, 0) AS VIOLS_CLASS_C,
      COALESCE(VIOLS_TOTAL, 0) AS VIOLS_TOTAL,
      COALESCE(COMPLAINTS_EMERGENCY, 0) AS COMPLAINTS_EMERGENCY,
      COALESCE(COMPLAINTS_NONEMERGENCY, 0) AS COMPLAINTS_NONEMERGENCY,
      COALESCE(COMPLAINTS_TOTAL, 0) AS COMPLAINTS_TOTAL,
      COALESCE(PERMITS_TOTAL, 0) AS PERMITS_TOTAL
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
