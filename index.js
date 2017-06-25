#!/usr/bin/env node

(function () {
  'use strict';

  const express = require('express');
  const app = express();

  // Load the .env file, that sets process.env.
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();

    app.use(function (req, res, next) {
      require('./process-scss').srcToDist('reward-style', 'reward-style');
      next();
    });
  }

  // Start server
  const serverInstance = app.listen(process.env.PORT, () => {
    console.log('> Running on port', process.env.PORT);
  });

  const database = require('./database');
  const FB = require('./connectors/facebook');
  const Bot = require('./bot');

  // View engine setup.
  app.set('views', './views');
  app.set('view engine', 'pug');

  app.use(require('body-parser').json());
  app.use(express.static('./public'));
  app.use('/rewards', require('./routes/rewards'));
  app.use(['/fitbit', '/fitbitauth'], require('./routes/fitbit-auth'));
  app.use('/email', require('./routes/email'));

  // Index page
  app.get('/', (req, res) => {
    res.send(
      '<h1>Version ' + require('./package.json').version + '</h1>' +
      '<p>nodejs server, index page .... hello world i am a chat bot'
    );
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
            }, 5000); // 5 second gap between messages
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


  // For facebook to verify
  app.get('/webhooks', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.log('Error wrong fb verify token, make sure validation tokens match.');
      res.status(403).send('> Error, wrong fb verify token');
    }
  });

  // TODO make this a method so I can call remidners remotely
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


  module.exports = {
    shutdown() {
      console.log('Server shutting down');
      serverInstance.close();
    }
  };
})();
