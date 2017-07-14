const knex = require('../services/db');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenumber,
        streetname = req.query.streetname,
        boro = req.query.boro;

    // 1. gets the registrationid based on the submitted address
    let registrationSubQuery = knex.select('registrationid')
      .from('hpd_registrations_grouped_by_bbl')
      .where({
        housenumber: housenumber,
        streetname: streetname,
        boro: boro
      })
      .as('r');

    // 2. get 0 or more contacts based on the registrationid
    let contactsSubQuery = knex.select()
      .from('hpd_contacts')
      .innerJoin(
        registrationSubQuery,
        'r.registrationid',
        'hpd_contacts.registrationid'
      )
      .as('c2');

    let query = () => {
      return knex
        .distinct(knex.raw('ON (bbl) bbl'))
        .select('*')
        .from('hpd_registrations_grouped_by_bbl')
        // 4. get the registrations associated with the contacts found in 3
        .innerJoin('hpd_contacts', 'hpd_contacts.registrationid', 'hpd_registrations_grouped_by_bbl.registrationid')
        // 3. find all contacts that might intersect with one of the found business addresses
        .innerJoin(
          contactsSubQuery,
          function() {
            this.on('hpd_contacts.businesshousenumber', 'c2.businesshousenumber')
              .andOn('hpd_contacts.businessstreetname', 'c2.businessstreetname')
              .andOn('hpd_contacts.businessapartment', 'c2.businessapartment')
              .andOn('hpd_contacts.businesszip', 'c2.businesszip');
          }
        );
    }

    console.log(query().toString());

    query()
      .then(result => {
        console.log(result.length);
        res.status(201).send(result)
      })
      .catch(error => res.status(400).send(error));
  }
};
