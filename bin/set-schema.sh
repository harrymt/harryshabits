#!/bin/bash

# Populate db with schema and sample data to local
psql -d thedb -U postgres -f db/schema.sql
# Set schema to remote
cat ./db/schema.sql | heroku pg:psql