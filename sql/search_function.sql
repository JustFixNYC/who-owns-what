-- One grand function to rule them all
-- This takes in a given bbl, and grabs the regid (btw there are more regids than bbls, so a bbl could have multiple regids?)
-- Using that, we use a few different functions that follow a (regid -> regids) convention
-- They use things like shared business addresses and fuzzy name lookup. This UNIONs those queries, merges them,
-- And then populates with relevant address info!
DROP FUNCTION IF EXISTS get_assoc_addrs_from_bbl(text);

CREATE OR REPLACE FUNCTION get_assoc_addrs_from_bbl(_bbl text)
RETURNS SETOF wow_bldgs AS $$
  SELECT bldgs.* FROM wow_bldgs AS bldgs
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
