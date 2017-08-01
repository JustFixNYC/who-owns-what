const knex = require('../services/db'),
      geo = require('../services/geoclient');

module.exports = {
  query: (req, res) => {

    let housenumber = req.query.housenumber,
        streetname = req.query.streetname,
        boro = req.query.boro;

    const queryByAddr = () => {
      return knex.select('registrationid')
        .from('hpd_registrations_grouped_by_bbl')
        .where({
          housenumber: housenumber,
          streetname: streetname,
          boro: boro
        })
        .as('r');
    };

    const queryByBBL = (bbl) => {
      return knex.select('registrationid')
        .from('hpd_registrations_grouped_by_bbl')
        .where({
          bbl: bbl
        })
        .as('r');
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
        'hpd_contacts.registrationid'
      )
      .from('hpd_contacts')
      .innerJoin(
        registrationSubQuery,
        'r.registrationid',
        'hpd_contacts.registrationid'
      );
    }

    geo.request(housenumber, streetname, boro)
      .then(geo => {

        // console.dir(geo.address, {depth: null, colors: true});

        // not sucessful
        if(geo.address.geosupportReturnCode !== '00') {
          return queryContacts(queryByAddr());
        } else {
          // future: include geoclient data with response as well
          return queryContacts(queryByBBL(geo.address.bbl))
        }
      })
      .then(result => res.status(200).send(result))
      .catch(err => {
        console.log('err', err);
        res.status(400).send(err);
      });

  }
};
