-- Grab the graph json object that corresponds 
-- to the portfolio of the search address: 
WITH PORTFOLIO_GRAPH AS (
	SELECT 
		%(bbl)s as BBL,
		GRAPH
	FROM WOW_PORTFOLIOS
	WHERE %(bbl)s = ANY(BBLS)
	LIMIT 1
)

-- Select a subset of WOW_BLDGS that only contains
-- BBLs within the same portfolio
SELECT 
	WOW_BLDGS_new_temp.*,
	GRAPH
FROM WOW_BLDGS_new_temp
LEFT JOIN PORTFOLIO_GRAPH USING(BBL)
WHERE BBL = ANY(
	SELECT UNNEST(BBLS)
	FROM WOW_PORTFOLIOS
	WHERE %(bbl)s = ANY(BBLS)
);