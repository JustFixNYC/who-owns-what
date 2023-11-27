-- Table with one HPD contact for each BBL with standardized buiness addresses
-- to be used in building the portfolios

DROP TABLE IF EXISTS wow_landlords cascade;

CREATE TABLE wow_landlords (
    bbl char(10),
    registrationid int,
    name text,
    bizaddr text
);

CREATE INDEX ON wow_landlords (name, bizaddr);
