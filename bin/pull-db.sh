#!/bin/bash
#
# Delete local
dropdb thedb
#
# Pull remote db
# Doenst work
heroku pg:pull postgresql-amorphous-61398 thedb --app infinite-falls-46264