
-- make sure there aren't any outliers in businessaddrs
select
  businesshousenumber, businessstreetname, businesszip,
  array_length(uniqregids, 1)
from hpd_business_addresses
order by array_length(uniqregids, 1) desc;

-- get a better sense for how buildings are arranged here
select
  count(*),
  count(distinct bbl),
  count(distinct bin)
from wow_bldgs;

-- leaving the # issues for a later date
select corpnames, businessaddrs from wow_bldgs where '# #  #' = ANY(businessaddrs);
