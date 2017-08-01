const knex = require('../services/db'),
      geo = require('../services/geoclient'),
      _ = require('lodash'),
      Promise = require('bluebird');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenumber,
        streetname = req.query.streetname,
        boro = req.query.boro;

    const queryLandlords = (addrOrBBL) => {
      // get 1 or more RBAs from the address
      return knex.raw(addrOrBBL)
        .then(data => {
          // iterate over each RBA and populate the uniqregids with addresses, then return the results
          return Promise.map(data.rows, rba => {
            return knex.raw(`select * from get_addrs_from_regids('${rba.uniqregids.toString()}');`)
              // TODO: get es6 up-and-running here
              // .then(data => { ...rba, addrs: data.rows });
              .then(data => Object.assign(rba, { addrs: data.rows }));
          })
        });
    }

    geo.request(housenumber, streetname, boro)
      .then(geo => {
        // not sucessful
        if(geo.address.geosupportReturnCode !== '00') {
          return queryLandlords(`select * from get_rbas_from_addr('${housenumber}','${streetname}','${boro}');`);
        } else {
          // future: include geoclient data with response as well
          return queryLandlords(`select * from get_rbas_from_bbl('${geo.address.bbl}');`)
        }
      })
      .then(result => res.status(200).send(result))
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });
  }
};
