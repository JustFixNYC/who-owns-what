drop table if exists justfix_users;
CREATE TABLE justfix_users
(
    __v int,
    address text,
    advocateName text,
    advocateOrg text,
    advocateRole text,
    bbl text,
    boro text,
    created timestamp,
    fullName text,
    isRentStab boolean,
    lat numeric,
    lng numeric,
    phone text,
    updated timestamp
);
COPY
    justfix_users(__v, address, advocateName, advocateOrg, advocateRole, bbl, boro, created, fullName, isRentStab, lat, lng, phone, updated)
FROM '/Users/dan/Desktop/users_06152018_postgres.csv' DELIMITER ',' CSV HEADER;

CREATE INDEX ON justfix_users (bbl);
