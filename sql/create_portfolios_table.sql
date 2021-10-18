DROP TABLE if exists wow_portfolios cascade;
CREATE TABLE wow_portfolios (
    bbls text[],
    landlord_names text[],
    graph json
);
CREATE INDEX ON wow_portfolios USING GIN(bbls);
CREATE INDEX ON wow_portfolios USING GIN(landlord_names);
