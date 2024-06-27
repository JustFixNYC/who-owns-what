SELECT
    month, 
    hpdviolations_class_a,
    hpdviolations_class_b,
    hpdviolations_class_c,
    hpdviolations_class_i,
    hpdviolations_total,
    hpdcomplaints_emergency,
    hpdcomplaints_nonemergency,
    hpdcomplaints_total,
    dobviolations_regular,
    dobviolations_ecb,
    dobviolations_total,
    evictions_filed,
    evictions_executed
FROM signature_collection_charts
WHERE collection_slug = %(collection)s
