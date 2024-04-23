-- The table `wow_landlords` is created starting from
-- `landlords_to_standardize.sql` to getting a contact from hpd
-- registration/contacts for each bbl/registration, then standardizing their
-- business addresses in `standardize.py`. Now we can use that table to join
-- with itself to create all the connections (edges) between contacts (nodes)
-- based on matching names and business addresses (details inline below). Then
-- we also use those matching critera to set a weight representing our
-- confidence in the connections that will be used later by the algorithm
-- splitting the intial connected components. This query is called in
-- "portfoliograph/graph.py" where the data gets translated into graph network.
-- in `graph.py`.


-- http://blog.scoutapp.com/articles/2016/07/12/how-to-make-text-searches-in-postgresql-faster-with-trigram-similarity
-- http://www.postgresonline.com/journal/archives/169-Fuzzy-string-matching-with-Trigram-and-Trigraphs.html

CREATE EXTENSION IF NOT EXISTS pg_trgm;


drop table if exists landlords_grouped;
create temporary table if not exists landlords_grouped as (
	select 
		row_number() over () as nodeid,
		name,
		bizaddr,
		bizhousestreet,
		bizapt,
		regexp_replace(bizapt, '\D','','g') as bizaptnum,
		bizzip,
		array_agg(bbl) as bbls
	from wow_landlords
	group by name, bizaddr, bizhousestreet, bizapt, bizaptnum, bizzip
);

create index on landlords_grouped (nodeid);
create index on landlords_grouped (name);
create index on landlords_grouped (bizaddr);
create index on landlords_grouped (bizzip);
create index on landlords_grouped (bizhousestreet, bizaptnum);
create index on landlords_grouped using gin(bizhousestreet gin_trgm_ops);

drop table if exists landlords_with_connections;
create table if not exists landlords_with_connections as
with matched_names as (
	-- In general we are less confident in name matches, so only match if there
	-- is also a partial match on bizaddr. We require matched zipcode, use
	-- similarity on number and street name, and compare only the numbers from
	-- the apt field since apt values aren't covered by geocoder
	-- standardization.
    select
        orig.nodeid,
        matched.nodeid as match_nodeid,
        coalesce(similarity(orig.bizhousestreet, matched.bizhousestreet), 0) as bizhousestreet_similarity,
		coalesce((orig.bizaptnum = matched.bizaptnum)::int::numeric, 0) as bizaptnum_similarity
    from landlords_grouped as orig
    full join landlords_grouped as matched using(name)
    where orig.nodeid != matched.nodeid
	  and orig.bizzip = matched.bizzip
	  and (
		similarity(orig.bizhousestreet, matched.bizhousestreet) > 0.9
		OR (
			similarity(orig.bizhousestreet, matched.bizhousestreet) > 0.8 
			AND (orig.bizaptnum = matched.bizaptnum)
		)
	  )

), matched_names_agg as (
	-- Since we are slightly less confident in name matches, we start with a
	-- lower base and combine score for matching parts of the address
	select
		nodeid, 
		json_agg(
			json_build_object(
				'nodeid', match_nodeid, 
				'weight', (bizhousestreet_similarity + (bizaptnum_similarity * 0.5) + 1)::numeric)
		) as name_match_info
	from matched_names
    group by nodeid

), matched_bizaddrs as (
	-- Allow matches if exact on house number, street name, zipcode, and the
	-- numbers within the apt field. This allows matches when the only
	-- difference is "unit 12" vs "suite 12" or it is missing entirely, since
	-- the geocoder standardization can't be applied to apt and these minor
	-- differences or missing values are common.
    select
        orig.nodeid,
        matched.nodeid as match_nodeid,
        coalesce(similarity(orig.name, matched.name), 0)::numeric as name_similarity
    from landlords_grouped as orig
    full join landlords_grouped as matched 
		ON orig.bizhousestreet = matched.bizhousestreet
		  AND (orig.bizaptnum = matched.bizaptnum OR orig.bizaptnum = '' OR matched.bizaptnum = '')
		  AND orig.bizzip = matched.bizzip
    where orig.nodeid != matched.nodeid

), matched_bizaddrs_agg as (
	-- Since we are more confident aobut exact biz address matches, we start
	-- with a higher base weight and add on a bonus for similarity of names. 
	select
		nodeid,
		json_agg(
			json_build_object('nodeid', match_nodeid, 'weight', (name_similarity + 2)::numeric)
		) as bizaddr_match_info
	from matched_bizaddrs
    group by nodeid
)
select
	nodeid,
	name,
	bizaddr,
	bbls,
	n.name_match_info,
	b.bizaddr_match_info
from landlords_grouped as l
left join matched_names_agg as n using(nodeid)
left join matched_bizaddrs_agg as b using(nodeid)
order by nodeid;

select * from landlords_with_connections;