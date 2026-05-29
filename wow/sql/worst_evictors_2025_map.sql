SELECT
    citywide_rank,
    ll_name,
    ll_slug,
    bbl,
    address,
    borough,
    zip,
    lat,
    lng,
    units_res
FROM worst_evictors_2025_map_points
WHERE (%(ll_slug)s IS NULL OR %(ll_slug)s = '' OR ll_slug = %(ll_slug)s)
ORDER BY citywide_rank ASC, bbl ASC;
