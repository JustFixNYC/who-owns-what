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
),

rentstab as (
  select
    ucbbl,
    coalesce(unitsstab2007, 0) rsunits2007,
    coalesce(uc2020, 0) rsunitslatest,
    coalesce(uc2020, 0) - coalesce(unitsstab2007, 0) rsdiff
  from rentstab_summary
  left join rentstab_v2 using(ucbbl)
),

complaints as (
  select 
    bbl, 
    sum(counttotalcomplaints) as totalcomplaints, 
    sum(countrecentcomplaints) as recentcomplaints,
    json_agg(
        json_build_object('type',complainttype,'count',countrecentcomplaints) 
        order by countrecentcomplaints desc) 
        filter (where countrecentcomplaints > 0) recentcomplaintsbytype
  from 
    -- ----------
    -- For every bbl, grab frequency of complaints by type 
    -- ----------
    (
        select 
            bbl, 
            case 
                when majorcategory = any('{UNSANITARY CONDITION,GENERAL}') then minorcategory
                else majorcategory end 
            as complainttype,
            count(*) filter (where h.receiveddate > CURRENT_DATE - '3 YEARS'::INTERVAL) as countrecentcomplaints,
            count(*) counttotalcomplaints
        from hpd_complaints h
        left join hpd_complaint_problems using(complaintid)
        group by bbl, complainttype
    ) subtable
    -- ----------
  group by bbl
)

select distinct on (registrations.bbl)
  registrations.*,
  coalesce(violations.total, 0)::int as totalviolations,
  coalesce(violations.opentotal, 0)::int as openviolations,
  coalesce(complaints.totalcomplaints, 0)::int as totalcomplaints,
  coalesce(complaints.recentcomplaints, 0)::int as recentcomplaints,
  complaints.recentcomplaintsbytype,
  pluto.unitsres,
  pluto.yearbuilt,
  pluto.lat,
  pluto.lng,
  evictions.evictions,
  rentstab.rsunits2007,
  rentstab.rsunitslatest,
  -- Year of most recent rent stab data:
  2020 as rsunitslatestyear,
  rentstab.rsdiff,
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
  from marshal_evictions_all
  where residentialcommercialind = 'RESIDENTIAL'
  group by bbl
) evictions on (registrations.bbl = evictions.bbl)
left join rentstab on (registrations.bbl = rentstab.ucbbl)
left join complaints on (registrations.bbl = complaints.bbl)
left join firstdeeds on (registrations.bbl = firstdeeds.bbl);

create index on wow_bldgs (registrationid);
create index on wow_bldgs (bbl);
