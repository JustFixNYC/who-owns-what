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

const violsHistorySQL = 
	`SELECT QUARTER,
       SUM(CASE WHEN CLASS = 'A' THEN 1 ELSE 0 END) AS CLASS_A,
       SUM(CASE WHEN CLASS = 'B' THEN 1 ELSE 0 END) AS CLASS_B,
       SUM(CASE WHEN CLASS = 'C' THEN 1 ELSE 0 END) AS CLASS_C,
       SUM(CASE WHEN CLASS = 'I' THEN 1 ELSE 0 END) AS CLASS_I,
       SUM(CASE WHEN CLASS IS NOT NULL THEN 1 ELSE 0 END) AS TOTAL
		  FROM (
				SELECT 
					CONCAT(EXTRACT(YEAR FROM NOVISSUEDDATE),
					' ',
					(CASE WHEN EXTRACT(MONTH FROM NOVISSUEDDATE) < 4 THEN 'Q1' 
					 WHEN EXTRACT(MONTH FROM NOVISSUEDDATE) < 7 THEN 'Q2'
					 WHEN EXTRACT(MONTH FROM NOVISSUEDDATE) < 10 THEN 'Q3'
					ELSE 'Q4' END)) AS QUARTER, 
				 	CLASS,
				 	BBL
				FROM HPD_VIOLATIONS
				WHERE BBL = $1
				AND NOVISSUEDDATE >= '2010-01-01'
				) SUB
	GROUP BY QUARTER
	ORDER BY QUARTER`;



module.exports = {
  queryAddress: bbl => db.func('get_assoc_addrs_from_bbl', bbl),
  queryAggregate: bbl => db.func('get_agg_info_from_bbl', bbl),
  queryLandlord: bbl => db.any('SELECT * FROM hpd_landlord_contact WHERE bbl = $1', bbl),
  querySaleHistory: bbl => db.any(saleHistorySQL, bbl),
  queryViolsHistory: bbl => db.any(violsHistorySQL, bbl)
};
