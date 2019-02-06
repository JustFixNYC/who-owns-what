const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const Rollbar = require('rollbar');
const rollbar = Rollbar.init({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  // Only capture uncaught exceptions/unhandled rejections in production;
  // otherwise Rollbar appears to eat the exception and exit the
  // process with a 0 exit code, which is EXTREMELY confusing.
  captureUncaught: process.env.NODE_ENV === 'production',
  captureUnhandledRejections: process.env.NODE_ENV === 'production'
});

// TODO: change when migrating off heroku
const sslRedirect = require('heroku-ssl-redirect');

const routes = require('./routes');

// Set up the express app
const app = express();

// Log requests to the console.
app.use(logger('dev'));

// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// enable ssl redirect
app.use(sslRedirect());

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

app.use('/api', routes);

app.get('*', function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../client/build/index.html'));
});

// Use the rollbar error handler to send exceptions to your rollbar account
app.use(rollbar.errorHandler());

module.exports = app;
