[![codebeat badge](https://codebeat.co/badges/ba2fcc99-7d37-4d4a-b639-b8745b3381cb)](https://codebeat.co/projects/github-com-harrymt-habit-reward-chatbot-master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/dee0a3c7a16a4276b47c27751959c6a6)](https://www.codacy.com/app/harrymt/habit-reward-chatbot?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=harrymt/habit-reward-chatbot&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/harrymt/habit-reward-chatbot/badge.svg?branch=master)](https://coveralls.io/github/harrymt/habit-reward-chatbot?branch=master)
[![Build Status](https://travis-ci.org/harrymt/habit-reward-chatbot.svg?branch=master)](https://travis-ci.org/harrymt/habit-reward-chatbot)
[![Code Climate](https://codeclimate.com/github/codeclimate/codeclimate/badges/gpa.svg)](https://codeclimate.com/github/codeclimate/codeclimate)

## Arthur - A Messenger Chatbot

Tracks habits and gives you rewards from 3 different modalities.

[Chat to him](https://m.me/2278578462368010).

### Features

## Development

- Done via heroku instead of [Now.Sh](https://zeit.co/docs)

### Local

- Create a `.env` file with:

```
NODE_ENV=development
FB_PAGE_TOKEN=<your fb page token here>
FB_VERIFY_TOKEN=<verify token>
USER_ID=<user id>
CRON_SECRET=<secret phrase>
EMAIL_ID=<your email address for data backups and alerts>
EMAIL_PASS=<your email password>
```

- `npm test && npm start`


### Production

- Add the variables from `.env` to online Travis-CI
- `git push heroku master`
- `npm run deploy`
