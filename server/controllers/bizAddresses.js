const knex = require('../services/db');
const _ = require('lodash');

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
        .select(
          // 'hpd_registrations_grouped_by_bbl.bbl',
          'hpd_registrations_grouped_by_bbl.housenumber',
          'hpd_registrations_grouped_by_bbl.streetname',
          'hpd_registrations_grouped_by_bbl.boro',
          'hpd_registrations_grouped_by_bbl.lat',
          'hpd_registrations_grouped_by_bbl.lng',
          'hpd_registrations_grouped_by_bbl.registrationid',
          'hpd_contacts.registrationcontactid',
          'hpd_contacts.registrationcontacttype',
          'hpd_contacts.firstname',
          'hpd_contacts.lastname',
          'hpd_contacts.corporationname',
          'hpd_contacts.businesshousenumber',
          'hpd_contacts.businessstreetname',
          'hpd_contacts.businessapartment',
          'hpd_contacts.businesszip'
        )
        .from('hpd_registrations_grouped_by_bbl')
        // 4. get the registrations associated with the contacts found in 3
        .innerJoin('hpd_contacts', 'hpd_contacts.registrationid', 'hpd_registrations_grouped_by_bbl.registrationid')
        // 3. find all contacts that might intersect with one of the found business addresses
        .innerJoin(
          contactsSubQuery,
          function() {
            this.on('hpd_contacts.businesshousenumber', 'c2.businesshousenumber')
              .andOn('hpd_contacts.businessstreetname', 'c2.businessstreetname')
              .andOn(knex.raw('(hpd_contacts.businessapartment ~ c2.businessapartment or (hpd_contacts.businessapartment is null and c2.businessapartment is null))'))
              .andOn('hpd_contacts.businesszip', 'c2.businesszip');
          }
        );
    }

    query()
      .then(result => {


        const grouped = _(result)
                        .groupBy('bbl');

        const grouped2 = _(result)
                        .groupBy('bbl')
                        .mapKeys((v,k) => {
                          console.log(v.length);
                          return v;
                        });



        // .groupBy(result, 'bbl')
        //
        // console.log(_.keys(grouped));
        //
        // const bbls = _.keys(grouped).map()


        // console.log(grouped.length);
        // console.log(typeof grouped);
        //                 //  .map(item => {
                        //    console.log(item);
                        //    return item;
                        //   });


        res.status(201).send(result);
      })
      .catch(error => res.status(400).send(error));
  }
};
