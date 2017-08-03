const db = require('../services/db'),
      geo = require('../services/geoclient'),
      csv = require('csv-express'),
      Promise = require('bluebird');

const getDataAndFormat = (query) => {

  const { housenumber, streetname, boro } = query;

  return geo.request(housenumber, streetname, boro)
    .then(geo => {

      // console.dir(geo.address, {depth: null, colors: true});
      if(geo.address.geosupportReturnCode == '00' && geo.address.bbl) {
        console.log('by bbl', geo.address.bbl);
        return Promise.all([
          db.queryContactsByBBL(geo.address.bbl),
          db.queryLandlordsByBBL(geo.address.bbl)
        ]);
      } else {
        console.log('by addr', housenumber, streetname, boro);
        return Promise.all([
          db.queryContactsByAddr(housenumber, streetname, boro),
          db.queryLandlordsByAddr(housenumber, streetname, boro)
        ]);
      }
    })

}

module.exports = {
  query: (req, res) => {
    getDataAndFormat(req.query)
      .then(results => {
         res.status(200).send({ contacts: results[0], landlords: results[1] });
       })
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });
  },

  export: (req, res) => {
    getDataAndFormat(req.query)
      .then(results => {

        const landlords = results[1];
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
