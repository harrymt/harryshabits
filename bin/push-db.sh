#!/bin/bash
#
# Delete db
heroku pg:reset --confirm infinite-falls-46264
#
# Push db
heroku pg:push thedb postgresql-amorphous-61398 --app infinite-falls-46264