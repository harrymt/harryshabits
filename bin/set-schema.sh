#!/bin/bash

# Populate db with schema and sample data to local
# psql -d thedb -U postgres -f db/schema.sql
# Upgrade schema to remote, wiping everything
cat ./db/schema.sql | heroku pg:psql