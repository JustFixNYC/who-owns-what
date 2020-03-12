with evictions_by_bbl as (
	select 
		bbl,
		count(*) as evictions
	from marshal_evictions_19
	where bbl is not null
	and residentialcommercialind = any('{R, Residential, RESIDENTIAL}')
	group by bbl
),
dev_stats as (
    select 
        development,
        sum(evictions) dev_evictions,
        sum(unitsres) dev_unitsres
    from "nycha_developments_TEMPORARY"
    left join evictions_by_bbl using(bbl)
    left join pluto_19v2 using(bbl)
    group by development 
)

select 
	t.bbl,
	t.development,
	d.dev_evictions,
	d.dev_unitsres
from "nycha_developments_TEMPORARY" t
left join dev_stats d using(development)