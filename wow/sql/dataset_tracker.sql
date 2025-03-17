SELECT
    t.key AS dataset,
    to_char(t.value::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.US')  || 'Z' AS last_updated,
    expectedupdate::text AS update_cadence,
    alertthreshold::text AS alert_threshold,
    ((CURRENT_DATE - expectedupdate) - t.value::timestamp) > alertthreshold AS is_late
FROM dataset_tracker  AS t
LEFT JOIN dataset_alerts AS a ON t.key = a.datasetname
