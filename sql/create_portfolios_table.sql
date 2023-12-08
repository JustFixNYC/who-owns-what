DROP TABLE if exists wow_portfolios cascade;
CREATE TABLE wow_portfolios (
    orig_id int,
    bbls text[],
    landlord_names text[],
    graph json,
    relatedportfoliosbbls text[]
);
CREATE INDEX ON wow_portfolios (orig_id);
CREATE INDEX ON wow_portfolios USING GIN(bbls);
CREATE INDEX ON wow_portfolios USING GIN(landlord_names);
