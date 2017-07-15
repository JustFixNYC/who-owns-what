// Set up DB instance
const dbConfig = require('../../knexfile.js')[process.env.NODE_ENV || 'development'];
const knex = require('knex')(dbConfig);

module.exports = knex;
