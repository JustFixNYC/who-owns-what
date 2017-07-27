const knex = require('../services/db');
const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenumber,
        streetname = req.query.streetname,
        boro = req.query.boro;

    // get 1 or more RBAs from the address
    knex.raw(`select * from get_rbas_from_addr('${housenumber}','${streetname}','${boro}');`).then(data => {

      // iterate over each RBA and populate the uniqregids with addresses, then return the results
      return Promise.map(data.rows, rba => {
        return knex.raw(`select * from get_addrs_from_regids('${rba.uniqregids.toString()}');`)
          // TODO: get es6 up-and-running here
          // .then(data => { ...rba, addrs: data.rows });
          .then(data => Object.assign(rba, { addrs: data.rows }));
      })
      .then(rbas => res.status(200).send(rbas))
      .catch(error => res.status(400).send(error));
    })
    .catch(error => res.status(400).send(error));
  }
};
