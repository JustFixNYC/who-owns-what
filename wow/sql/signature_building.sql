SELECT
    bbl,
    address,
    zip,
    borough,
    coun_dist,
    assem_dist,
    stsen_dist,
    cong_dist,
    units_res,
    units_nonres,
    year_built,
    link_hpd,
    link_acris,
    link_dob,
    link_dap,
    in_aep,
    in_conh,
    in_ucp,
    evictions,
    hpd_erp_orders,
    hpd_erp_charges,
    hpd_erp_charges_per_unit,
    hpd_viol_bc_open,
    hpd_viol_bc_open_per_unit,
    hpd_viol_bc_total,
    hpd_comp_emerg_total,
    hpd_comp_heat,
    hpd_comp_water,
    hpd_comp_pests,
    hpd_comp_apts_pct,
    hpd_comp_apts,
    last_rodent_date,
    last_rodent_result,
    landlord,
    landlord_slug,
    lender,
    lender_slug,
    last_sale_date,
    origination_date,
    debt_total,
    debt_per_unit,
    lat,
    lng
FROM signature_buildings
WHERE bbl = %(bbl)s
