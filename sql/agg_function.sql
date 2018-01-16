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
  totalevictions bigint,
  totalrsdiff bigint,
  avgrspercent numeric,
  rslossaddr json,
  violationsaddr json,
  hasjustfix boolean
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

    sum(openviolations) as totalopenviolations,
    sum(totalviolations) as totalviolations,
    round(avg(openviolations)::numeric, 1) as openviolationsperbldg,
    sum(evictions) as totalevictions,
    sum(rsdiff) as totalrsdiff,
    round(avg(rspercentchange)::numeric, 1) as avgrspercent,

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
          'lat', lat, 'lng', lng, 'openviolations', openviolations
        )
        ORDER BY openviolations DESC
      ))[1]
    foo1) as violationsaddr,

    -- perform a boolean OR to see if at least one property in the portfolio has justfix
    bool_or(hasjustfix) as hasjustfix

  FROM get_assoc_addrs_from_bbl(_bbl) assocbldgs
$$ LANGUAGE SQL;
