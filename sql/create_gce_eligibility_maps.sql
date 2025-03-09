-- A Housing Data Coalition project of mapping Good Cause eligibility data
-- requires some aggregations of the BBL-level gce_eligiblity data for
-- displaying hexagons and various political districts.


-- Political Districts

CREATE TABLE gce_eligibility_nyad AS (
	WITH gce_district_values AS (
		SELECT
		    p.assem_dist::int AS assemdist,
		    COALESCE(SUM(unitsres), 0) :: integer AS unitsres,
		    COALESCE(SUM(post_hstpa_rs_units), 0) :: integer AS post_hstpa_rs_units,
		    COUNT(gce.*) :: integer AS bbls_count,
		    MAX(co_issued) :: date AS max_co_issued,
		    MIN(co_issued) :: date AS min_co_issued,
		    SUM(CASE WHEN eligible THEN unitsres ELSE 0 END) :: integer AS eligible_units_count,
		    SUM(CASE WHEN eligible THEN 1 ELSE 0 END) :: integer AS eligible_bbls_count
		FROM
		    gce_eligibility AS gce
		    LEFT JOIN pluto_latest_districts AS p USING(bbl)
		GROUP BY
		    p.assem_dist
		HAVING
		    count(gce.*) > 0
	)
	SELECT
		gce.*,
	    ST_Transform(d.geom, 4326) AS geom,
	    ST_X(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS longitude,
	    ST_Y(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS latitude,
	    ST_AsGeoJSON(ST_Transform(d.geom, 4326)) :: json as geom_json
	FROM gce_district_values AS gce
	LEFT JOIN nyad AS d USING(assemdist)
);


CREATE TABLE gce_eligibility_nycc AS (
	WITH gce_district_values AS (
		SELECT
		    p.coun_dist::int AS coundist,
		    COALESCE(SUM(unitsres), 0) :: integer AS unitsres,
		    COALESCE(SUM(post_hstpa_rs_units), 0) :: integer AS post_hstpa_rs_units,
		    COUNT(gce.*) :: integer AS bbls_count,
		    MAX(co_issued) :: date AS max_co_issued,
		    MIN(co_issued) :: date AS min_co_issued,
		    SUM(CASE WHEN eligible THEN unitsres ELSE 0 END) :: integer AS eligible_units_count,
		    SUM(CASE WHEN eligible THEN 1 ELSE 0 END) :: integer AS eligible_bbls_count
		FROM
		    gce_eligibility AS gce
		    LEFT JOIN pluto_latest_districts AS p USING(bbl)
		GROUP BY
		    p.coun_dist
		HAVING
		    count(gce.*) > 0
	)
	SELECT
		gce.*,
	    ST_Transform(d.geom, 4326) AS geom,
	    ST_X(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS longitude,
	    ST_Y(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS latitude,
	    ST_AsGeoJSON(ST_Transform(d.geom, 4326)) :: json as geom_json
	FROM gce_district_values AS gce
	LEFT JOIN nycc AS d USING(coundist)
);
	

CREATE TABLE gce_eligibility_nyss AS (
	WITH gce_district_values AS (
		SELECT
		    p.stsen_dist::int AS stsendist,
		    COALESCE(SUM(unitsres), 0) :: integer AS unitsres,
		    COALESCE(SUM(post_hstpa_rs_units), 0) :: integer AS post_hstpa_rs_units,
		    COUNT(gce.*) :: integer AS bbls_count,
		    MAX(co_issued) :: date AS max_co_issued,
		    MIN(co_issued) :: date AS min_co_issued,
		    SUM(CASE WHEN eligible THEN unitsres ELSE 0 END) :: integer AS eligible_units_count,
		    SUM(CASE WHEN eligible THEN 1 ELSE 0 END) :: integer AS eligible_bbls_count
		FROM
		    gce_eligibility AS gce
		    LEFT JOIN pluto_latest_districts AS p USING(bbl)
		GROUP BY
		    p.stsen_dist
		HAVING
		    count(gce.*) > 0
	)
	SELECT
		gce.*,
	    ST_Transform(d.geom, 4326) AS geom,
	    ST_X(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS longitude,
	    ST_Y(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS latitude,
	    ST_AsGeoJSON(ST_Transform(d.geom, 4326)) :: json as geom_json
	FROM gce_district_values AS gce
	LEFT JOIN nyss AS d USING(stsendist)
);


CREATE TABLE gce_eligibility_nycg AS (
	WITH gce_district_values AS (
		SELECT
		    p.cong_dist::int AS congdist,
		    COALESCE(SUM(unitsres), 0) :: integer AS unitsres,
		    COALESCE(SUM(post_hstpa_rs_units), 0) :: integer AS post_hstpa_rs_units,
		    COUNT(gce.*) :: integer AS bbls_count,
		    MAX(co_issued) :: date AS max_co_issued,
		    MIN(co_issued) :: date AS min_co_issued,
		    SUM(CASE WHEN eligible THEN unitsres ELSE 0 END) :: integer AS eligible_units_count,
		    SUM(CASE WHEN eligible THEN 1 ELSE 0 END) :: integer AS eligible_bbls_count
		FROM
		    gce_eligibility AS gce
		    LEFT JOIN pluto_latest_districts AS p USING(bbl)
		GROUP BY
		    p.cong_dist
		HAVING
		    count(gce.*) > 0
	)
	SELECT
		gce.*,
	    ST_Transform(d.geom, 4326) AS geom,
	    ST_X(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS longitude,
	    ST_Y(ST_Centroid(ST_Transform(d.geom, 4326))) :: double precision AS latitude,
	    ST_AsGeoJSON(ST_Transform(d.geom, 4326)) :: json as geom_json
	FROM gce_district_values AS gce
	LEFT JOIN nycg AS d USING(congdist)
);
	

CREATE INDEX index_wow_gce_eligibility_nyad_on_geom ON gce_eligibility_nyad USING GIST (geom);
CREATE INDEX index_wow_gce_eligibility_nycc_on_geom ON gce_eligibility_nycc USING GIST (geom);
CREATE INDEX index_wow_gce_eligibility_nyss_on_geom ON gce_eligibility_nyss USING GIST (geom);
CREATE INDEX index_wow_gce_eligibility_nycg_on_geom ON gce_eligibility_nycg USING GIST (geom);



-- Hexagons

CREATE TEMPORARY TABLE zoom_level_hexes AS (
	WITH map_bounds AS (
	        SELECT
	            MIN(ST_Y(ST_Transform(geom, 2263))) as south,
	            MAX(ST_Y(ST_Transform(geom, 2263))) as north,
	            MIN(ST_X(ST_Transform(geom, 2263))) as west,
	            MAX(ST_X(ST_Transform(geom, 2263))) as east
	        FROM
	            gce_eligibility
	)
    SELECT
        10 as zoom_level,
        ST_Transform(geom, 4326) as geom
    FROM
        ST_HexagonGrid(
            4800,
            ST_MakeEnvelope(
                (
                    SELECT
                        west
                    FROM
                        map_bounds
                ),
                (
                    SELECT
                        south
                    FROM
                        map_bounds
                ),
                (
                    SELECT
                        east
                    FROM
                        map_bounds
                ),
                (
                    SELECT
                        north
                    FROM
                        map_bounds
                ),
                2263
            )
        )
    UNION ALL
        (
            SELECT
                11 as zoom_level,
                ST_Transform(geom, 4326) as geom
            FROM
                ST_HexagonGrid(
                    2400,
                    ST_MakeEnvelope(
                        (
                            SELECT
                                west
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                south
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                east
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                north
                            FROM
                                map_bounds
                        ),
                        2263
                    )
                )
        )
    UNION ALL
        (
            SELECT
                12 as zoom_level,
                ST_Transform(geom, 4326) as geom
            FROM
                ST_HexagonGrid(
                    1200,
                    ST_MakeEnvelope(
                        (
                            SELECT
                                west
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                south
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                east
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                north
                            FROM
                                map_bounds
                        ),
                        2263
                    )
                )
        )
    UNION ALL
        (
            SELECT
                13 as zoom_level,
                ST_Transform(geom, 4326) as geom
            FROM
                ST_HexagonGrid(
                    600,
                    ST_MakeEnvelope(
                        (
                            SELECT
                                west
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                south
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                east
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                north
                            FROM
                                map_bounds
                        ),
                        2263
                    )
                )
        )
    UNION ALL
        (
            SELECT
                14 as zoom_level,
                ST_Transform(geom, 4326) as geom
            FROM
                ST_HexagonGrid(
                    300,
                    ST_MakeEnvelope(
                        (
                            SELECT
                                west
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                south
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                east
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                north
                            FROM
                                map_bounds
                        ),
                        2263
                    )
                )
        )
    UNION ALL
        (
            SELECT
                15 as zoom_level,
                ST_Transform(geom, 4326) as geom
            FROM
                ST_HexagonGrid(
                    150,
                    ST_MakeEnvelope(
                        (
                            SELECT
                                west
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                south
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                east
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                north
                            FROM
                                map_bounds
                        ),
                        2263
                    )
                )
        )
    UNION ALL
        (
            SELECT
                16 as zoom_level,
                ST_Transform(geom, 4326) as geom
            FROM
                ST_HexagonGrid(
                    75,
                    ST_MakeEnvelope(
                        (
                            SELECT
                                west
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                south
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                east
                            FROM
                                map_bounds
                        ),
                        (
                            SELECT
                                north
                            FROM
                                map_bounds
                        ),
                        2263
                    )
                )
        )
);

CREATE INDEX ON zoom_level_hexes USING GIST(geom);

CREATE TABLE gce_eligibility_hexes AS (
    SELECT
        zoom_level,
        zoom_level_hexes.geom AS geom,
        ST_X(ST_Centroid(zoom_level_hexes.geom)) :: double precision AS longitude,
        ST_Y(ST_Centroid(zoom_level_hexes.geom)) :: double precision AS latitude,
        ST_AsGeoJSON(zoom_level_hexes.geom) :: json as geom_json,
        COALESCE(SUM(unitsres), 0) :: integer AS unitsres,
        COALESCE(SUM(post_hstpa_rs_units), 0) :: integer AS post_hstpa_rs_units,
        COUNT(gce_eligibility.*) :: integer AS bbls_count,
        MAX(co_issued) :: date AS max_co_issued,
        MIN(co_issued) :: date AS min_co_issued,
        SUM(CASE WHEN eligible THEN unitsres ELSE 0 END) :: integer AS eligible_units_count,
        SUM(CASE WHEN eligible THEN 1 ELSE 0 END) :: integer AS eligible_bbls_count
    FROM
        zoom_level_hexes
        JOIN gce_eligibility ON ST_Within(gce_eligibility.geom, zoom_level_hexes.geom)
    GROUP BY
        zoom_level_hexes.zoom_level,
        zoom_level_hexes.geom
    HAVING
        count(gce_eligibility.*) > 0
);

CREATE INDEX index_gce_eligibility_hexes_on_geom ON gce_eligibility_hexes USING GIST(geom);
