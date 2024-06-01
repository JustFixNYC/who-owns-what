DROP TABLE IF EXISTS signature_collections CASCADE;
CREATE TABLE IF NOT EXISTS signature_collections AS (
	WITH collections_stacked AS (
		SELECT
			landlord AS collection_name,
			'landlord' AS collection_type,
			
			count(*) AS buildings,
			sum(units_res) AS units_res,
			
			sum(evictions) AS evictions,
			
			sum(hpd_erp_orders) AS hpd_erp_orders,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::numeric AS hpd_erp_orders_per_unit,
			sum(hpd_erp_charges) AS hpd_erp_charges,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::numeric AS hpd_erp_charges_per_unit,

			sum(hpd_viol_bc_open) AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::numeric AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total) AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::numeric AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total) AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::numeric AS hpd_comp_emerg_total_per_unit,
			
			sum(debt_total) AS debt_total,
			sum(debt_total) / count(*)::numeric AS debt_per_building,
			sum(debt_total) / nullif(sum(units_res), 0)::numeric AS debt_per_unit,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
		FROM signature_buildings AS bldgs
		WHERE landlord IS NOT NULL
		GROUP BY landlord
		UNION
		SELECT
			lender AS collection_name,
			'lender' AS collection_type,

			-- All copied from above
			count(*) AS buildings,
			sum(units_res) AS units_res,
			
			sum(evictions) AS evictions,
			
			sum(hpd_erp_orders) AS hpd_erp_orders,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::numeric AS hpd_erp_orders_per_unit,
			sum(hpd_erp_charges) AS hpd_erp_charges,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::numeric AS hpd_erp_charges_per_unit,

			sum(hpd_viol_bc_open) AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::numeric AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total) AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::numeric AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total) AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::numeric AS hpd_comp_emerg_total_per_unit,
			
			sum(debt_total) AS debt_total,
			sum(debt_total) / count(*)::numeric AS debt_per_building,
			sum(debt_total) / nullif(sum(units_res), 0)::numeric AS debt_per_unit,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
		FROM signature_buildings AS bldgs
		WHERE lender IS NOT NULL
		GROUP BY lender
		UNION
		SELECT
			'all' AS collection_name,
			'all' AS collection_type,

			-- All copied from above
			count(*) AS buildings,
			sum(units_res) AS units_res,
			
			sum(evictions) AS evictions,
			
			sum(hpd_erp_orders) AS hpd_erp_orders,
			sum(hpd_erp_orders) / nullif(sum(units_res), 0)::numeric AS hpd_erp_orders_per_unit,
			sum(hpd_erp_charges) AS hpd_erp_charges,
			sum(hpd_erp_charges) / nullif(sum(units_res), 0)::numeric AS hpd_erp_charges_per_unit,

			sum(hpd_viol_bc_open) AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / nullif(sum(units_res), 0)::numeric AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total) AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / nullif(sum(units_res), 0)::numeric AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total) AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / nullif(sum(units_res), 0)::numeric AS hpd_comp_emerg_total_per_unit,
			
			sum(debt_total) AS debt_total,
			sum(debt_total) / count(*)::numeric AS debt_per_building,
			sum(debt_total) / nullif(sum(units_res), 0)::numeric AS debt_per_unit,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
		FROM signature_buildings AS bldgs
	)
	SELECT 
		collection_name,
		trim(BOTH '-' FROM regexp_replace(lower(trim(collection_name)), '[^a-z0-9_-]+', '-', 'gi')) AS collection_slug,
		collection_type,
		buildings,
		units_res,
		evictions,
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
		debt_total,
		debt_per_building,
		debt_per_unit,
		bldg_data::json AS bldg_data -- cant union json columns, but jsonb works
	FROM collections_stacked
);

CREATE INDEX ON signature_collections (collection_slug);

