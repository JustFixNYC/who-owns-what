-- Get all of the HPD contacts that will eventually be used to build portfolios.
-- This query is used to download the addresses for standardization via
-- geosupport before being uploaded into the db for making the portfolio
-- connections. We take only one registration per BBL (based on date), and only
-- one contact per registration (based on role), since that's all we need to
-- build the portfolios.

WITH landlord_contacts AS (
    SELECT DISTINCT
        upper(concat_ws(' ', firstname, lastname)) AS name,
        coalesce(businesshousenumber, '') as businesshousenumber, 
        coalesce(businessstreetname, '') as businessstreetname, 
        coalesce(businessapartment, '') as businessapartment,
        coalesce(businesscity, '') as businesscity, 
        coalesce(businesszip, '') as businesszip,
        coalesce(businessstate, '') as businessstate,
        hpd_contacts.registrationid,
        bbl,
        registrationenddate,
        lastregistrationdate,
        hpd_contacts.type
    FROM hpd_contacts
    INNER JOIN hpd_registrations
        ON hpd_contacts.registrationid = hpd_registrations.registrationid
    WHERE
        type = ANY('{{HeadOfficer, IndividualOwner, CorporateOwner, JointOwner}}')
        AND (businesshousenumber IS NOT NULL OR businessstreetname IS NOT NULL)
        AND LENGTH(CONCAT(businesshousenumber, businessstreetname)) > 2
        AND (firstname IS NOT NULL OR lastname IS NOT NULL)
),
landlord_contacts_ordered as (
    SELECT *
    FROM landlord_contacts
    ORDER BY 
        bbl, 
        -- For each BBL, we grab the most recent registrationid we have on file.
        -- We define 'most recent' to mean a registration with the most recent
        -- expiration date and, if there is a tie, most recent non-null registration date
        registrationenddate DESC, lastregistrationdate DESC NULLS LAST,
        -- Then, we prioritize certain owner types over others:
        ARRAY_POSITION(
            ARRAY['IndividualOwner','HeadOfficer','JointOwner','CorporateOwner'],
            landlord_contacts.type
        ),
        -- Finally, we order by landlord name, just to ensure sorting is deterministic:
        landlord_contacts.name
)
SELECT
    bbl,
    FIRST(registrationid) AS registrationid,
    FIRST(name) AS name,
    -- There are weird non-alphanumeric characters that break the geocoder
    regexp_replace(FIRST(businesshousenumber), '[^A-Z0-9\s]', '', 'g') as housenumber, 
    regexp_replace(FIRST(businessstreetname), '[^A-Z0-9\s]', '', 'g') as streetname, 

    -- Simple custom standardization of apt, since geocoder doesn't cover it
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
	regexp_replace(
		FIRST(businessapartment), 
        '[^A-Z0-9\s]', '', 'g'),
		'^(GRNDFL|GRFLO|GRDFLR|GRDFL|GDFL|GRFL|GFL)\s*(.*)$', 'GROUND FL \2'),
		'^SUITE$', 'STE'),
		'^(\d+)\s*(FLOOR|FLOO|FLR|FL)$', '\1 FL'),
		'^(FLOOR|FLOO|FLR|FL)\s*(\d+)$', '\2 FL'),
		'^(\d+)\s*(APART|APT)$', 'APT \1'),
		'^(APART|APT)\s*(\d+)$', 'APT \2'),
		'^(\d+)\s*(SUITE|STE)$', 'STE \1'),
		'^(AUITE|STE)\s*(\d+)$', 'STE \2'),
		'^(BASEMENT|BASEME|BASE|BSMNT|BSMT)\s*(\d*)$', 'BSMT \2'),
		'^(\d*)\s*(BASEMENT|BASEME|BASE|BSMNT|BSMT)$', 'BSMT \1')
	as apartment,

    regexp_replace(FIRST(businesscity), '[^A-Z0-9\s]', '', 'g') as city, 
    regexp_replace(FIRST(businesszip), '[^A-Z0-9\s]', '', 'g') as zip,
    regexp_replace(FIRST(businessstate), '[^A-Z0-9\s]', '', 'g') as state
FROM landlord_contacts_ordered
GROUP BY bbl;
