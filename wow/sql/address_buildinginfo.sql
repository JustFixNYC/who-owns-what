WITH DEVS AS (
	SELECT 
		DISTINCT DEVELOPMENT 
	FROM NYCHA_BBLS_18
	WHERE DEVELOPMENT !~* 'POLICE SERVICE AREA'
	AND BBL = %(bbl)s
),

DEV_BBLS AS (
	SELECT DISTINCT ON (BBL)
		N.DEVELOPMENT,
		N.BBL,
		P.UNITSRES, 
		E.EVICTIONS
	FROM NYCHA_BBLS_18 N
	LEFT JOIN PLUTO_20V8 P USING(BBL)
	LEFT JOIN (
		SELECT BBL, COUNT(*) EVICTIONS FROM MARSHAL_EVICTIONS_ALL 
		WHERE RESIDENTIALCOMMERCIALIND = 'RESIDENTIAL'
		GROUP BY BBL
	) E USING(BBL)
	WHERE DEVELOPMENT IN (SELECT DEVELOPMENT FROM DEVS)
),

NYCHA_STATS AS (
    SELECT 
        %(bbl)s::TEXT as BBL,
        STRING_AGG(DISTINCT DEVELOPMENT, ' / ') NYCHA_DEVELOPMENT,
        SUM(EVICTIONS) NYCHA_DEV_EVICTIONS,
        SUM(UNITSRES) NYCHA_DEV_UNITSRES
    FROM DEV_BBLS
), 

HPD_REG AS (
	SELECT 
		BBL,
		1 AS HAS_HPD_REG
	FROM HPD_REGISTRATIONS
	WHERE BBL = %(bbl)s
	LIMIT 1
)

-- PLUTO Building Info Query for when BBL is not found.
SELECT 
	ADDRESS FORMATTED_ADDRESS,
	SPLIT_PART( ADDRESS, ' ' , 1 ) HOUSENUMBER,
	SUBSTR(ADDRESS, STRPOS(ADDRESS, ' ') + 1) STREETNAME,
    BLDGCLASS,
    CASE 
      WHEN BOROUGH = 'MN' THEN 'MANHATTAN'
      WHEN BOROUGH = 'BX' THEN 'BRONX' 
      WHEN BOROUGH = 'BK' THEN 'BROOKLYN' 
      WHEN BOROUGH = 'QN' THEN 'QUEENS' 
      WHEN BOROUGH = 'SI' THEN 'STATEN ISLAND' 
      ELSE '' END BORO,
	COALESCE(HAS_HPD_REG, 0) AS HAS_HPD_REG,
	LATITUDE,
	LONGITUDE,
    NYCHA_DEVELOPMENT,
    NYCHA_DEV_EVICTIONS,
    NYCHA_DEV_UNITSRES
   FROM PLUTO_20V8
   LEFT JOIN NYCHA_STATS USING(BBL)
   LEFT JOIN HPD_REG USING(BBL)
   WHERE BBL = %(bbl)s
