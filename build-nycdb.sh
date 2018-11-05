#!/bin/bash
#-------------------------------------------------------------------#
# Script for setting up PostreSQL for who-owns-what                 #
#                                                                   #
# Assumes you have Postgres running                                 #
#                                                                   #
#                                                                   #
#  NOTE: Make sure you're on v9.6                                   #
#                                                                   #
#-------------------------------------------------------------------#



# CONNECTION VARIABLES
DB_HOST=db
DB_DATABASE=wow
DB_USER=wow
DB_PASSWORD=wow
PGPASSWORD=$DB_PASSWORD

WOW_PATH=/wow
NYCDB_PATH=/wow/nycdb
PSQL_PATH=/usr/bin/psql

mkdir -p $NYCDB_PATH
cd $NYCDB_PATH

# ------------ PLUTO DATA ------------  #

# # Don't wanna download and load pluto every time...
PLUTOTEST=`$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "SELECT to_regclass('public.pluto_18v1')"`
if [ -z "$PLUTOTEST" ]
then
    echo Table pluto_18v1 not found in the database. Downloading...
    nycdb --download pluto_18v1
    echo Loading pluto_18v1 into the database...
    nycdb --load pluto_18v1 -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
else
    echo Table pluto_18v1 already exists. Verifying row count...
    nycdb --verify pluto_18v1 -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
fi

# ------------ RENTSTAB DATA ------------  #

# # Don't wanna download and load rentstab every time...
RSTEST=`$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "SELECT to_regclass('public.rentstab_summary')"`
if [ -z "$RSTEST" ]
then
    echo Table rentstab_summary not found in the database. Downloading...
    nycdb --download rentstab_summary
    echo Loading rentstab data into the db...
    nycdb --load rentstab_summary -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
else
    echo Table rentstab_summary already exists. Verifying row count...
    nycdb --verify rentstab_summary -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
fi





# ------------ EVICTON DATA ------------  #

# # Don't wanna download and load rentstab every time...
RSTEST=`$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "SELECT to_regclass('public.marshal_evictions_17')"`
if [ -z "$RSTEST" ]
then
    echo Table marshal_evictions_17 not found in the database. Downloading...
    rm $NYCDB_PATH/data/marshal_evictions_17.csv
    nycdb --download marshal_evictions_17
    echo Loading eviction data into the db...
    nycdb --load marshal_evictions_17 -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
else
    echo Table marshal_evictions_17 already exists. Verifying row count...
    nycdb --verify marshal_evictions_17 -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
fi




# ------------ HPD REGISTRATION DATA ------------  #

rm $NYCDB_PATH/data/hpd_registrations.csv
rm $NYCDB_PATH/data/hpd_contacts.csv

echo Downloading latest HPD registration data...
nycdb --download hpd_registrations

$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "drop table hpd_registrations"
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "drop table hpd_contacts"

echo Loading HPD registration data into the db...
nycdb --load hpd_registrations -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
nycdb --verify hpd_registrations -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE

echo Running custom SQL for HPD registrations...
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "\i $WOW_PATH/sql/registrations_with_contacts.sql"




# ------------ HPD VIOLATION DATA ------------  #

rm $NYCDB_PATH/data/hpd_violations.csv

echo Downloading latest HPD violation data...
nycdb --download hpd_violations

$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "drop table hpd_violations"

echo Loading HPD violation data into the db...
nycdb --load hpd_violations -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE
nycdb --verify hpd_violations -H $DB_HOST -U $DB_USER -P $DB_PASSWORD -D $DB_DATABASE






# ------------ RUNNING WoW SCRIPTS ------------  #

echo Creating WoW buildings table...
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "\i $WOW_PATH/sql/create_bldgs_table.sql"

echo Adding helper functions...
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "\i $WOW_PATH/sql/helper_functions.sql"

echo Creating WoW search function...
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "\i $WOW_PATH/sql/search_function.sql"

echo Creating WoW agg function...
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "\i $WOW_PATH/sql/agg_function.sql"

echo Creating hpd landlord contact table...
$PSQL_PATH -X -A -d $DB_DATABASE -U $DB_USER -h $DB_HOST -p 5432 -t -c "\i $WOW_PATH/sql/landlord_contact.sql"
