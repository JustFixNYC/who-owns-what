-- Once the wow_portfolios table has been populated, fill in the column for
-- related portfolios bbls. The "orig_id" indicates the original connected
-- component from the graph before any splitting, using this we can find all of
-- the sibling portfolios created by splitting from the same original connected
-- component. We take just one bbls from each of the related ones (excluding the
-- given portfolio itself) so that we can easily link to the portfolios on wow.

update wow_portfolios as x
set relatedportfoliosbbls = array_remove(y.relatedportfoliosbbls, x.bbls[1])
from (
	select 
        orig_id, 
        array_agg(bbls[1]) as relatedportfoliosbbls
	from wow_portfolios
	group by orig_id
) as y
where x.orig_id = y.orig_id;
