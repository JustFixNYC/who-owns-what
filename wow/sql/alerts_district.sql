create temporary table x_indicators_filtered AS (
SELECT *
FROM wow_indicators
WHERE bbl IS NOT NULL
	and (coun_dist = ANY(%(coun_dist)s)
	or nta = ANY(%(nta)s)
	or census_tract = ANY(%(census_tract)s)
    OR community_dist = ANY(%(community_dist)s::int[])
	or assem_dist = ANY(%(assem_dist)s)
	or stsen_dist = ANY(%(stsen_dist)s)
	or zipcode = ANY(%(zipcode)s))
);
CREATE INDEX ON x_indicators_filtered (bbl);

create temporary table x_indicators_normalized (
    bbl VARCHAR(10),
    bin VARCHAR(7),
    housenumber TEXT,
    streetname TEXT,
    boro TEXT,
    unitsres INTEGER,
    rsunitslatest INTEGER,
    size_metric DOUBLE PRECISION,
    portfolio_id INTEGER,
    hpd_link TEXT,
    
    -- priority calcs needed for weighing
    priority_comp__week DOUBLE PRECISION,
    priority_comp__1mo DOUBLE PRECISION,
    priority_comp__6mo DOUBLE PRECISION,
    priority_comp_per_unit__week DOUBLE PRECISION,
    priority_comp_per_unit__1mo DOUBLE PRECISION,

    priority_viol__week DOUBLE PRECISION,
    priority_viol__1mo DOUBLE PRECISION,
    priority_viol__6mo DOUBLE PRECISION,
    priority_viol_per_unit__week DOUBLE PRECISION,
    priority_viol_per_unit__1mo DOUBLE PRECISION,

    priority_dob_ecb_viol__week DOUBLE PRECISION,
    priority_dob_ecb_viol__1mo DOUBLE PRECISION,
    priority_dob_ecb_viol__6mo DOUBLE PRECISION,
    priority_dob_comp__week DOUBLE PRECISION,
    priority_dob_comp__1mo DOUBLE PRECISION,
    priority_dob_comp__6mo DOUBLE PRECISION,
    
    -- raw values
    hpd_comp_per_unit__week DOUBLE PRECISION,
    hpd_comp__week BIGINT,
    hpd_comp__1mo BIGINT,
    hpd_comp__6mo BIGINT,

    hpd_viol_per_unit__week DOUBLE PRECISION,
    hpd_viol__week BIGINT,
    hpd_viol__1mo BIGINT,
    hpd_viol__6mo BIGINT,

    evictions_filed__week BIGINT,
    evictions_filed__1mo BIGINT,
    evictions_filed__6mo BIGINT,

    dob_ecb_viol_bin VARCHAR(7),
    dob_ecb_viol__week BIGINT,
    dob_ecb_viol__1mo BIGINT,
    dob_ecb_viol__6mo BIGINT,
    
    dob_comp_bin VARCHAR(7),
    dob_comp__week BIGINT,
    dob_comp__1mo BIGINT,
    dob_comp__6mo BIGINT,
    
    -- normalized values 
    norm_priority_comp__week DOUBLE PRECISION,
    norm_priority_comp_per_unit__week DOUBLE PRECISION,
    norm_priority_comp__1mo DOUBLE PRECISION,
    norm_priority_comp_per_unit__1mo DOUBLE PRECISION,
    norm_priority_comp__6mo DOUBLE PRECISION,
    
    norm_priority_viol__week DOUBLE PRECISION,
    norm_priority_viol_per_unit__week DOUBLE PRECISION,
    norm_priority_viol__1mo DOUBLE PRECISION,
    norm_priority_viol_per_unit__1mo DOUBLE PRECISION,
    norm_priority_viol__6mo DOUBLE PRECISION,
            
    norm_priority_dob_ecb_viol__week DOUBLE PRECISION,
    norm_priority_dob_ecb_viol__1mo DOUBLE PRECISION,
    norm_priority_dob_ecb_viol__6mo DOUBLE PRECISION,
    norm_priority_dob_comp__week DOUBLE PRECISION,
    norm_priority_dob_comp__1mo DOUBLE PRECISION,
    norm_priority_dob_comp__6mo DOUBLE PRECISION,
    
    -- rank for statement explaining why building was surfaced
    rank_comp__week INTEGER,
    rank_comp_per_unit__week INTEGER,
    rank_viol__week INTEGER,
    rank_viol_per_unit__week INTEGER,
    rank_dob_ecb_viol__week INTEGER,
    rank_dob_comp__week INTEGER,
    
    -- total bbls in given area
    area_bbls_all BIGINT
);

INSERT INTO x_indicators_normalized
    WITH prioritized as (
        SELECT 
            bbl, 
            bin,
            housenumber, 
            streetname,
            boro,
            unitsres,
            rsunitslatest, 
            CASE 
                WHEN unitsres < 6 THEN 0
                WHEN unitsres < 10 THEN 0.5
                WHEN unitsres < 200 THEN 1
                WHEN unitsres < 300 THEN 0.5
                WHEN unitsres >= 300 THEN .25
                ELSE 0
            END AS size_metric,
            portfolio_id,
            hpd_link,
            
            -- priority values
            coalesce(hpd_comp__week , 0) * ln(unitsres) as priority_comp__week,
            coalesce(hpd_comp__1mo , 0) * ln(unitsres) as priority_comp__1mo,
            coalesce(hpd_comp__6mo , 0) * ln(unitsres) as priority_comp__6mo,
            coalesce(hpd_comp_per_unit__week, 0) * ln(unitsres) as priority_comp_per_unit__week,
            coalesce(hpd_comp_per_unit__1mo, 0) * ln(unitsres) as priority_comp_per_unit__1mo,
            
            coalesce(hpd_viol__week , 0) * ln(unitsres) as priority_viol__week,
            coalesce(hpd_viol__1mo, 0) * ln(unitsres) as priority_viol__1mo,
            coalesce(hpd_viol__6mo, 0) * ln(unitsres) as priority_viol__6mo,
            coalesce(hpd_viol_per_unit__week, 0) * ln(unitsres) as priority_viol_per_unit__week,
            coalesce(hpd_viol_per_unit__1mo, 0) * ln(unitsres) as priority_viol_per_unit__1mo,
            
            coalesce(dob_ecb_viol__week, 0) * ln(unitsres) as priority_dob_ecb_viol__week,
            coalesce(dob_ecb_viol__1mo, 0) * ln(unitsres) as priority_dob_ecb_viol__1mo,
            coalesce(dob_ecb_viol__6mo, 0) * ln(unitsres) as priority_dob_ecb_viol__6mo,
            coalesce(dob_comp__week, 0) * ln(unitsres) as priority_dob_comp__week,
            coalesce(dob_comp__1mo, 0) * ln(unitsres) as priority_dob_comp__1mo,
			coalesce(dob_comp__6mo, 0) * ln(unitsres) as priority_dob_comp__6mo,

        
            -- raw values 
            hpd_comp_per_unit__week,
            coalesce(hpd_comp__week , 0) as hpd_comp__week,
            coalesce(hpd_comp__1mo , 0) as hpd_comp__1mo,
            coalesce(hpd_comp__6mo , 0) as hpd_comp__6mo,
            
            hpd_viol_per_unit_bc__week as hpd_viol_per_unit__week,
            coalesce(hpd_viol_bc__week , 0) as hpd_viol__week,
            coalesce(hpd_viol_bc__1mo , 0) as hpd_viol__1mo,
            coalesce(hpd_viol_bc__6mo , 0) as hpd_viol__6mo,


            coalesce(evictions_filed__week, 0) as evictions_filed__week,
            coalesce(evictions_filed__1mo, 0) as evictions_filed__1mo,
            coalesce(evictions_filed__6mo, 0) as evictions_filed__6mo,
            
            dob_ecb_viol_bin,
            coalesce(dob_ecb_viol__week, 0) as dob_ecb_viol__week,
            coalesce(dob_ecb_viol__1mo, 0) as dob_ecb_viol__1mo,
            coalesce(dob_ecb_viol__6mo, 0) as dob_ecb_viol__6mo,
            
            dob_comp_bin,
            coalesce(dob_comp__week, 0) as dob_comp__week,
            coalesce(dob_comp__1mo, 0) as dob_comp__1mo,
            coalesce(dob_comp__6mo, 0) as dob_comp__6mo


        FROM x_indicators_filtered
        where hpd_comp_per_unit__week is not null
        and hpd_viol_per_unit_bc__week is not null 
    ), 
    min_max as (
        select
            min(priority_comp__week) as priority_comp__week__min,
            max(priority_comp__week) as priority_comp__week__max,
            min(priority_comp__1mo) as priority_comp__1mo__min,
            max(priority_comp__1mo) as priority_comp__1mo__max,
            min(priority_comp__6mo) as priority_comp__6mo__min,
            max(priority_comp__6mo) as priority_comp__6mo__max,
            min(priority_comp_per_unit__week) as priority_comp_per_unit__week__min,
            max(priority_comp_per_unit__week) as priority_comp_per_unit__week__max,
            min(priority_comp_per_unit__1mo) as priority_comp_per_unit__1mo__min,
            max(priority_comp_per_unit__1mo) as priority_comp_per_unit__1mo__max,
            
            
            min(priority_viol__week) as priority_viol__week__min,
            max(priority_viol__week) as priority_viol__week__max,
            min(priority_viol__1mo) as priority_viol__1mo__min,
            max(priority_viol__1mo) as priority_viol__1mo__max,
            min(priority_viol__6mo) as priority_viol__6mo__min,
            max(priority_viol__6mo) as priority_viol__6mo__max,
            min(priority_viol_per_unit__week) as priority_viol_per_unit__week__min,
            max(priority_viol_per_unit__week) as priority_viol_per_unit__week__max,
            min(priority_viol_per_unit__1mo) as priority_viol_per_unit__1mo__min,
            max(priority_viol_per_unit__1mo) as priority_viol_per_unit__1mo__max,
            
            
            min(priority_dob_ecb_viol__week) as priority_dob_ecb_viol__week__min,
            max(priority_dob_ecb_viol__week) as priority_dob_ecb_viol__week__max,
            min(priority_dob_ecb_viol__1mo) as priority_dob_ecb_viol__1mo__min,
            max(priority_dob_ecb_viol__1mo) as priority_dob_ecb_viol__1mo__max,
            min(priority_dob_ecb_viol__6mo) as priority_dob_ecb_viol__6mo__min,
            max(priority_dob_ecb_viol__6mo) as priority_dob_ecb_viol__6mo__max,

            min(priority_dob_comp__week) as priority_dob_comp__week__min,
            max(priority_dob_comp__week) as priority_dob_comp__week__max,
            min(priority_dob_comp__1mo) as priority_dob_comp__1mo__min,
            max(priority_dob_comp__1mo) as priority_dob_comp__1mo__max,
            min(priority_dob_comp__6mo) as priority_dob_comp__6mo__min,
            max(priority_dob_comp__6mo) as priority_dob_comp__6mo__max
            
        from prioritized
    ), 
    priority_normalized as (
        select *,
        	CASE
        		WHEN hpd_comp__week = 0 THEN NULL
			    ELSE RANK() OVER (ORDER BY hpd_comp__week DESC)
			END AS rank_comp__week,
			
            CASE 
			    WHEN hpd_comp_per_unit__week = 0 THEN NULL
			    ELSE RANK() OVER (ORDER BY hpd_comp_per_unit__week DESC)
			END AS rank_comp_per_unit__week,
			
			CASE 
			    WHEN hpd_viol__week = 0 THEN NULL
			    ELSE RANK() OVER (ORDER BY hpd_viol__week DESC)
			END AS rank_viol__week,
			
			CASE 
			    WHEN hpd_viol_per_unit__week = 0 THEN NULL
			    ELSE RANK() OVER (ORDER BY hpd_viol_per_unit__week DESC)
			END AS rank_viol_per_unit__week,
			
			CASE 
			    WHEN dob_ecb_viol__week = 0 THEN NULL
			    ELSE RANK() OVER (ORDER BY dob_ecb_viol__week DESC)
			END AS rank_dob_ecb_viol__week,
			
			CASE 
			    WHEN dob_comp__week = 0 THEN NULL
			    ELSE RANK() OVER (ORDER BY dob_comp__week DESC)
			END AS rank_dob_comp__week

        from (
            select 
                p.*,
                (priority_comp__week - m.priority_comp__week__min) 
                    / NULLIF((m.priority_comp__week__max - m.priority_comp__week__min), 0) as norm_priority_comp__week,
                (priority_comp_per_unit__week - m.priority_comp_per_unit__week__min) 
                    / NULLIF((m.priority_comp_per_unit__week__max - m.priority_comp_per_unit__week__min), 0) as norm_priority_comp_per_unit__week,
                (priority_comp__1mo - m.priority_comp__1mo__min) 
                    / NULLIF((m.priority_comp__1mo__max - m.priority_comp__1mo__min), 0) as norm_priority_comp__1mo,
                (priority_comp_per_unit__1mo - m.priority_comp_per_unit__1mo__min) 
                    / NULLIF((m.priority_comp_per_unit__1mo__max - m.priority_comp_per_unit__1mo__min), 0) as norm_priority_comp_per_unit__1mo,
                (priority_comp__6mo - m.priority_comp__6mo__min) 
                    / NULLIF((m.priority_comp__6mo__max - m.priority_comp__6mo__min), 0) as norm_priority_comp__6mo,
                (priority_viol__week - m.priority_viol__week__min) 
                    / NULLIF((m.priority_viol__week__max - m.priority_viol__week__min), 0) as norm_priority_viol__week,
                (priority_viol_per_unit__week - m.priority_viol_per_unit__week__min) 
                    / NULLIF((m.priority_viol_per_unit__week__max - m.priority_viol_per_unit__week__min), 0) as norm_priority_viol_per_unit__week,
                (priority_viol__1mo - m.priority_viol__1mo__min) 
                    / NULLIF((m.priority_viol__1mo__max - m.priority_viol__1mo__min), 0) as norm_priority_viol__1mo,
                (priority_viol_per_unit__1mo - m.priority_viol_per_unit__1mo__min) 
                    / NULLIF((m.priority_viol_per_unit__1mo__max - m.priority_viol_per_unit__1mo__min), 0) as norm_priority_viol_per_unit__1mo,
                (priority_viol__6mo - m.priority_viol__6mo__min) 
                    / NULLIF((m.priority_viol__6mo__max - m.priority_viol__6mo__min), 0) as norm_priority_viol__6mo,
                (priority_dob_ecb_viol__week - m.priority_dob_ecb_viol__week__min) 
                    / NULLIF((m.priority_dob_ecb_viol__week__max - m.priority_dob_ecb_viol__week__min), 0) as norm_priority_dob_ecb_viol__week,
                (priority_dob_ecb_viol__1mo - m.priority_dob_ecb_viol__1mo__min) 
                    / NULLIF((m.priority_dob_ecb_viol__1mo__max - m.priority_dob_ecb_viol__1mo__min), 0) as norm_priority_dob_ecb_viol__1mo,
                (priority_dob_ecb_viol__6mo - m.priority_dob_ecb_viol__6mo__min) 
                    / NULLIF((m.priority_dob_ecb_viol__6mo__max - m.priority_dob_ecb_viol__6mo__min), 0) as norm_priority_dob_ecb_viol__6mo,
                (priority_dob_comp__week - m.priority_dob_comp__week__min) 
                    / NULLIF((m.priority_dob_comp__week__max - m.priority_dob_comp__week__min), 0) as norm_priority_dob_comp__week,
                (priority_dob_comp__1mo - m.priority_dob_comp__1mo__min) 
                    / NULLIF((m.priority_dob_comp__1mo__max - m.priority_dob_comp__1mo__min), 0) as norm_priority_dob_comp__1mo,
                (priority_dob_comp__6mo - m.priority_dob_comp__6mo__min) 
                    / NULLIF((m.priority_dob_comp__6mo__max - m.priority_dob_comp__6mo__min), 0) as norm_priority_dob_comp__6mo
            from prioritized p
            cross join min_max m
        ) normed
    ), 
    total_count AS (
        SELECT COUNT(*) AS area_bbls_all FROM x_indicators_filtered
    )

    SELECT 
    	pn.*, 
    	tc.area_bbls_all
	FROM priority_normalized pn
	CROSS JOIN total_count tc;



create temporary table x_indicators_final (
    bbl VARCHAR(10),
    bin VARCHAR(7),
    housenumber TEXT,
    streetname TEXT,
    boro TEXT,
    unitsres INTEGER,
    rsunitslatest INTEGER,
    portfolio_id INTEGER,
    area_bbls_shared_portfolio INTEGER,
    area_bbls_all BIGINT,
    hpd_link TEXT,
    rank_final INTEGER,
    
    hpd_comp_per_unit__week DOUBLE PRECISION,
    rank_comp_per_unit__week INTEGER,
    
    hpd_comp__week BIGINT,
    rank_comp__week INTEGER,
    
    hpd_viol_per_unit__week DOUBLE PRECISION,
    rank_viol_per_unit__week INTEGER,
    
    hpd_viol__week BIGINT,
    rank_viol__week INTEGER,
    
    dob_ecb_viol_bin VARCHAR(7),
    dob_ecb_viol__week BIGINT,
    rank_dob_ecb_viol__week INTEGER,
    
    dob_comp_bin VARCHAR(7),
    dob_comp__week BIGINT,
    rank_dob_comp__week INTEGER,

    hpd_comp__1mo BIGINT,	
    hpd_comp__6mo BIGINT,	
    
    hpd_viol__1mo BIGINT,
    hpd_viol__6mo BIGINT,
    
    dob_ecb_viol__1mo BIGINT,
    dob_ecb_viol__6mo BIGINT,
    
    dob_comp__1mo BIGINT,
    dob_comp__6mo BIGINT,
    
    evictions_filed__week BIGINT,
    evictions_filed__1mo BIGINT,
    evictions_filed__6mo BIGINT
    
);

WiTH ranked AS (
    SELECT *,
        RANK() OVER (
            ORDER BY 
               COALESCE(norm_priority_comp__week, 0)
             + COALESCE(norm_priority_comp_per_unit__week, 0) * 0.75
             + COALESCE(norm_priority_viol__week, 0)
             + COALESCE(norm_priority_viol_per_unit__week, 0) * 0.75
             + COALESCE(norm_priority_dob_ecb_viol__week, 0) * 0.5
             + COALESCE(norm_priority_dob_comp__week, 0) * 0.5
             + COALESCE(size_metric, 0)
             -- for ranking buildings with no weekly activity
             -- take an average of normalized 6mo indicators and weigh it lower than other indicators
             + ((COALESCE(norm_priority_comp__6mo, 0) +
                COALESCE(norm_priority_viol__6mo, 0) +
                COALESCE(norm_priority_dob_ecb_viol__6mo, 0) +
                COALESCE(norm_priority_dob_comp__6mo, 0)
                ) / 4.0) * 0.1 
           DESC
        ) AS rank_final
    FROM x_indicators_normalized
),
area_bbls_shared_portfolio AS (
    SELECT 
        portfolio_id, 
        COUNT(*) AS area_bbls_shared_portfolio
    FROM x_indicators_normalized
    GROUP BY portfolio_id
)
INSERT INTO x_indicators_final (
    bbl, 
    bin,
    housenumber, 
    streetname,
    boro,
    unitsres,
    rsunitslatest,
    portfolio_id,
    area_bbls_shared_portfolio,
    area_bbls_all,
    hpd_link,
    rank_final,
    hpd_comp_per_unit__week,
    rank_comp_per_unit__week,
    hpd_comp__week,
    rank_comp__week,
    hpd_viol_per_unit__week,
    rank_viol_per_unit__week,
    hpd_viol__week,
    rank_viol__week,
    dob_ecb_viol_bin,
    dob_ecb_viol__week,
    rank_dob_ecb_viol__week,
    dob_comp_bin,
    dob_comp__week,
    rank_dob_comp__week,
    hpd_comp__1mo,
    hpd_comp__6mo,
    hpd_viol__1mo,
    hpd_viol__6mo,
    dob_ecb_viol__1mo,
    dob_ecb_viol__6mo,
    dob_comp__1mo,
    dob_comp__6mo,
    evictions_filed__week,
    evictions_filed__1mo,
    evictions_filed__6mo
)
SELECT 
    r.bbl, 
    r.bin,
    r.housenumber, 
    r.streetname,
    r.boro,
    r.unitsres,
    r.rsunitslatest,
    r.portfolio_id,
    a.area_bbls_shared_portfolio,
    r.area_bbls_all,
    r.hpd_link,
    r.rank_final,
    r.hpd_comp_per_unit__week,
    r.rank_comp_per_unit__week,
    r.hpd_comp__week,
    r.rank_comp__week,
    r.hpd_viol_per_unit__week,
    r.rank_viol_per_unit__week,
    r.hpd_viol__week,
    r.rank_viol__week,
    r.dob_ecb_viol_bin,
    r.dob_ecb_viol__week,
    r.rank_dob_ecb_viol__week,
    r.dob_comp_bin,
    r.dob_comp__week,
    r.rank_dob_comp__week,
    r.hpd_comp__1mo,
    r.hpd_comp__6mo,
    r.hpd_viol__1mo,
    r.hpd_viol__6mo,
    r.dob_ecb_viol__1mo,
    r.dob_ecb_viol__6mo,
    r.dob_comp__1mo,
    r.dob_comp__6mo,
    r.evictions_filed__week,
    r.evictions_filed__1mo,
    r.evictions_filed__6mo
FROM ranked r
LEFT JOIN area_bbls_shared_portfolio a ON r.portfolio_id = a.portfolio_id
ORDER BY r.rank_final;


WITH top_5 AS (
    SELECT *
    FROM x_indicators_final
    WHERE rank_final BETWEEN 1 AND 5
    AND ( -- Exclude any with no values to display
        hpd_comp__6mo > 0
        OR hpd_viol__6mo > 0
        OR dob_ecb_viol__6mo > 0
        OR dob_comp__6mo > 0
        OR evictions_filed__6mo > 0
    )
    LIMIT 5
),
first_shared_portfolio AS (
    SELECT portfolio_id
    FROM top_5
    WHERE area_bbls_shared_portfolio > 1
    ORDER BY rank_final
    LIMIT 1
),
shared_portfolio_top_3 AS (
    SELECT *
    FROM x_indicators_final
    WHERE portfolio_id = (SELECT portfolio_id FROM first_shared_portfolio)
      AND rank_final > 5  -- Exclude any from top 5 to avoid dupes
      AND ( -- Exclude any with no values to display
        hpd_comp__6mo > 0
        OR hpd_viol__6mo > 0
        OR dob_ecb_viol__6mo > 0
        OR dob_comp__6mo > 0
        OR evictions_filed__6mo > 0
    )
    ORDER BY rank_final
    LIMIT 3
),
all_buildings AS (
    SELECT * FROM top_5
    UNION ALL
    SELECT * FROM shared_portfolio_top_3
),
counts AS (
    SELECT 
        portfolio_id,
        (SELECT COUNT(*) FROM wow_indicators WHERE portfolio_id = b.portfolio_id) AS all_bbls_shared_portfolio
    FROM all_buildings b
    GROUP BY portfolio_id
)
SELECT 
    b.*,
    counts.all_bbls_shared_portfolio
FROM all_buildings b
LEFT JOIN counts USING(portfolio_id)
ORDER BY b.rank_final;
