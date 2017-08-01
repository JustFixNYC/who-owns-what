const db = require('../services/db'),
      geo = require('../services/geoclient'),
      Promise = require('bluebird');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenumber,
        streetname = req.query.streetname,
        boro = req.query.boro;

    geo.request(housenumber, streetname, boro)
      .then(geo => {

        // console.dir(geo.address, {depth: null, colors: true});

        // successful

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
      .then(results => {
         res.status(200).send({ contacts: results[0], landlords: results[1] });
       })
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });


  }
};
