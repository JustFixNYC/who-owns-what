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
            areavalue,
            arealabel,
            typevalue,
            typelabel,
            geom,
            ST_Transform(ST_simplify(geom, 100), 4326) AS districts_geom
        FROM wow_districts_geom
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
        ORDER BY arealabel
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
