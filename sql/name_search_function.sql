-- One grand function to rule them all
-- This takes in a given bbl, and grabs the regid (btw there are more regids than bbls, so a bbl could have multiple regids?)
-- Using that, we use a few different functions that follow a (regid -> regids) convention
-- They use things like shared business addresses and fuzzy name lookup. This UNIONs those queries, merges them,
-- And then populates with relevant address info!
DROP FUNCTION IF EXISTS get_assoc_addrs_from_name(text, text);

CREATE OR REPLACE FUNCTION get_assoc_addrs_from_name(_firstname text, _lastname text)
RETURNS SETOF wow_bldgs AS $$
  SELECT bldgs.* FROM wow_bldgs AS bldgs
  INNER JOIN (
    SELECT unnest(uniqregids) AS regid FROM get_regids_from_name(_firstname, _lastname)
  ) assocregids ON (bldgs.registrationid = assocregids.regid);
$$ LANGUAGE SQL;
