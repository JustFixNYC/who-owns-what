-- This query is run on the separate OCA database, and the results are 
-- uploaded into the tables on the main database

SELECT
    a.bbl,
    TO_CHAR(i.fileddate, 'YYYY-MM') AS month,
    count(distinct indexnumberid) AS evictionfilings
FROM oca_index AS i
LEFT JOIN oca_addresses AS a USING(indexnumberid)
LEFT JOIN pluto_21v4 AS p USING(bbl)
WHERE i.fileddate < '2017-01-01'
    AND i.classification = any('{Holdover,Non-Payment}') 
    AND i.propertytype = 'Residential'
    AND a.bbl IS NOT NULL
    AND p.unitsres > 10
GROUP BY a.bbl, month;
