-- This generates all the geojson used for the district selection map, both the
-- district shapes and the labels. This table can be built once and doesn't need
-- updates. We still need to figure out the system for that, since all other
-- tables are always rebuilt with the relevant job (wow, signature, etc.).

-- Note: It's important that this is generated all at once like this so that the
-- feature IDs are unique across all district types, and that match between the
-- districts and the label points, since we'll be copying features out to a
-- separate source with user selections and may want to link actions on
-- districts to the labels using id. 

CREATE TABLE wow_districts_geojson AS (
    WITH all_districts AS (
        SELECT
            row_number() OVER () AS id,
            geom_id AS areavalue,
            COALESCE(geom_name, geom_id) AS arealabel,
            geom_type AS typevalue,
            CASE 
                WHEN geom_type = 'borough' THEN 'Borough'
                WHEN geom_type = 'community_board' THEN 'Community District'
                WHEN geom_type = 'cong_dist' THEN 'Congressional District'
                WHEN geom_type = 'coun_dist' THEN 'City Council District'
                WHEN geom_type = 'nta' THEN 'Neighborhood'
                WHEN geom_type = 'assem_dist' THEN 'State Assembly District'
                WHEN geom_type = 'stsen_dist' THEN 'State Senate District'
                WHEN geom_type = 'zipcode' THEN 'Zip Code'
            END as typelabel,
            geom,
            ST_Transform(ST_simplify(geom, 100), 4326) AS districts_geom
        FROM pluto_latest_geom
        WHERE geom_type != 'census_tract'
    ), district_polygons AS (
        SELECT id, (ST_Dump(geom)).geom AS geom 
        FROM all_districts
    ), district_labels AS (
        SELECT DISTINCT ON (id) 
            id,
            ST_AsText(ST_Transform((ST_MaximumInscribedCircle(geom)).center, 4326)) AS labels_geom
        FROM district_polygons
        ORDER BY id, ST_Area(geom) DESC
    ), districts_and_labels AS (
        SELECT 
            id,	
            typevalue AS "typeValue",
            typelabel AS "typeLabel",
            areavalue AS "areaValue",
            arealabel AS "areaLabel",
            districts_geom,
            labels_geom
        FROM all_districts
        LEFT JOIN district_labels USING(id)
    ), features AS (
        SELECT 
            "typeValue", 
            "typeLabel",
            jsonb_build_object(
            'type',       'Feature',
            'id',         id,
            'geometry',   ST_AsGeoJSON(districts_geom)::jsonb,
            'properties', to_jsonb(districts_and_labels) - 'id' - 'districts_geom' - 'labels_geom'
        ) AS districts_feature,
            jsonb_build_object(
            'type',       'Feature',
            'id',         id,
            'geometry',   ST_AsGeoJSON(labels_geom)::jsonb,
            'properties', to_jsonb(districts_and_labels) - 'id' - 'districts_geom' - 'labels_geom' - 'typeValue' - 'typeLabel' - 'areaValue'
        ) AS labels_feature
        FROM districts_and_labels
    )
    SELECT
        "typeValue", 
        "typeLabel",
        jsonb_build_object(
        'type',     'FeatureCollection',
        'features', jsonb_agg(features.districts_feature)
        ) AS districts_geojson, 
        jsonb_build_object(
        'type',     'FeatureCollection',
        'features', jsonb_agg(features.labels_feature)
        ) AS labels_geojson
    FROM features
    GROUP BY "typeValue", "typeLabel"
);
