#!/usr/bin/env node

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'production') {
    // Load the .env file, that sets process.env.
    require('dotenv').load();
  }
  process.env.PORT = 5000;

  const express = require('express');
  const bodyParser = require('body-parser');

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
      res.send(req.query['hub.challenge']);
    } else {
      res.send('> Error, wrong fb verify token');
    }
  });

  // To send messages to facebook
  app.post('/webhooks', (req, res) => {
    console.log('> Receiving Message');

    const entry = FB.getMessageEntry(req.body);

    // IS THE ENTRY A VALID MESSAGE?
    if (entry && entry.message) {
      console.log('> Valid message');

      if (entry.message.attachments) {
        // NOT SMART ENOUGH FOR ATTACHMENTS YET
        FB.newMessage(entry.sender.id, 'Wow an attachment');
      } else {
        // SEND TO BOT FOR PROCESSING
        Bot.read(entry.sender.id, entry.message, (sender, reply) => {
          console.log('-- from bot to user vv --');
          console.log(reply);

          // Send message to that user
          FB.newMessage(sender, reply);
        });
      }
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
