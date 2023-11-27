-- wow_landlords table created from `select_hpd_contacts_addrs.sql` getting a
-- contact from hpd registration/contacts for each bbl/registration, then
-- standardizing their business addresses in `clean_hpd_contact_addrs.py` to
-- create the table `wow_landlords`. Now we can that table to join with itself
-- and create all the connections where there are identical names of business
-- addresses. The result of this, `wow_landlords_with_connections` can then be
-- used to build the graph network in `graph.py`.

drop table if exists landlords_grouped;
create temporary table if not exists landlords_grouped as (
	select 
		row_number() over () as nodeid,
		name, 
		bizaddr, 
		array_agg(registrationid) as registrationids,
		array_agg(bbl) as bbls
	from wow_landlords
	group by name, bizaddr
);

create index on landlords_grouped (nodeid);
create index on landlords_grouped (name);
create index on landlords_grouped (bizaddr);


with matched_names as (
        select
            orig.nodeid,
            array_remove(array_agg(matched.nodeid), orig.nodeid) as name_matches
        from landlords_grouped as orig
        full join landlords_grouped as matched using(name)
        group by orig.nodeid
    ),
    matched_bizaddrs as (
        select
            orig.nodeid,
            array_remove(array_agg(matched.nodeid), orig.nodeid) as bizaddr_matches
        from landlords_grouped as orig
        full join landlords_grouped as matched using(bizaddr)
        group by orig.nodeid
    )
select *
from landlords_grouped
left join matched_names using(nodeid)
left join matched_bizaddrs using(nodeid)
order by nodeid;
