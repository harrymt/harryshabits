#!/bin/bash

# Populate db with schema and sample data to local
psql -d thedb -U harrymt -f db/schema.sql
# cat ./db/schema.sql | psql -d thedb -U postgres
# Upgrade schema to remote, wiping everything
cat ./db/schema.sql | heroku pg:psql
