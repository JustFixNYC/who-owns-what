// Set up DB instance
const Promise = require('bluebird');
const pgp = require('pg-promise')({ promiseLib: Promise });
const db = pgp(process.env.DATABASE_URL);

module.exports = {
  queryAddress: bbl => db.func('get_assoc_addrs_from_bbl', bbl),
  queryAggregate: bbl => db.func('get_agg_info_from_bbl', bbl),
  queryLandlord: bbl => db.any('SELECT * FROM hpd_landlord_contact WHERE bbl = $1', bbl),
  querySaleHistory: bbl => db.any(`SELECT * FROM real_property_legals l 
  								   LEFT JOIN real_property_master m ON l.documentid = m.documentid
  								   WHERE bbl = $1 AND doctype = 'DEED'
  								   ORDER BY COALESCE(docdate,recordedfiled) DESC`, bbl)
};
