// Set up DB instance
const Promise = require('bluebird');
const pgp = require('pg-promise')({ promiseLib: Promise });
const db = pgp(process.env.DATABASE_URL);

const queryContacts = (bbl) => {
  return db.any(`
    SELECT
      businesshousenumber as bisnum,
      businessstreetname as bisstreet,
      businessapartment as bisapt,
      businesszip as biszip,
      firstname,
      lastname,
      corporationname,
      registrationcontacttype,
      hpd_contacts.registrationid,
      userreg.bbl
    FROM
      hpd_contacts
    INNER JOIN (
      SELECT
        registrationid, bbl
      FROM
        hpd_registrations_grouped_by_bbl
      WHERE
        bbl = $1
    ) AS userreg
    ON (hpd_contacts.registrationid = userreg.registrationid)
  `, bbl);
};

module.exports = {

  queryContacts,

  queryAddress: (bbl) => db.func('get_assoc_addrs_from_bbl', bbl)

};
