const knex = require('../services/db');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenum,
        streetname = req.query.streetname,
        boro = req.query.boro;

    let registrationSubQuery = knex.select('registrationid')
      .from('hpd_registrations_grouped_by_bbl')
      .where({
        housenumber: housenumber,
        streetname: streetname,
        boro: boro
      })
      .as('r');

    let query = () => {
      return knex.select(
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
    };

    query()
      .then(result => res.status(201).send(result))
      .catch(error => res.status(400).send(error));
  }
};
