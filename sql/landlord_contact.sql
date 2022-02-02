-- This is the table to query landlord contact information for JustFix letters of complaint
-- The convention is to use the name of the head officer and the buisness address from the
-- corporate owner.
CREATE TABLE hpd_landlord_contact_temporary
as SELECT
  registrations.housenumber,
  registrations.streetname,
  registrations.zip,
  registrations.boro,
  registrations.registrationid,
  registrations.bbl,
  registrations.bin,
  contacts.businessaddr,
  contacts.ownername
FROM hpd_registrations AS registrations
LEFT JOIN (
  SELECT
    (
      array_agg(
        nullif(concat_ws(' ', businesshousenumber, businessstreetname, businessapartment, businesszip), '   ')
      )
      FILTER (
        WHERE (
          type = 'CorporateOwner' AND
          (businesshousenumber <> '') IS TRUE AND
          (businessstreetname <> '') IS TRUE AND
          (businesszip <> '') IS TRUE
        )
      )
    )[1] AS businessaddr,

    (
      array_agg(
        firstname || ' ' || lastname
      )
      FILTER (
        WHERE type = 'HeadOfficer' OR  type = 'IndividualOwner' AND
        firstname IS NOT NULL AND
        lastname IS NOT NULL
      )
    )[1] AS ownername,
    registrationid
  FROM hpd_contacts
  GROUP BY registrationid
) contacts ON (registrations.registrationid = contacts.registrationid);

DROP TABLE IF EXISTS hpd_landlord_contact;
alter table hpd_landlord_contact_temporary rename to hpd_landlord_contact;

create index on hpd_landlord_contact (bbl);
