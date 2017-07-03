// Set up DB instance
// var environment = process.env.NODE_ENV || 'development';
const dbConfig = require('../../knexfile.js')[process.env.NODE_ENV || 'development'];
const knex = require('knex')(dbConfig);

const getRegistration = () => {
  return knex.select()
    .from('hpd_registrations_grouped_by_bbl')
    .limit(1);
};

module.exports = {
  getRegistration: getRegistration
};
