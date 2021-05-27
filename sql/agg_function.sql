DROP FUNCTION IF EXISTS get_agg_info_from_bbl(text);

CREATE OR REPLACE FUNCTION get_agg_info_from_bbl(_bbl text)
RETURNS TABLE (
  bldgs bigint,
  units bigint,
  age numeric,
  topowners text[],
  topcorp text,
  topbusinessaddr text,
  totalopenviolations bigint,
  totalviolations bigint,
  openviolationsperbldg numeric,
  openviolationsperresunit numeric,
  totalevictions numeric,
  avgevictions numeric,
  totalrsgain bigint,
  totalrsloss bigint,
  totalrsdiff bigint,
  rsproportion numeric,
  rslossaddr json,
  evictionsaddr json,
  violationsaddr json
  -- , hasjustfix boolean
  -- , countjustfix bigint
) AS $$
  SELECT
    count(distinct registrationid) as bldgs,
    sum(unitsres) as units,

    -- get current year and subtract from yearbuillt if it exists, then find the avg
    round(avg(date_part('year', CURRENT_DATE) - NULLIF(yearbuilt, 0))::numeric, 1) as age,

    -- filter out ownernames, sort them by freq, then put the top 5 in an array
    (SELECT array_agg(ownername) FROM (
      SELECT json_array_elements(json_array_elements(json_agg(ownernames)))->>'value' as ownername
      GROUP BY ownername ORDER BY count(*) DESC LIMIT 5
    ) owners) as topowners,

    (SELECT corpname FROM (
      SELECT unnest(array_cat_agg(corpnames)) as corpname
      GROUP BY corpname ORDER BY count(*) DESC LIMIT 1
    ) corps) as topcorp,

    (SELECT businessaddr FROM (
      SELECT unnest(array_cat_agg(businessaddrs)) as businessaddr
      GROUP BY businessaddr ORDER BY count(*) DESC LIMIT 1
    ) rbas) as topbusinessaddr,

    (SELECT json_agg(
      json_build_object('type',complainttype,'count',countrecentcomplaints) 
      order by countrecentcomplaints desc) 
      filter (where countrecentcomplaints > 0) totalbytype
      FROM (
        SELECT sub1.complainttype, sum(count::integer) countrecentcomplaints
        FROM (
        SELECT 
          json_array_elements_text(recentcomplaintsbytype)::json->>'type' complainttype,
          json_array_elements_text(recentcomplaintsbytype)::json->>'count' count
        FROM get_assoc_addrs_from_bbl(_bbl)
        ) sub1
        GROUP BY sub1.complainttype
      ) sub2
    ) as totalrecentcomplaintsbytype,

    sum(totalcomplaints) as totalcomplaints,
    sum(recentcomplaints) as totalrecentcomplaints,

    sum(openviolations) as totalopenviolations,
    sum(totalviolations) as totalviolations,
    round(avg(openviolations)::numeric, 1) as openviolationsperbldg,
    round((sum(openviolations)::numeric / NULLIF(sum(unitsres), 0)::numeric), 1) as openviolationsperresunit,
    sum(evictions) as totalevictions,
    round((sum(evictions)::numeric / count(distinct registrationid)::numeric), 1) as avgevictions,
    coalesce(sum(rsdiff) filter (where rsdiff > 0),0) as totalrsgain,
    coalesce(sum(rsdiff) filter (where rsdiff < 0),0) as totalrsloss,
    sum(rsdiff) as totalrsdiff,
    round(abs(sum(rsdiff)) / NULLIF(sum(unitsres), 0)::numeric * 100.0, 1) as rsproportion,

    -- array_agg allows us to use order by. we put everything in json, then order it
    -- and take the first item. hacks hacks hacks
    (SELECT
      (array_agg (
        json_build_object (
          'housenumber', housenumber, 'streetname', streetname, 'boro', boro,
          'lat', lat, 'lng', lng, 'rsdiff', rsdiff
        )
        ORDER BY rsdiff ASC
      ))[1]
    foo) as rslossaddr,

    (SELECT
      (array_agg (
        json_build_object (
          'housenumber', housenumber, 'streetname', streetname, 'boro', boro,
          'lat', lat, 'lng', lng, 'evictions', evictions
        )
        ORDER BY evictions DESC NULLS LAST
      ))[1]
    foo1) as evictionsaddr,

    (SELECT
      (array_agg (
        json_build_object (
          'housenumber', housenumber, 'streetname', streetname, 'boro', boro,
          'lat', lat, 'lng', lng, 'openviolations', openviolations
        )
        ORDER BY openviolations DESC
      ))[1]
    foo2) as violationsaddr
   -- ,bool_or(hasjustfix) as hasjustfix
    -- perform a boolean OR to see if at least one property in the portfolio has justfix
 

    -- ,
    -- count(CASE WHEN hasjustfix THEN 1 END) as countjustfix

  FROM get_assoc_addrs_from_bbl(_bbl) assocbldgs
$$ LANGUAGE SQL;
