DROP TABLE IF EXISTS signature_collections CASCADE;
CREATE TABLE IF NOT EXISTS signature_collections AS (
	WITH collections_stacked AS (
		SELECT
			landlord AS collection_name,
			'landlord' AS collection_type,

			max(lender) AS lender_name,
			
			-- This all copied to next two sections
			count(*)::int AS buildings_agg,
			sum(units_res)::int AS units_res_agg,
			sum(rs_units)::int AS rs_units_agg,
			
			sum(evictions_filed)::int AS evictions_filed_agg,
			sum(hp_active)::int AS hp_active_agg,

			(sum((bip >= 500)::int)::float / sum((bip IS NOT NULL)::int)::float)::float * 100 AS bip_500_pct_agg,
			
			sum(hpd_erp_orders)::int AS hpd_erp_orders_agg,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::float AS hpd_erp_orders_per_unit_agg,
			sum(hpd_erp_charges)::int AS hpd_erp_charges_agg,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::float AS hpd_erp_charges_per_unit_agg,

			sum(hpd_viol_bc_open)::int AS hpd_viol_bc_open_agg,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_open_per_unit_agg,
			sum(hpd_viol_bc_total)::int AS hpd_viol_bc_total_agg,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_total_per_unit_agg,
			
			sum(hpd_comp_emerg_total)::int AS hpd_comp_emerg_total_agg,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::float AS hpd_comp_emerg_total_per_unit_agg,
			
			sum(dob_jobs)::int as dob_jobs_agg,
			sum(dob_ecb_viol_open)::int AS dob_ecb_viol_open_agg,
			sum(dob_ecb_viol_open) / nullif(sum(units_res), 0)::float AS dob_ecb_viol_open_per_unit_agg,

			sum(water_charges)::float AS water_charges_agg,

			sum(debt_total)::float AS debt_total_agg,
			sum(debt_total) / nullif(sum(units_res), 0)::float AS debt_per_unit_agg,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
			----
		FROM signature_buildings AS bldgs
		WHERE landlord IS NOT NULL
		GROUP BY landlord
		UNION
		SELECT
			lender AS collection_name,
			'lender' AS collection_type,

			NULL::text AS lender_name,

			-- All copied from above
			count(*)::int AS buildings_agg,
			sum(units_res)::int AS units_res_agg,
			sum(rs_units)::int AS rs_units_agg,
			
			sum(evictions_filed)::int AS evictions_filed_agg,
			sum(hp_active)::int AS hp_active_agg,

			(sum((bip >= 500)::int)::float / sum((bip IS NOT NULL)::int)::float)::float * 100 AS bip_500_pct_agg,
			
			sum(hpd_erp_orders)::int AS hpd_erp_orders_agg,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::float AS hpd_erp_orders_per_unit_agg,
			sum(hpd_erp_charges)::int AS hpd_erp_charges_agg,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::float AS hpd_erp_charges_per_unit_agg,

			sum(hpd_viol_bc_open)::int AS hpd_viol_bc_open_agg,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_open_per_unit_agg,
			sum(hpd_viol_bc_total)::int AS hpd_viol_bc_total_agg,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_total_per_unit_agg,
			
			sum(hpd_comp_emerg_total)::int AS hpd_comp_emerg_total_agg,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::float AS hpd_comp_emerg_total_per_unit_agg,
			
			sum(dob_jobs)::int as dob_jobs_agg,
			sum(dob_ecb_viol_open)::int AS dob_ecb_viol_open_agg,
			sum(dob_ecb_viol_open) / nullif(sum(units_res), 0)::float AS dob_ecb_viol_open_per_unit_agg,

			sum(water_charges)::float AS water_charges_agg,

			sum(debt_total)::float AS debt_total_agg,
			sum(debt_total) / nullif(sum(units_res), 0)::float AS debt_per_unit_agg,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
			----
		FROM signature_buildings AS bldgs
		WHERE lender IS NOT NULL
		GROUP BY lender
		UNION
		SELECT
			'all' AS collection_name,
			'all' AS collection_type,

			NULL::text AS lender_name,

			-- All copied from above
			count(*)::int AS buildings_agg,
			sum(units_res)::int AS units_res_agg,
			sum(rs_units)::int AS rs_units_agg,
			
			sum(evictions_filed)::int AS evictions_filed_agg,
			sum(hp_active)::int AS hp_active_agg,

			(sum((bip >= 500)::int)::float / sum((bip IS NOT NULL)::int)::float)::float * 100 AS bip_500_pct_agg,
			
			sum(hpd_erp_orders)::int AS hpd_erp_orders_agg,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::float AS hpd_erp_orders_per_unit_agg,
			sum(hpd_erp_charges)::int AS hpd_erp_charges_agg,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::float AS hpd_erp_charges_per_unit_agg,

			sum(hpd_viol_bc_open)::int AS hpd_viol_bc_open_agg,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_open_per_unit_agg,
			sum(hpd_viol_bc_total)::int AS hpd_viol_bc_total_agg,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_total_per_unit_agg,
			
			sum(hpd_comp_emerg_total)::int AS hpd_comp_emerg_total_agg,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::float AS hpd_comp_emerg_total_per_unit_agg,
			
			sum(dob_jobs)::int as dob_jobs_agg,
			sum(dob_ecb_viol_open)::int AS dob_ecb_viol_open_agg,
			sum(dob_ecb_viol_open) / nullif(sum(units_res), 0)::float AS dob_ecb_viol_open_per_unit_agg,

			sum(water_charges)::float AS water_charges_agg,

			sum(debt_total)::float AS debt_total_agg,
			sum(debt_total) / nullif(sum(units_res), 0)::float AS debt_per_unit_agg,
			----
		FROM signature_buildings AS bldgs
	)
	SELECT 
		collection_type,
		collection_name,
		trim(BOTH '-' FROM regexp_replace(lower(trim(collection_name)), '[^a-z0-9_-]+', '-', 'gi')) AS collection_slug,
		lender_name,
		trim(BOTH '-' FROM regexp_replace(lower(trim(lender_name)), '[^a-z0-9_-]+', '-', 'gi')) AS lender_slug,
		buildings_agg,
		units_res_agg,
		rs_units_agg,
		evictions_filed_agg,
		hp_active_agg,
		bip_500_pct_agg,
		hpd_erp_orders_agg,
		hpd_erp_orders_per_unit_agg,
		hpd_erp_charges_agg,
		hpd_erp_charges_per_unit_agg,
		hpd_viol_bc_open_agg,
		hpd_viol_bc_open_per_unit_agg,
		hpd_viol_bc_total_agg,
		hpd_viol_bc_total_per_unit_agg,
		hpd_comp_emerg_total_agg,
		hpd_comp_emerg_total_per_unit_agg,
		dob_jobs_agg,
		dob_ecb_viol_open_per_unit_agg,
		dob_ecb_viol_open_agg,
		water_charges_agg,
		debt_total_agg,
		debt_per_unit_agg,
		bldg_data::json AS bldg_data -- cant union json columns, but jsonb works
	FROM collections_stacked
);

CREATE INDEX ON signature_collections (collection_slug);

