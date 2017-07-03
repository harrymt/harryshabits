#!/usr/bin/env node

(function () {
  'use strict';

  const express = require('express');
  const app = express();

  // Load the .env file, that sets process.env.
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();

    app.get('/sass', function (req, res) {
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

  const database = require('./connectors/database');
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

  app.get(['/reminders/:timeOfDay', '/reminders'], (req, res) => {
    if (!req.query.secret || req.query.secret !== process.env.API_SECRET) {
      res.send('Invalid secret.');
      return;
    }

    if (req.params.timeOfDay && Bot.time[req.params.timeOfDay.toLowerCase()] !== undefined) {
      require('./routes/reminders').sendReminders(Bot.time[req.params.timeOfDay.toLowerCase()], success => {
        res.send(success);
      });
    } else {
      require('./routes/reminders').sendReminders(null, success => {
        res.send(success);
      });
    }
  });

  app.get('/stats', (req, res) => {
    if (!req.query.secret || req.query.secret !== process.env.API_SECRET) {
      res.send('Invalid secret.');
      return;
    }
    res.send('deprecated');
    // require('./routes/stats').sendStats(success => {
      // res.send(success);
    // });
  });

  // Index page
  app.get('/', (req, res) => {
    res.render('index', {
      version: require('./package.json').version,
      name: require('./package.json').name_friendly,
      typeform: process.env.TYPE_FORM,
      PAGE_URL: 'https://infinite-falls-46264.herokuapp.com',
      PAGE_ID: process.env.FB_PAGE_ID,
      APP_ID: process.env.FB_APP_ID,
      ref: Date.now()
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


  module.exports = {
    shutdown() {
      console.log('Server shutting down');
      serverInstance.close();
    }
  };
})();
