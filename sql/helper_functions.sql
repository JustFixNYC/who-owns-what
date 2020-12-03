-- SOURCE: https://github.com/JDBurnZ/postgresql-anyarray/blob/master/stable/anyarray_uniq.sql
DROP FUNCTION IF EXISTS anyarray_uniq(anyarray);
CREATE OR REPLACE FUNCTION anyarray_uniq(with_array anyarray)
	RETURNS anyarray AS
$BODY$
	DECLARE
		-- The variable used to track iteration over "with_array".
		loop_offset integer;

		-- The array to be returned by this function.
		return_array with_array%TYPE := '{}';
	BEGIN
		IF with_array IS NULL THEN
			return NULL;
		END IF;
		
		IF with_array = '{}' THEN
		    return return_array;
		END IF;

		-- Iterate over each element in "concat_array".
		FOR loop_offset IN ARRAY_LOWER(with_array, 1)..ARRAY_UPPER(with_array, 1) LOOP
			IF with_array[loop_offset] IS NULL THEN
				IF NOT EXISTS(
					SELECT 1 
					FROM UNNEST(return_array) AS s(a)
					WHERE a IS NULL
				) THEN
					return_array = ARRAY_APPEND(return_array, with_array[loop_offset]);
				END IF;
			-- When an array contains a NULL value, ANY() returns NULL instead of FALSE...
			ELSEIF NOT(with_array[loop_offset] = ANY(return_array)) OR NOT(NULL IS DISTINCT FROM (with_array[loop_offset] = ANY(return_array))) THEN
				return_array = ARRAY_APPEND(return_array, with_array[loop_offset]);
			END IF;
		END LOOP;
	RETURN return_array;
 END;
$BODY$ LANGUAGE plpgsql;

-- SOURCE: https://github.com/JDBurnZ/postgresql-anyarray/blob/master/stable/anyarray_remove_null.sql
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

-- HELPFUL LINKS:
-- https://stackoverflow.com/questions/22677463/how-to-merge-all-integer-arrays-from-all-records-into-single-array-in-postgres/22677955#22677955
DROP AGGREGATE IF EXISTS array_cat_agg(anyarray);
CREATE AGGREGATE array_cat_agg(anyarray) (
  SFUNC=array_cat,
  STYPE=anyarray
);

-- Given a regid, cross reference with uniqregid fields in the business_address table
DROP FUNCTION IF EXISTS get_regids_from_regid_by_bisaddr(integer);

CREATE OR REPLACE FUNCTION get_regids_from_regid_by_bisaddr(_regid integer)
RETURNS TABLE (
  uniqregids integer[]
) AS $$
  SELECT
    anyarray_uniq(array_cat_agg(q.uniqregids)) as uniqregids
  FROM (
    SELECT rbas.uniqregids
    FROM hpd_business_addresses AS rbas
    WHERE _regid = any(rbas.uniqregids)
  ) AS q;
$$ LANGUAGE SQL;



-- HELPFUL LINKS:
-- http://blog.scoutapp.com/articles/2016/07/12/how-to-make-text-searches-in-postgresql-faster-with-trigram-similarity
-- http://www.postgresonline.com/journal/archives/169-Fuzzy-string-matching-with-Trigram-and-Trigraphs.html

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS people_last_name_idx ON hpd_contacts USING GIN(lastname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS people_first_name_idx ON hpd_contacts USING GIN(firstname gin_trgm_ops);

-- This should be fairly self-explanatory. Provide name, use triagram lookup to get assoc. regids
DROP FUNCTION IF EXISTS get_regids_from_name(text, text);

CREATE OR REPLACE FUNCTION get_regids_from_name(_firstname text, _lastname text)
RETURNS TABLE (
  uniqregids integer[]
) AS $$
  SELECT
    array_agg(q.registrationid) as uniqregids
  FROM (
    SELECT DISTINCT ON (registrationid) registrationid FROM hpd_contacts
    WHERE firstname % _firstname AND similarity(firstname, _firstname) > 0.5
      AND lastname % _lastname AND similarity(lastname, _lastname) > 0.5
  ) AS q;
$$ LANGUAGE SQL;




-- Given a registrationid, return associated properties from the names of CorporateOwners, HeadOfficers, and IndividualOwners
-- The reason we include CorporateOwner is that sometimes they'll register a person name, this is useful
DROP FUNCTION IF EXISTS get_regids_from_regid_by_owners(integer);

CREATE OR REPLACE FUNCTION get_regids_from_regid_by_owners(_regid integer)
RETURNS TABLE (
  uniqregids integer[]
) AS $$
  SELECT
    anyarray_uniq(array_cat_agg(q.uniqregids)) as uniqregids
  FROM (
    SELECT c.firstname, c.lastname, f.uniqregids
    FROM hpd_contacts c,
    LATERAL get_regids_from_name(c.firstname, c.lastname) f
    WHERE c.registrationid = _regid AND
    firstname IS NOT NULL and lastname IS NOT NULL AND
    (c.type = 'CorporateOwner' OR c.type = 'HeadOfficer' OR c.type = 'IndividualOwner')
  ) AS q;
$$ LANGUAGE SQL;
