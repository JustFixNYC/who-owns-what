// Set up DB instance
// var environment = process.env.NODE_ENV || 'development';
const dbConfig = require('../../knexfile.js')[process.env.NODE_ENV || 'development'];
const knex = require('knex')(dbConfig);

// Simple example. Grab the contacts from a building based on its address
// Alternatively, just grab from a BBL?
const getBuildingContacts = (housenumber, streetname, boro) => {

  let registrationSubQuery = knex.select('registrationid')
    .from('hpd_registrations_grouped_by_bbl')
    .where({
      housenumber: housenumber,
      streetname: streetname,
      boro: boro
    })
    .as('r');

  let query = knex.select(
      'businesshousenumber as bisnum',
      'businessstreetname as bisstreet',
      'businessapartment as bisapt',
      'businesszip as biszip',
      'firstname',
      'lastname',
      'corporationname',
      'registrationcontacttype',
      'hpd_contacts.registrationid'
    )
    .from('hpd_contacts')
    .innerJoin(
      registrationSubQuery,
      'r.registrationid',
      'hpd_contacts.registrationid'
    );

  return query;
};

module.exports = {
  getBuildingContacts: getBuildingContacts
};
