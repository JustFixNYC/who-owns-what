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
  rentstab.unitsstab2007 as rsunits2007,
  rentstab.unitsstab2017 as rsunits2017,
  rentstab.diff as rsdiff,
  rentstab.percentchange as rspercentchange
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
  FROM pluto_18v1
) pluto ON (registrations.bbl = pluto.bbl)
LEFT JOIN (
  SELECT
    bbl,
    count(*) as evictions
  FROM marshal_evictions_17
  GROUP BY bbl
) evictions ON (registrations.bbl = evictions.bbl)
LEFT JOIN (
  SELECT
    ucbbl,
    unitsstab2007,
    unitsstab2017,
    diff,
    percentchange
  FROM rentstab_summary
) rentstab ON (registrations.bbl = rentstab.ucbbl);

create index on wow_bldgs (registrationid);
create index on wow_bldgs (bbl);
