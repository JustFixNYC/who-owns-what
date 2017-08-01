// Set up DB instance
const dbConfig = require('../../knexfile.js')[process.env.NODE_ENV || 'development'];
const knex = require('knex')(dbConfig);
const Promise = require('bluebird');

const queryByAddr = (housenumber, streetname, boro) => {
  return knex.select('registrationid', 'bbl')
    .from('hpd_registrations_grouped_by_bbl')
    .where({
      housenumber: housenumber,
      streetname: streetname,
      boro: boro
    })
    .as('registrations');
};

const queryByBBL = (bbl) => {
  return knex.select('registrationid', 'bbl')
    .from('hpd_registrations_grouped_by_bbl')
    .where({
      bbl: bbl
    })
    .as('registrations');
};

const queryContacts = (registrationSubQuery) => {
  return knex.select(
    'businesshousenumber as bisnum',
    'businessstreetname as bisstreet',
    'businessapartment as bisapt',
    'businesszip as biszip',
    'firstname',
    'lastname',
    'corporationname',
    'registrationcontacttype',
    'hpd_contacts.registrationid',
    'registrations.bbl'
  )
  .from('hpd_contacts')
  .innerJoin(
    registrationSubQuery,
    'registrations.registrationid',
    'hpd_contacts.registrationid'
  );
};

queryLandlords = (addrOrBBL) => {
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
};

module.exports = {

  queryContactsByBBL: (bbl) => {
    return queryContacts(queryByBBL(bbl));
  },

  queryContactsByAddr: (housenumber, streetname, boro) => {
    return queryContacts(queryByAddr(housenumber, streetname, boro));
  },

  queryLandlordsByBBL: (bbl) => {
    return queryLandlords(`select * from get_rbas_from_bbl('${bbl}');`)
  },

  queryLandlordsByAddr: (housenumber, streetname, boro) => {
    return queryLandlords(`select * from get_rbas_from_addr('${housenumber}','${streetname}','${boro}');`);
  }
};
