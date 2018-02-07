DROP TABLE IF EXISTS wow_bldgs CASCADE;

-- This is mainly used as an easy way to provide contact info on request, not a replacement
-- for cross-table analysis. Hence why the corpnames, businessaddrs, and ownernames are simplified
-- with JSON and such.
CREATE TABLE wow_bldgs
AS SELECT DISTINCT ON (registrations.bbl) 
  registrations.*,
  coalesce(violations.total, 0)::int as totalviolations,
  coalesce(violations.opentotal, 0)::int as openviolations,
  pluto.unitsres,
  pluto.yearbuilt,
  pluto.lat,
  pluto.lng,
  evictions.evictions,
  evictions.subsidy421a,
  evictions.subsidy421g,
  evictions.subsidyj51,
  rentstab.unitsstab2007 as rsunits2007,
  rentstab.unitsstab2016 as rsunits2016,
  rentstab.diff as rsdiff,
  rentstab.percentchange as rspercentchange,
  justfix_users.__v IS NOT NULL as hasjustfix
FROM hpd_registrations_with_contacts AS registrations
LEFT JOIN (
  SELECT bbl,
    count(CASE WHEN violationstatus = 'Open' THEN 1 END) as opentotal,
    count(*) as total
  FROM hpd_violations
  GROUP BY bbl
) violations ON (registrations.bbl = violations.bbl)
LEFT JOIN (
  SELECT
    bbl,
    unitsres,
    yearbuilt,
    lat, lng
  FROM pluto_17v1
) pluto ON (registrations.bbl = pluto.bbl)
LEFT JOIN (
  SELECT
    bin,
    evictions,
    subsidy421a,
    subsidy421g,
    subsidyj51
  FROM evictions
) evictions ON (registrations.bin = evictions.bin)
LEFT JOIN (
  SELECT
    ucbbl,
    unitsstab2007,
    unitsstab2016,
    diff,
    percentchange
  FROM rentstab_summary
) rentstab ON (registrations.bbl = rentstab.ucbbl)
LEFT JOIN justfix_users ON (registrations.bbl = justfix_users.bbl);


create index on wow_bldgs (registrationid);
create index on wow_bldgs (bbl);
create index on wow_bldgs (bin);
