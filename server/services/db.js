// Set up DB instance
const Promise = require('bluebird');
const pgp = require('pg-promise')({ promiseLib: Promise });
const db = pgp(process.env.DATABASE_URL);

module.exports = {
  queryAddress: (bbl) => db.func('get_assoc_addrs_from_bbl', bbl)
};
