SELECT 
    value::timestamp AS last_updated
FROM dataset_tracker
WHERE key = %(dataset)s
