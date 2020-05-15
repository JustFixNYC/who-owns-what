const db = require("../services/db"),
  csv = require("csv-express"),
  geo = require("../services/geoclient"),
  rollbar = require("rollbar");
Promise = require("bluebird");

const formatData = (geo) => {
  // debug
  // const geo = { address: { bbl: '3012380016', geosupportReturnCode: '00' } };
  // console.dir(geo.address, {depth: null, colors: true});

  const result = geo.address || geo.bbl;

  if ((result.geosupportReturnCode == "00" || result.geosupportReturnCode == "01") && result.bbl) {
    return Promise.all([
      result, // we already have this value
      db.queryAddress(result.bbl),
    ]);
  } else {
    throw new Error("[geosearch] Address not found");
  }
};

const getDataAndFormat = (query) => {
  if (query.houseNumber && query.street && query.borough) {
    return geo.requestAddress(query).then(formatData);
  } else if (query.block && query.lot && query.borough) {
    return formatData({
      address: {
        geosupportReturnCode: "00",
        bbl: query.borough + query.block + query.lot,
      },
    });
    // return geo.requestBBL(query).then(formatData);
  } else {
    throw new Error("API query param mismatch");
  }
};

module.exports = {
  query: (req, res) => {
    getDataAndFormat(req.query)
      .then((results) => res.status(200).send({ geosearch: results[0], addrs: results[1] }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },

  aggregate: (req, res) => {
    db.queryAggregate(req.query.bbl)
      .then((result) => res.status(200).send({ result: result }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },

  dapAggregate: (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    db.queryDapAggregate(req.query.bbl)
      .then((result) => res.status(200).send({ result: result }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },

  buildinginfo: (req, res) => {
    db.queryBuildingInfo(req.query.bbl)
      .then((result) => res.status(200).send({ result: result }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },

  salehistory: (req, res) => {
    db.querySaleHistory(req.query.bbl)
      .then((result) => res.status(200).send({ result: result }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },

  indicatorhistory: (req, res) => {
    db.queryIndicatorHistory(req.query.bbl)
      .then((result) => res.status(200).send({ result: result }))
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },

  export: (req, res) => {
    getDataAndFormat(req.query)
      .then((results) => {
        if (!results || !results[1]) {
          rollbar.error({ message: "Address not found!" }, req);
          return res.status(200).send({ message: "Address not found!" });
        }

        let addrs = results[1].map((addr) => {
          addr.ownernames = addr.ownernames.reduce((owners, owner, idx) => {
            return owners + `${idx > 0 ? ", " : ""}${owner.value} (${owner.title})`;
          }, "");

          return addr;
        });

        res.csv(addrs, true);
      })
      .catch((err) => {
        rollbar.error(err, req);
        res.status(200).send({ error: err.message });
      });
  },
};
