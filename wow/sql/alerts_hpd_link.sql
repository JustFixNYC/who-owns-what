SELECT DISTINCT
  BBL,
  CASE 
    WHEN hpdbuildingid is not null AND hpdbuildings = 1
    	THEN concat('https://hpdonline.nyc.gov/hpdonline/building/', hpdbuildingid)
    ELSE
        concat(
          'https://hpdonline.nyc.gov/hpdonline/building/search-results', 
          '?boroId=', substr(bbl, 1, 1),
          '&block=', substr(bbl, 2, 5), 
          '&lot=', substr(bbl, 7, 4)
        )
    END AS HPD_LINK
FROM WOW_BLDGS
WHERE BBL = %(bbl)s
