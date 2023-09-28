
drop table if exists single_registration_contacts;
create temporary table if not exists single_registration_contacts as (
	WITH landlord_contacts AS (
		SELECT DISTINCT
	        upper(concat_ws(' ', firstname, lastname)) AS name,
            upper(concat_ws(', ',
            	concat_ws(' ', businesshousenumber, businessstreetname, businessapartment),
            	concat_ws(' ', businesscity, businessstate)
            )) as bizaddr,
	        hpd_contacts.registrationid,
			bbl,
			registrationenddate,
			lastregistrationdate,
	        hpd_contacts.type
	    FROM hpd_contacts
	    INNER JOIN hpd_registrations
	        ON hpd_contacts.registrationid = hpd_registrations.registrationid
	    WHERE
	        type = ANY('{{HeadOfficer, IndividualOwner, CorporateOwner, JointOwner}}')
	        AND (businesshousenumber IS NOT NULL OR businessstreetname IS NOT NULL)
	        AND LENGTH(CONCAT(businesshousenumber, businessstreetname)) > 2
	        AND (firstname IS NOT NULL OR lastname IS NOT NULL)
	),
    landlord_contacts_ordered as (
        SELECT *
        FROM landlord_contacts
        ORDER BY 
	        bbl, 
		    -- For each BBL, we grab the most recent registrationid we have on file.
		    -- We define 'most recent' to mean a registration with the most recent
		    -- expiration date and, if there is a tie, most recent non-null registration date
		    registrationenddate DESC, lastregistrationdate DESC NULLS LAST,
            -- Then, we prioritize certain owner types over others:
            ARRAY_POSITION(
                ARRAY['IndividualOwner','HeadOfficer','JointOwner','CorporateOwner'],
                landlord_contacts.type
            ),
            -- Finally, we order by landlord name, just to ensure sorting is deterministic:
            landlord_contacts.name
    )
    SELECT
	    bbl,
	    FIRST(registrationid) AS registrationid,
	    FIRST(name) AS name,
	    FIRST(bizaddr) as bizaddr
	FROM landlord_contacts_ordered
	GROUP BY bbl

);

create index on single_registration_contacts (name, bizaddr);


drop table if exists contacts_grouped;
create temporary table if not exists contacts_grouped as (
	select 
		row_number() over () as nodeid,
		name, 
		bizaddr, 
		array_agg(registrationid) as registrationids,
		array_agg(bbl) as bbls
	from single_registration_contacts
	group by name, bizaddr
);

create index on contacts_grouped (nodeid);
create index on contacts_grouped (name);
create index on contacts_grouped (bizaddr);


drop table if exists hpd_contacts_with_connections;
create table if not exists hpd_contacts_with_connections as (
    with matched_names as (
            select
                orig.nodeid,
                array_remove(array_agg(matched.nodeid), orig.nodeid) as name_matches
            from contacts_grouped as orig
            full join contacts_grouped as matched using(name)
            group by orig.nodeid
        ),
        matched_bizaddrs as (
            select
                orig.nodeid,
                array_remove(array_agg(matched.nodeid), orig.nodeid) as bizaddr_matches
            from contacts_grouped as orig
            full join contacts_grouped as matched using(bizaddr)
            group by orig.nodeid
        )
    select *
    from contacts_grouped
    left join matched_names using(nodeid)
    left join matched_bizaddrs using(nodeid)
    order by nodeid
);
