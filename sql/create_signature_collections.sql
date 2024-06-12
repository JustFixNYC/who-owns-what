DROP TABLE IF EXISTS signature_collections CASCADE;
CREATE TABLE IF NOT EXISTS signature_collections AS (
	WITH collections_stacked AS (
		SELECT
			landlord AS collection_name,
			'landlord' AS collection_type,

			max(lender) AS lender_name,
			
			-- This all copied to next two sections
			count(*)::int AS buildings,
			sum(units_res)::int AS units_res,
			sum(rs_units)::int AS rs_units,
			
			sum(evictions_filed)::int AS evictions_filed,
			sum(hp_active)::int AS hp_active,

			(sum((bip >= 500)::int) / sum((bip IS NOT NULL)::int))::float * 100 AS bip_500_pct,
			
			sum(hpd_erp_orders)::int AS hpd_erp_orders,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::float AS hpd_erp_orders_per_unit,
			sum(hpd_erp_charges)::int AS hpd_erp_charges,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::float AS hpd_erp_charges_per_unit,

			sum(hpd_viol_bc_open)::int AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total)::int AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total)::int AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::float AS hpd_comp_emerg_total_per_unit,
			
			sum(dob_jobs)::int as dob_jobs,
			sum(dob_ecb_viol_open)::int AS dob_ecb_viol_open,
			sum(dob_ecb_viol_open) / nullif(sum(units_res), 0)::float AS dob_ecb_viol_open_per_unit,

			sum(water_charges)::float AS water_charges,

			sum(debt_total)::float AS debt_total,
			sum(debt_total) / count(*)::float AS debt_per_building,
			sum(debt_total) / nullif(sum(units_res), 0)::float AS debt_per_unit,
			
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
			count(*)::int AS buildings,
			sum(units_res)::int AS units_res,
			sum(rs_units)::int AS rs_units,
			
			sum(evictions_filed)::int AS evictions_filed,
			sum(hp_active)::int AS hp_active,

			(sum((bip >= 500)::int) / sum((bip IS NOT NULL)::int))::float * 100 AS bip_500_pct,
			
			sum(hpd_erp_orders)::int AS hpd_erp_orders,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::float AS hpd_erp_orders_per_unit,
			sum(hpd_erp_charges)::int AS hpd_erp_charges,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::float AS hpd_erp_charges_per_unit,

			sum(hpd_viol_bc_open)::int AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total)::int AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total)::int AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::float AS hpd_comp_emerg_total_per_unit,
			
			sum(dob_jobs)::int as dob_jobs,
			sum(dob_ecb_viol_open)::int AS dob_ecb_viol_open,
			sum(dob_ecb_viol_open) / nullif(sum(units_res), 0)::float AS dob_ecb_viol_open_per_unit,

			sum(water_charges)::float AS water_charges,

			sum(debt_total)::float AS debt_total,
			sum(debt_total) / count(*)::float AS debt_per_building,
			sum(debt_total) / nullif(sum(units_res), 0)::float AS debt_per_unit,
			
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
			count(*)::int AS buildings,
			sum(units_res)::int AS units_res,
			sum(rs_units)::int AS rs_units,
			
			sum(evictions_filed)::int AS evictions_filed,
			sum(hp_active)::int AS hp_active,

			(sum((bip >= 500)::int) / sum((bip IS NOT NULL)::int))::float * 100 AS bip_500_pct,
			
			sum(hpd_erp_orders)::int AS hpd_erp_orders,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::float AS hpd_erp_orders_per_unit,
			sum(hpd_erp_charges)::int AS hpd_erp_charges,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::float AS hpd_erp_charges_per_unit,

			sum(hpd_viol_bc_open)::int AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total)::int AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::float AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total)::int AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::float AS hpd_comp_emerg_total_per_unit,
			
			sum(dob_jobs)::int as dob_jobs,
			sum(dob_ecb_viol_open)::int AS dob_ecb_viol_open,
			sum(dob_ecb_viol_open) / nullif(sum(units_res), 0)::float AS dob_ecb_viol_open_per_unit,

			sum(water_charges)::float AS water_charges,

			sum(debt_total)::float AS debt_total,
			sum(debt_total) / count(*)::float AS debt_per_building,
			sum(debt_total) / nullif(sum(units_res), 0)::float AS debt_per_unit,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
			----
		FROM signature_buildings AS bldgs
	)
	SELECT 
		collection_type,
		collection_name,
		trim(BOTH '-' FROM regexp_replace(lower(trim(collection_name)), '[^a-z0-9_-]+', '-', 'gi')) AS collection_slug,
		lender_name,
		trim(BOTH '-' FROM regexp_replace(lower(trim(lender_name)), '[^a-z0-9_-]+', '-', 'gi')) AS lender_slug,
		buildings,
		units_res,
		rs_units,
		evictions_filed,
		hp_active,
		bip_500_pct,
		hpd_erp_orders,
		hpd_erp_orders_per_unit,
		hpd_erp_charges,
		hpd_erp_charges_per_unit,
		hpd_viol_bc_open,
		hpd_viol_bc_open_per_unit,
		hpd_viol_bc_total,
		hpd_viol_bc_total_per_unit,
		hpd_comp_emerg_total,
		hpd_comp_emerg_total_per_unit,
		dob_jobs,
		dob_ecb_viol_open_per_unit,
		dob_ecb_viol_open,
		water_charges,
		debt_total,
		debt_per_building,
		debt_per_unit,
		bldg_data::json AS bldg_data -- cant union json columns, but jsonb works
	FROM collections_stacked
);

CREATE INDEX ON signature_collections (collection_slug);

