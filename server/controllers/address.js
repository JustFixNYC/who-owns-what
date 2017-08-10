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

      if(geo.address.geosupportReturnCode == '00' && geo.address.bbl) {
        console.log('by bbl', geo.address.bbl);
        query.byBBL = true;
        return Promise.all([
          new Promise(r => r(geo.address)),
          db.queryContactsByBBL(geo.address.bbl),
          db.queryLandlordsByBBL(geo.address.bbl)
        ]);

      // this is a fallback option, but i'm not sure if theres any situation where our DB will
      // return something that didn't work with geoclient
      } else {
        console.log('by addr', housenumber, streetname, boro);
        query.byBBL = false;
        return Promise.all([
          new Promise(r => r({})),
          db.queryContactsByAddr(housenumber, streetname, boro),
          db.queryLandlordsByAddr(housenumber, streetname, boro)
        ]);
      }
    });

}

module.exports = {
  query: (req, res) => {
    getDataAndFormat(req.query)
      .then(results => {
        keen.recordEvent('search', {
          query: req.query,
          contacts: results[0].length ? true : false,
          landlords: results[1].length
        });
        res.status(200).send({ geoclient: results[0], contacts: results[1], landlords: results[2] });
       })
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });
  },

  export: (req, res) => {
    getDataAndFormat(req.query)
      .then(results => {

        const landlords = results[2];
        let addrs = [];

        addrs = landlords.map(l => {
          const assocRba = `${l.businesshousenumber} ${l.businessstreetname}${l.businessapartment ? ' ' + l.businessapartment : ''}, ${l.businesszip}`;
          //  TODO seriously, get es6 working on the backend
          return l.addrs.map(a => {

            a.ownernames = JSON.stringify(a.ownernames);

            return Object.assign(a, { businessAddr: assocRba });
          });
          // return l.addrs.map(a => { return { ...a, assocRba }})

        }).reduce((a,b) => a.concat(b));

        res.csv(addrs, true);
       })
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });
  }
};
