-- Set up the table in our WOW db to populate with the data provided by UNHP for
-- all the buildings included in the dashboard along with financing and other
-- data UNHP provides.


DROP TABLE IF EXISTS signature_unhp_data cascade;

CREATE TABLE signature_unhp_data (
    bbl char(10),
    landlord text,
    origination_date date,
    debt_total numeric,
    debt_building numeric,
    debt_unit numeric,
    lender text
);

CREATE INDEX ON signature_unhp_data (bbl);
