const db = require("../services/db"),
  csv = require("csv-express"),
  rollbar = require("rollbar");
Promise = require("bluebird");

module.exports = {
  query: (req, res) => {
    db.queryLandlord(req.query.bbl)
      .then((result) => res.status(200).send({ result: result }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },
};
