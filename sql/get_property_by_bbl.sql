CREATE OR REPLACE FUNCTION get_property_by_bbl(bbl VARCHAR)
RETURNS TABLE(
    property_name TEXT,
    owner_name TEXT,
    address TEXT,
    units INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT
        property_name,
        owner_name,
        address,
        units
    FROM properties
    WHERE bbl = bbl;
END;
$$ LANGUAGE plpgsql;
