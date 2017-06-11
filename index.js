
(function () {
  'use strict';

  // After config loads
  require('./config').isReady(err => {
    if (err) {
      throw new Error('Error getting config' + err);
    }
    // Can now access variables like process.env.PORT

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

    // Index page
    app.get('/', (req, res) => {
      res.send('<p>nodejs server, index page .... hello world i am a chat bot');
    });

    app.get('/reminders/:time_of_day', (req, res) => {
      // Validate the time of day
      let message = 'Wow this is a strange time.'; // Default
      if (req.params.time_of_day === 'morning') {
        message = 'Good morning';
      } else if (req.params.time_of_day === 'afternoon') {
        message = 'Afternoon';
      } else if (req.params.time_of_day === 'evening') {
        message = 'Good evening';
      } else {
        res.send('Wow you should not be here. [' + req.params.time_of_day + ']');
        throw new Error('Reached invalid timeofday call');
      }

      // Debug Logging!
      console.log('We got a reminder at time: ' + req.params.time_of_day);
      res.send('We got a reminder at time: ' + req.params.time_of_day);

      // Const query = datastore.createQuery('User')
      //   .filter('done', '=', false)
      //   .filter('priority', '>=', 4)
      //   .order('priority', {
      //     descending: true
      // });

      // datastore.get(key, function(err, entity) {
      //   console.log(err || entity);
      // });

      // Get everyone from the morning

      // Send out reminders using the facebook API
      // Loop around them and send a FB.newMessage(senderID, message);
    });

    // For facebook to verify
    app.get('/webhooks', (req, res) => {
      if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
      }
      res.send('> Error, wrong fb verify token'); // Error on this line: Error: Can't set headers after they are sent
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
            FB.newMessage(sender, reply);
          });
        }
      }

      res.sendStatus(200);
    });

    module.exports = {
      shutdown: function () {
        console.log('Server shutting down');
        serverInstance.close();
      }
    };
  });
})();
