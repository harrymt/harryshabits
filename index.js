#!/usr/bin/env node

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'production') {
    // Load the .env file, that sets process.env.
    require('dotenv').load();
  }

  const express = require('express');
  const bodyParser = require('body-parser');
  const database = require('./database');

  const FB = require('./connectors/facebook');
  const Bot = require('./bot');

  // LETS MAKE A SERVER!
  const app = express();
  const serverInstance = app.listen(process.env.PORT, () => {
    console.log('> Running on port', process.env.PORT);
  });

  // PARSE THE BODY
  app.use(bodyParser.json());

  // Setup Email
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS
    }
  });

  /**
   *
   */
  app.get('/fitbit', (req, res) => {
    if (req.query.state && req.query.code) {
      // Extract FBID
      const fbid = req.query.state;

      // Send request to get the access token
      const request = require('request-promise');
      const options = {
        method: 'POST',
        uri: 'https://api.fitbit.com/oauth2/token',
        form: {
          clientId: process.env.FITBIT_CLIENT_ID,
          grant_type: 'authorization_code',
          redirect_uri: 'https://infinite-falls-46264.herokuapp.com/fitbit',
          code: req.query.code
        },
        headers: {
          Authorization: 'Basic ' + Buffer.from(process.env.FITBIT_CLIENT_ID + ':' + process.env.FITBIT_CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const trackersGet = {
        method: 'GET',
        uri: 'https://api.fitbit.com/oauth2/token',
        headers: {
          Authorization: 'Bearer ' + Buffer.from(process.env.FITBIT_CLIENT_ID + ':' + process.env.FITBIT_CLIENT_SECRET).toString('base64')
        }
      };

      request(options)
        .then(response => {
          console.log(JSON.parse(response));
          const data = JSON.parse(response);

          // Let's find the user object
          database.find(fbid, user => {
            user.fitbit_access_token = data.access_token;
            user.fitbit_refresh_token = data.refresh_token;
            user.fitbit_user_id = data.user_id;


            // Make an API call to get users devices
            request(trackersGet).then(trackerResponse => {
              const trackerData = JSON.parse(trackerResponse);
              console.log(trackerData);

              if (trackerData.length > 1) {
                // Need to select a tracker
                console.log('They have more than 1 tracker :(');
                // TODO implement multiple tracker selection
                res.send('<h1>You have more than 1 tracker...this is unsupported</h1>');
              } else if (trackerData.length === 0) {
                console.log('They don\'t have a fitbit ...');
                res.send('<h1>No Fitbit found</h1>');
              }

              // Set tracker id
              user.fitbit_tracker_id = trackerData[0].id;

              // Update user
              database.updateUser(user, () => {

                // Send them the next flow
                const msg = {
                  text: 'Vibration rewards are all setup. Thanks for connecting with Fitbit! I will remind you in the ' + Bot.convertToFriendlyName(user.reminderTime) + ' about your ' + Bot.convertToFriendlyName(user.habit) + '!'
                };

                // Send them the next message, then close the web view
                FB.newMessage(fbid, msg, (msg, data) => {
                  if (data.error) {
                    console.log('Error sending new fb message');
                    console.log(msg); // Log received info
                    console.log(data); // Log recieved info
                  } else {
                    res.send(
                      '<script>' +
                      '(function(d, s, id){' +
                      '  var js, fjs = d.getElementsByTagName(s)[0];' +
                      '  if (d.getElementById(id)) {return;}' +
                      '  js = d.createElement(s); js.id = id;' +
                      '  js.src = "//connect.facebook.com/en_US/messenger.Extensions.js";' +
                      '  fjs.parentNode.insertBefore(js, fjs);' +
                      '}(document, "script", "Messenger"));' +
                      '</script>' +
                      '<h1>Successfully connected with Fitbit!</h1><script>window.extAsyncInit = function() {MessengerExtensions.requestCloseBrowser();};</script>'
                    );
                  }
                });
              });
            }).catch(err => {
              console.log(err);
              res.send(err);
            });
          });
        })
        .catch(err => {
          console.log(err);
          res.send(err);
        });
    } else {
      res.send(
        '<h1>Please verify with Fitbit.</h1>'
      );
    }
  });

  /**
   * Authenticate user with Fitbit using users facebook id.
   */
  app.get('/fitbitauth/:fbid', (req, res) => {
    if (req.params.fbid) {
      res.redirect('https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=228F68&redirect_uri=https%3A%2F%2Finfinite-falls-46264.herokuapp.com%2Ffitbit&state=' + req.params.fbid + '&scope=settings&expires_in=3196800');
    } else {
      res.send(
        '<h1>Please specify a Facebook ID</h1>'
      );
    }
  });

  /**
   * Backup the sessions json object via email attachment.
   */
  app.get('/email/backup/:secret', (req, res) => {
    if (req.params.secret === process.env.CRON_SECRET) {
      // const mailOptions = {
      //   attachments: [{
      //     filename: (new Date()).toDateString().split(' ').join('_') + '.json',
      //     content: JSON.stringify(Bot.sessions),
      //     contentType: 'application/json'
      //   }],

      //   from: process.env.EMAIL_ID,
      //   to: process.env.EMAIL_ID,
      //   subject: 'BACKUP', // Subject line
      //   text: (new Date()).toLocaleString() + '\nChatbot backup of ' + Object.keys(Bot.sessions).length + ' users.\n\n' + JSON.stringify(Bot.sessions)
      // };

      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     console.log(error);
      //     console.log(error.message);
      //     res.json({response: error, message: error.message});
      //   } else {
      //     console.log('Message sent: ' + info.response);
      //     res.json({response: info.response});
      //   }
      // });
    }
    res.json({response: 'Not created'});
  });

  // Index page
  app.get('/', (req, res) => {
    res.send(
      '<h1>Version ' + require('./package.json').version + '</h1>' +
      '<p>nodejs server, index page .... hello world i am a chat bot'
    );
  });

  // app.get('/reminders/:time_of_day/:secret', (req, res) => {
  //   if (req.params.secret === process.env.CRON_SECRET) {

  //     let quickReplyActions = [
  //       'Completed Habit',
  //       'Not Today',
  //       'Snooze'
  //     ];

  //     // Validate the time of day
  //     let message = 'Wow this is a strange time.'; // Default
  //     if (req.params.time_of_day === 'morning') {
  //       message = 'Good morning';
  //     } else if (req.params.time_of_day === 'afternoon') {
  //       message = 'Afternoon';
  //     } else if (req.params.time_of_day === 'evening') {
  //       message = 'Good evening';
  //     } else if (req.params.time_of_day === 'night') {
  //       message = 'You\'re up late';
  //       // Remove snooze if its the night
  //       quickReplyActions =  [
  //         'Completed Habit',
  //         'Not Today'
  //       ];
  //     } else {
  //       res.send('Wow you should not be here. [' + req.params.time_of_day + ']');
  //       throw new Error('Reached invalid timeofday call');
  //     }

  //     // Debug Logging!
  //     console.log('We got a reminder at time: ' + req.params.time_of_day);

  //     const time = req.params.time_of_day.toUpperCase();

  //     // Get all users based on time
  //     // Setup online database, airtable
  //     const base = require('airtable').base('app5u2vOBmkjxLp4M');

  //     let i = 0;
  //     base('Users').select({
  //       filterByFormula: '({reminderTime} = "' + time + '")'
  //     }).eachPage(function page(records, fetchNextPage) {

  //       records.forEach(record => {
  //         console.log('Found user ' + record.get('fbid'));

  //         FB.newMessage(record.get('fbid'),
  //           Bot.createQuickReply(
  //             'Hey, have you completed your daily ' + Bot.convertToFriendlyName(record.get('habit')) + '?',
  //             quickReplyActions
  //           )
  //         );
  //         i++;
  //         console.log('Looking for next page');
  //         fetchNextPage();
  //       });

  //     }, function done(err) {
  //       if (err) {
  //         console.error(err);
  //         throw new Error(err);
  //       }
  //       console.log('Sent ' + time + ' reminders to ' + i + ' users.');
  //       res.send('Sent ' + time + ' reminders to ' + i + ' users.');
  //     });

  //   } else {
  //     res.send('Secret invalid.');
  //   }
  // });

  // For facebook to verify
  app.get('/webhooks', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.log('Error wrong fb verify token, make sure validation tokens match.');
      res.status(403).send('> Error, wrong fb verify token');
    }
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
      if (entry.message && entry.message.quick_reply) {
        console.log('QR> ' + entry.message.quick_reply.payload);
      } else {
        console.log('MSG> ' + entry.message.text);
      }

      // Process the message and decide on the response
      Bot.read(entry.sender.id, entry.message, (senderFbid, reply, anotherReply) => {
        console.log('-- from bot to user vv --');
        console.log(JSON.stringify(reply));

        // Send message to that user
        FB.newMessage(senderFbid, reply, (msg, data) => {
          if (data.error) {
            console.log('Error sending new fb message');
            console.log(msg); // Log received info
            console.log(data); // Log recieved info
          } else if (typeof anotherReply !== 'undefined' && anotherReply !== null) {
            // Check if we want to double message the user
            setTimeout(() => {
              FB.newMessage(senderFbid, anotherReply, (msg, data) => {
                if (data.error) {
                  console.log('Error sending new second reply fb message');
                  console.log(msg); // Log received info
                  console.log(data); // Log recieved info
                }
              });
            }, 2000); // 2 second gap between messages
          }
        });
      });
    } else {
      console.log('Invalid entry/message or attachment found.');
      console.log(JSON.stringify(entry));
      console.log(JSON.stringify(req.body));
    }

    res.sendStatus(200);
  });

  module.exports = {
    shutdown() {
      console.log('Server shutting down');
      serverInstance.close();
    }
  };
})();
