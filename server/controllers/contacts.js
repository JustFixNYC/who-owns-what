const db = require('../services/db'),
      geo = require('../services/geoclient');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenumber,
        streetname = req.query.streetname,
        boro = req.query.boro;

    geo.request(housenumber, streetname, boro)
      .then(geo => {
        // successful
        if(geo.address.geosupportReturnCode == '00') {
          // future: include geoclient data with response as well
          return db.queryContactsByBBL(geo.address.bbl);
        } else {
          return db.queryContactsByAddr(housenumber, streetname, boro);
        }
      })
      .then(result => res.status(200).send(result))
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });

  }
};
