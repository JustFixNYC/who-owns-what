-- https://github.com/aepyornis/hpd/blob/master/sql/anyarray_remove_null.sql
DROP FUNCTION IF EXISTS anyarray_remove_null(anyarray);
CREATE OR REPLACE FUNCTION anyarray_remove_null(from_array anyarray)
        RETURNS anyarray AS
$BODY$
        DECLARE
                -- The variable used to track iteration over "from_array".
                loop_offset integer;

                -- The array to be returned by this function.
                return_array from_array%TYPE;
        BEGIN
                -- Iterate over each element in "from_array".
                FOR loop_offset IN ARRAY_LOWER(from_array, 1)..ARRAY_UPPER(from_array, 1) LOOP
                        IF from_array[loop_offset] IS NOT NULL THEN -- If NULL, will omit from "return_array".
                                return_array = ARRAY_APPEND(return_array, from_array[loop_offset]);
                        END IF;
                END LOOP;

                RETURN return_array;
        END;
$BODY$ LANGUAGE plpgsql;

DROP TABLE IF EXISTS hpd_registrations_with_contacts;

-- This is mainly used as an easy way to provide contact info on request, not a replacement
-- for cross-table analysis. Hence why the corpnames, businessaddrs, and ownernames are simplified
-- with JSON and such.
CREATE TABLE hpd_registrations_with_contacts
as SELECT
  registrations.housenumber,
  registrations.streetname,
  registrations.zip,
  registrations.boro,
  registrations.registrationid,
  registrations.lastregistrationdate,
  registrations.registrationenddate,
  registrations.bbl,
  registrations.bin,
  contacts.corpnames,
  contacts.businessaddrs,
  contacts.ownernames,
  contacts.ownernameswithaddr || contacts.corpnameswithaddr as allcontacts
FROM hpd_registrations AS registrations
LEFT JOIN (
  SELECT
    -- collect the various corporation names
    anyarray_uniq(anyarray_remove_null(array_agg(nullif(corporationname, '')))) as corpnames,

    -- concat_ws ignores NULL values
    anyarray_uniq(
      array_agg(
        nullif(concat_ws(' ', businesshousenumber, businessstreetname, businessapartment, businesszip), '   ')
      )
      FILTER (
        WHERE (
          (businesshousenumber <> '') IS TRUE AND
          (businessstreetname <> '') IS TRUE AND
          (businesszip <> '') IS TRUE
        )
      )
    )
    as businessaddrs,

    -- craziness! json in postgres!
    -- this will filter out the (typically blank) CorporateOwner human names and any other blanks
    -- using json makes this nice to get from a query but also allows us to store key/value pairs
    -- which both the title and owner's concatenated first and last name.
    json_agg(json_build_object('title', type, 'value', (firstname || ' ' || lastname)))
      FILTER (
        WHERE type != 'CorporateOwner' AND
        firstname IS NOT NULL AND
        lastname IS NOT NULL
      )
    AS ownernames,

    coalesce(
      jsonb_agg(
        distinct
        jsonb_build_object(
          'title', type, 
          'value', (firstname || ' ' || lastname),
          'address', case when businessstreetname is not null then 
	          jsonb_build_object(
	            'housenumber', businesshousenumber,
	            'streetname', businessstreetname, 
	            'apartment', businessapartment, 
	            'city', businesscity,
	            'state', businessstate,
	            'zip', businesszip
	          ) 
	        else null end
        )
      )     	
      FILTER (
        WHERE type != 'CorporateOwner' AND
        firstname IS NOT NULL AND
        lastname IS NOT NULL
      ), 
      '[]'::jsonb) 
    AS ownernameswithaddr,
	
    coalesce(
      jsonb_agg( 
        distinct 
        jsonb_build_object(
          'title', 'Corporation',
          'value',  corporationname,
          'address', case when businessstreetname is not null then 
	          jsonb_build_object(
	            'housenumber', businesshousenumber,
	            'streetname', businessstreetname, 
	            'apartment', businessapartment, 
	            'city', businesscity,
	            'state', businessstate,
	            'zip', businesszip
	          ) 
	        else null end
        )
      )
      FILTER (WHERE corporationname IS NOT NULL), 
      '[]'::jsonb) 
    AS corpnameswithaddr,

    registrationid
  FROM hpd_contacts
  GROUP BY registrationid
) contacts ON (registrations.registrationid = contacts.registrationid);

create index on hpd_registrations_with_contacts (registrationid);
