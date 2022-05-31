-- For a given bbl, find the size of its
-- associated portfolio
SELECT ARRAY_LENGTH(BBLS,1) AS PORTFOLIO_SIZE
FROM WOW_PORTFOLIOS
WHERE %(bbl)s = ANY(BBLS)
LIMIT 1;
