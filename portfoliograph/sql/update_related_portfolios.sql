-- Once the wow_portfolios table has been populated, fill in the column for
-- related portfolios bbls. The "orig_id" indicates the original connected
-- component from the graph before any splitting, using this we can find all of
-- the sibling portfolios created by splitting from the same original connected
-- component. We take just one bbls from each of the related ones (excluding the
-- given portfolio itself) so that we can easily link to the portfolios on wow.

UPDATE wow_portfolios AS x
	SET relatedportfoliosbbls = array_remove(y.relatedportfoliosbbls, x.bbls[1])
	FROM (
		SELECT 
			orig_id, 
			array_agg(bbls[1]) AS relatedportfoliosbbls
		FROM wow_portfolios
		GROUP BY orig_id
	) AS y
	WHERE x.orig_id = y.orig_id;
