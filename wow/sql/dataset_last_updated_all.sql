SELECT 
    key AS dataset,
    to_char(value::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.US')  || 'Z' AS last_updated
FROM dataset_tracker
