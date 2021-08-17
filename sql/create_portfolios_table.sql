DROP TABLE if exists wow_portfolios cascade;
CREATE TABLE wow_portfolios (
    bbls text[],
    landlord_names text[],
    graph json
);