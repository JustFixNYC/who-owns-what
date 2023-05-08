-- One grand function to rule them all
-- This takes in a given bbl, and grabs the regid (btw there are more regids than bbls, so a bbl could have multiple regids?)
-- Using that, we use a few different functions that follow a (regid -> regids) convention
-- They use things like shared business addresses and fuzzy name lookup. This UNIONs those queries, merges them,
-- And then populates with relevant address info!
DROP FUNCTION IF EXISTS get_assoc_addrs_from_bbl(text);

CREATE OR REPLACE FUNCTION get_assoc_addrs_from_bbl(_bbl text)
RETURNS TABLE (
  housenumber text,
  streetname text,
  zip text,
  boro text,
  registrationid integer,
  lastregistrationdate date,
  registrationenddate date,
  bbl char(10),
  bin char(7),
  corpnames text[],
  businessaddrs text[],
  ownernames json,
  allcontacts jsonb,
  totalviolations integer,
  openviolations integer,
  totalcomplaints integer,
  recentcomplaints integer,
  recentcomplaintsbytype json,
  unitsres integer,
  yearbuilt smallint,
  council smallint,
  lat double precision,
  lng double precision,
  evictions bigint,
  rsunits2007 integer,
  rsunitslatest integer,
  rsunitslatestyear integer,
  rsdiff integer,
  yearstartedj51 smallint,
  yearstarted421a smallint,
  lastsaleacrisid text,
  lastsaledate date,
  lastsaleamount bigint,
  evictionfilings integer
) AS $$
  SELECT 
    bldgs.housenumber,
    bldgs.streetname,
    bldgs.zip,
    bldgs.boro,
    bldgs.registrationid,
    bldgs.lastregistrationdate,
    bldgs.registrationenddate,
    bldgs.bbl,
    bldgs.bin,
    bldgs.buildingid,
    bldgs.corpnames,
    bldgs.businessaddrs,
    bldgs.ownernames,
    bldgs.allcontacts,
    bldgs.totalviolations,
    bldgs.openviolations,
    bldgs.totalcomplaints,
    bldgs.recentcomplaints,
    bldgs.recentcomplaintsbytype,
    bldgs.unitsres,
    bldgs.yearbuilt,
    bldgs.council,
    bldgs.lat,
    bldgs.lng,
    bldgs.evictions,
    bldgs.rsunits2007,
    bldgs.rsunitslatest,
    bldgs.rsunitslatestyear,
    bldgs.rsdiff,
    bldgs.yearstartedj51,
    bldgs.yearstarted421a,
    bldgs.lastsaleacrisid,
    bldgs.lastsaledate,
    bldgs.lastsaleamount,
    bldgs.evictionfilings
  FROM wow_bldgs AS bldgs
  INNER JOIN (
    (SELECT DISTINCT registrationid FROM wow_bldgs r WHERE r.bbl = _bbl) userreg
    LEFT JOIN LATERAL
    (
      SELECT
        unnest(anyarray_uniq(array_cat_agg(merged.uniqregids))) AS regid
      FROM (
        SELECT uniqregids FROM get_regids_from_regid_by_bisaddr(userreg.registrationid)
        UNION SELECT uniqregids FROM get_regids_from_regid_by_owners(userreg.registrationid)
      ) AS merged
    ) merged2 ON true
  ) assocregids ON (bldgs.registrationid = assocregids.regid);
$$ LANGUAGE SQL;
