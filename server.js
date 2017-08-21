#!/usr/bin/env node

(function () {
  'use strict';

  const express = require('express');
  const helmet = require('helmet');

  const FB = require('./connectors/facebook');
  const database = require('./connectors/database');
  const Bot = require('./bot');

  const app = express();
  app.use(helmet());

  // View engine setup.
  app.set('views', './views');
  app.set('view engine', 'pug');
  app.use(require('body-parser').json());

  // Load the .env file, that sets process.env.
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();

    app.get('/sass', (req, res) => {
      require('./routes/process-sass').srcToDist('reward-style', 'reward-style');
      require('./routes/process-sass').srcToDist('main', 'main');
      const r = (new Date()).toUTCString() + ' | Processed sass files.';
      console.log(r);
      res.send(`<h1>${r}<h1>`);
    });
  }

  // Start server
  const serverInstance = app.listen(process.env.PORT, () => {
    console.log('> Running on port', process.env.PORT);
  });

  app.use(express.static('./public'));
  app.use('/rewards', require('./routes/rewards'));
  app.use('/email', require('./routes/email'));

  app.get(['/reminders/:timeOfDay', '/reminders'], (req, res) => {
    if (!req.query.secret || req.query.secret !== process.env.API_SECRET) {
      res.send('Invalid secret.');
      return;
    }
    if (req.params.timeOfDay) {
      console.log('Time of day: ' + req.params.timeOfDay);
      require('./routes/reminders').sendReminders(req.params.timeOfDay, success => {
        console.log(success);
      });
    } else {
      require('./routes/reminders').sendReminders(null, success => {
        console.log(success);
      });
    }
  });

  app.get('/finalsurvey', (req, res) => {
    if (!req.query.secret || req.query.secret !== process.env.API_SECRET) {
      res.send('Invalid secret.');
      return;
    }

    const surveys = require('./bin/full-survey-message').startFullSurvey(() => {
      console.log('Sent final survey messages');
    });
  });

  app.get('/stats', (req, res) => {
    if (!req.query.secret || req.query.secret !== process.env.API_SECRET) {
      res.send('Invalid secret.');
      return;
    }
    res.send('deprecated');
    // Enable me // require('./routes/stats').sendStats(success => {
      // res.send(success);
    // });
  });

  // Index page
  app.get('/', (req, res) => {
    res.render('index', {
      version: process.env.npm_package_version,
      name: process.env.npm_package_name_friendly
    });
  });

  /**
   * Facebook Messenger webhook, to receive messages via Messenger.
   */
  app.post('/webhooks', (req, res) => {
    console.log('> Receiving Message');

    // Extract message content
    const entry = FB.getMessageEntry(req.body);
    console.log(entry);

    // If the message is valid
    if (entry && entry.message) {

      database.getGlobals(globals => {
        console.log(globals);
        if (!globals.studyActive) {
          console.log('Study is inactive, replying stock message.');
          FB.newMessage(entry.sender.id, { text: 'Sorry the study is over. For further questions email hm16679@my.bristol.ac.uk' }, (msg, data) => {
            if (data.error) {
              console.log('Error sending stock study inactive message')
              console.error(data);
            } else {
              console.log(msg, data);
            }
          });
        } else {

          if (entry.message && entry.message.quick_reply) {
            console.log('QR> ' + entry.message.quick_reply.payload);
          } else {
            console.log('MSG> ' + entry.message.text);
          }

          // Process the message and decide on the response
          Bot.read(entry.sender.id, entry.message, (senderFbid, reply, anotherReply, thirdReply, fourthReply, fifthReply) => {
            console.log('-- from bot to user vv --');
            console.log(JSON.stringify(reply));

            FB.send(senderFbid, reply, 4000, () => {
              if (typeof anotherReply !== 'undefined' && anotherReply !== null) {
                FB.send(senderFbid, anotherReply, 4000, () => {
                  if (typeof thirdReply !== 'undefined' && thirdReply !== null) {
                    FB.send(senderFbid, thirdReply, 4000, () => {
                      if (typeof fourthReply !== 'undefined' && fourthReply !== null) {
                        FB.send(senderFbid, thirdReply, 4000, () => {
                          if (typeof fifthReply !== 'undefined' && fifthReply !== null) {
                            FB.send(senderFbid, fifthReply, 4000, () => {
                              console.log('Sent all messages to user');
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          });
        }
      });
    } else {
      console.log('Invalid entry/message or attachment found.');
      console.log(JSON.stringify(entry));
      console.log(JSON.stringify(req.body));
    }

    res.sendStatus(200);
  });

  // For facebook to verify
  app.get('/webhooks', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.log('Error wrong fb verify token, make sure validation tokens match.');
      res.status(403).send('> Error, wrong fb verify token');
    }
  });

  module.exports = {
    shutdown() {
      console.log('Server shutting down');
      serverInstance.close();
    }
  };
})();
