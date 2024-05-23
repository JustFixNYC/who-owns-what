-- TODO: remove schema prefix from table names
DROP TABLE IF EXISTS signature_groups;
CREATE TABLE IF NOT EXISTS signature_groups AS (
	WITH groups_stacked AS (
		SELECT
			landlord AS group_name,
			'landlord' AS group_type,
			
			count(*) AS properties,
			sum(units_res) AS units_res,
			
			sum(evictions) AS evictions,
			
			sum(hpd_viol_bc_open) AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / sum(units_res) AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total) AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / sum(units_res) AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total) AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / sum(units_res) AS hpd_comp_emerg_total_per_unit,
			
			sum(debt_total) AS debt_total,
			sum(debt_total) / count(*) AS debt_per_building,
			sum(debt_total) / sum(units_res) AS debt_per_unit,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
		FROM signature_bldgs AS bldgs
		WHERE landlord IS NOT NULL
		GROUP BY landlord
		UNION
		SELECT
			lender AS group,
			'lender' AS group_type,
			
			count(*) AS properties,
			sum(units_res) AS units_res,
			
			sum(evictions) AS evictions,
			
			sum(hpd_viol_bc_open) AS hpd_viol_bc_open,
			sum(hpd_viol_bc_open) / sum(units_res) AS hpd_viol_bc_open_per_unit,
			sum(hpd_viol_bc_total) AS hpd_viol_bc_total,
			sum(hpd_viol_bc_total) / sum(units_res) AS hpd_viol_bc_total_per_unit,
			
			sum(hpd_comp_emerg_total) AS hpd_comp_emerg_total,
			sum(hpd_comp_emerg_total) / sum(units_res) AS hpd_comp_emerg_total_per_unit,
			
			sum(debt_total) AS debt_total,
			sum(debt_total) / count(*) AS debt_per_building,
			sum(debt_total) / sum(units_res) AS debt_per_unit,
			
			array_to_json(array_agg(row_to_json(bldgs)))::jsonb AS bldg_data
		FROM signature_bldgs AS bldgs
		GROUP BY lender
	)
	SELECT 
		group_name,
		trim(BOTH '-' FROM regexp_replace(lower(trim(group_name)), '[^a-z0-9_-]+', '-', 'gi')) AS group_slug,
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
		bldg_data::json AS bldg_data -- cant union json columns, but jsonb works
	FROM groups_stacked
);

CREATE INDEX ON signature_groups (group_slug);

