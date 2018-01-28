const db = require('../services/db'),
      geo = require('../services/geoclient'),
      csv = require('csv-express'),
      KeenTracking = require('keen-tracking'),
      Promise = require('bluebird');

const keen = new KeenTracking({
  projectId: process.env.KEEN_PROJECT_ID,
  writeKey: process.env.KEEN_WRITE_KEY
});


const getDataAndFormat = (query) => {

  const { housenumber, streetname, boro } = query;

  return geo.request(housenumber, streetname, boro)
    .then(geo => {

      // debug
      // const geo = { address: { bbl: '3012380016', geosupportReturnCode: '00' } };
      // console.dir(geo.address, {depth: null, colors: true});
      if((geo.address.geosupportReturnCode == '00' || geo.address.geosupportReturnCode == '01') && geo.address.bbl) {
        return Promise.all([
          geo.address,                          // we already have this value
          db.queryAddress(geo.address.bbl)
        ]);
      } else {
        throw new Error('Address not found');
      }
    });

};

module.exports = {
  query: (req, res) => {
    getDataAndFormat(req.query)
      .then(results => res.status(200).send({ geoclient: results[0], addrs: results[1] }) )
      .catch(err => res.status(400).send(err) );
  },

  aggregate: (req, res) => {
    db.queryAggregate(req.query.bbl)
      .then(result => res.status(200).send({ result: result }) )
      .catch(err => res.status(400).send(err) );
  },

  export: (req, res) => {
    getDataAndFormat(req.query)
      .then(results => {

        if(!results || !results[1]) {
          return res.status(400).send({ message: "Address not found!" });
        }

        let addrs = results[1].map(addr => {
          addr.ownernames = JSON.stringify(addr.ownernames);
          return addr;
        });

        res.csv(addrs, true);
       })
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });
  }
};
