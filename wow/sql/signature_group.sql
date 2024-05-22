SELECT
    group_name,
    group_slug,
    group_type,
    properties,
    units_res,
    evictions,
    hpd_viol_bc_open,
    hpd_viol_bc_open_per_unit,
    hpd_viol_bc_total,
    hpd_viol_bc_total_per_unit,
    hpd_comp_emerg_total,
    hpd_comp_emerg_total_per_unit,
    debt_total,
    debt_per_building,
    debt_per_unit,
    bldg_data
FROM signature_groups
WHERE group_slug = %(group)s
