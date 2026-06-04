SELECT
    bbl,
    address,
    borough,
    zip,
    lat,
    lng,
    units_res,
    rs_units
FROM rent_stabilized_map_points
ORDER BY bbl ASC;
