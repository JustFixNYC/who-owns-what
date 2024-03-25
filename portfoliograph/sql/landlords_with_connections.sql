-- The table `wow_landlords` is created from `select_hpd_contacts_addrs.sql` by
-- getting a contact from hpd registration/contacts for each bbl/registration,
-- then standardizing their business addresses in `standardize.py`. Now we can
-- use that table to join with itself and create all the connections where there
-- are exact mathes on name or business address. Once there is an exact match on
-- one of these fields (eg. name), the other one (eg. bizaddr) is compared with
-- string similarity for a match score for our confidence in the connection to
-- be used for edge weights in the graph. The result of this is used to build
-- the graph network in `graph.py`.


-- http://blog.scoutapp.com/articles/2016/07/12/how-to-make-text-searches-in-postgresql-faster-with-trigram-similarity
-- http://www.postgresonline.com/journal/archives/169-Fuzzy-string-matching-with-Trigram-and-Trigraphs.html

CREATE EXTENSION IF NOT EXISTS pg_trgm;


drop table if exists landlords_grouped;
create temporary table if not exists landlords_grouped as (
	select 
		row_number() over () as nodeid,
		name,
		bizaddr,
		array_agg(bbl) as bbls
	from wow_landlords
	group by name, bizaddr
);

create index on landlords_grouped (nodeid);
create index on landlords_grouped (name);
create index on landlords_grouped (bizaddr);
create index on landlords_grouped using gin(bizaddr gin_trgm_ops);


with matched_names as (
    select
        orig.nodeid,
        matched.nodeid as match_nodeid,
        -- In general we are less onfident in name matches, so lower base score
        similarity(orig.bizaddr, matched.bizaddr) * 2 + 0.5 as match_score
    from landlords_grouped as orig
    full join landlords_grouped as matched using(name)
    where orig.nodeid != matched.nodeid

), matched_names_agg as (
	select
		nodeid, 
		json_agg(
			json_build_object('nodeid', match_nodeid, 'weight', match_score)
		) as name_match_info
	from matched_names
    group by nodeid

), matched_bizaddrs as (
    select
        orig.nodeid,
        matched.nodeid as match_nodeid,
        -- In general we are more onfident in address matches, so high base score
        similarity(orig.name, matched.name) + 2 as match_score
    from landlords_grouped as orig
    full join landlords_grouped as matched using(bizaddr)
    where orig.nodeid != matched.nodeid

), matched_bizaddrs_agg as (
	select
		nodeid,
		json_agg(
			json_build_object('nodeid', match_nodeid, 'weight', match_score)
		) as bizaddr_match_info
	from matched_bizaddrs
    group by nodeid
)
select *
from landlords_grouped
left join matched_names_agg using(nodeid)
left join matched_bizaddrs_agg using(nodeid)
order by nodeid;
