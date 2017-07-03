// Set up DB instance
// var environment = process.env.NODE_ENV || 'development';
var dbConfig = require('./knexfile.js')[process.env.NODE_ENV || 'development'];
var db = require('knex')(dbConfig);

// Init the express application
var app = require('./server/express')(db);

module.exports = app;
