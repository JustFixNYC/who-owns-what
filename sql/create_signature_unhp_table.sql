-- Set up the table in our WOW db to populate with the data provided by UNHP for
-- all the buildings included in the dashboard along with financing and other
-- data UNHP provides.

-- NOTE: there's a bug with the csv upload process (handling of null values) and
-- so all the values need to be "text" in this table, and then cast in later
-- queries. 


DROP TABLE IF EXISTS signature_unhp_data cascade;

CREATE TABLE signature_unhp_data (
    bbl char(10),
    loan_pool text,
    landlord text,
    bip text,
    water_charges text,
    origination_date text,
    debt_total text
);

CREATE INDEX ON signature_unhp_data (bbl);
