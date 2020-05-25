drop table if exists wow_bldgs cascade;

-- This is mainly used as an easy way to provide contact info on request, not a replacement
-- for cross-table analysis. Hence why the corpnames, businessaddrs, and ownernames are simplified
-- with JSON and such.
create table wow_bldgs as 

with deeds as (
	select 
    	m.documentid,
    	coalesce(m.docdate,m.recordedfiled) docdate,
    	m.docamount, 
    	l.bbl
	from real_property_master m
	left join real_property_legals l using(documentid)
	where docamount > 1 and doctype = any('{DEED,DEEDO}')
	order by docdate desc
),

firstdeeds as (
  select 
    d.bbl,
    first(d.documentid) documentid,
    first(d.docdate) docdate,
    first(d.docamount) docamount
  from deeds d
  group by bbl
)

select distinct on (registrations.bbl)
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
  rentstab.percentchange as rspercentchange,
  firstdeeds.documentid as lastsaleacrisid,
  firstdeeds.docdate as lastsaledate,
  firstdeeds.docamount as lastsaleamount
from hpd_registrations_with_contacts as registrations
left join (
  select bbl,
    count(case when violationstatus = 'Open' then 1 end) as opentotal,
    count(*) as total
  from hpd_violations
  group by bbl
) violations on (registrations.bbl = violations.bbl)
left join (
  select
    bbl,
    unitsres,
    yearbuilt,
    lat, lng
  from pluto_19v2
) pluto on (registrations.bbl = pluto.bbl)
left join (
  select
    bbl,
    count(*) as evictions
  from marshal_evictions_19
  where residentialcommercialind = 'RESIDENTIAL'
  group by bbl
) evictions on (registrations.bbl = evictions.bbl)
left join (
  select
    ucbbl,
    unitsstab2007,
    unitsstab2017,
    diff,
    percentchange
  from rentstab_summary
) rentstab on (registrations.bbl = rentstab.ucbbl)
left join firstdeeds on (registrations.bbl = firstdeeds.bbl);

create index on wow_bldgs (registrationid);
create index on wow_bldgs (bbl);
