[![codebeat badge](https://codebeat.co/badges/ba2fcc99-7d37-4d4a-b639-b8745b3381cb)](https://codebeat.co/projects/github-com-harrymt-habit-reward-chatbot-master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/dee0a3c7a16a4276b47c27751959c6a6)](https://www.codacy.com/app/harrymt/habit-reward-chatbot?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=harrymt/habit-reward-chatbot&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/harrymt/habit-reward-chatbot/badge.svg?branch=master)](https://coveralls.io/github/harrymt/habit-reward-chatbot?branch=master)
[![Build Status](https://travis-ci.org/harrymt/habit-reward-chatbot.svg?branch=master)](https://travis-ci.org/harrymt/habit-reward-chatbot)

## Arthur - A Messenger Chatbot

Tracks habits and gives you rewards from 3 different modalities.

[Chat to him](https://m.me/2278578462368010).


## Run

- `npm start`
- Visit http://localhost:5000/webhooks

### Setup

- Create a `.env` file containing the following environment variables and save it in the root directory:
- Environment variables in Travis should also have these set (Note for GCLOUD_PRIVATE_KEY you need to replace all \n with actual new lines, then copy those newlines into the travis ci settings file (with single quotes))

*.env*
```
WIT_TOKEN=<your wit token here>
FB_PAGE_TOKEN=<your fb page token here>
FB_VERIFY_TOKEN=<verify token>
USER_ID=<user id>
PROJECT_ID=<Google App engine Project id>
GCLOUD_CLIENT_EMAIL=<Google App engine Service email>
GCLOUD_PRIVATE_KEY='M....dwc=' # All things after -- BEGIN PRIVATE KEY -- and -- END .. KEY -- The Google App engine serivce json private key, private_key value

```

## Build

- `git commit -am "message"`
- `git push`
- `git push heroku master` to deploy
- Message Arthur https://m.me/2278578462368010

## Deploy

- `gcloud app deploy`
- `gcloud app browse` to view


### Quality

- [Static analysis](https://github.com/mre/awesome-static-analysis#javascript) Javascript tools
- ADD XO linting to tests https://github.com/sindresorhus/xo
