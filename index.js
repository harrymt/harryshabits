
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var Config = require('./config');
var FB = require('./connectors/facebook');
var Bot = require('./bot');


// LETS MAKE A SERVER!
var app = express();
app.set('port', (process.env.PORT) || 5000);
// SPIN UP SERVER
app.listen(app.get('port'), function () {
  console.log('> Running on port', app.get('port'));
});
// PARSE THE BODY
app.use(bodyParser.json());


// index page
app.get('/', function (req, res) {
  res.send('<p>nodejs server, index page .... hello world i am a chat bot');
});

// for facebook to verify
app.get('/webhooks', function (req, res) {
  if (req.query['hub.verify_token'] === Config.FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
  res.send('> Error, wrong fb verify token');
});

// to send messages to facebook
app.post('/webhooks', function (req, res) {
  console.log('> Receiving Message');

  var entry = FB.getMessageEntry(req.body);
  console.log(entry);

  // IS THE ENTRY A VALID MESSAGE?
  if (entry && entry.message) {
    console.log('> Valid message');

    if (entry.message.attachments) {
      // NOT SMART ENOUGH FOR ATTACHMENTS YET
      FB.newMessage(entry.sender.id, "Wow an attachment");
    } else {
      // SEND TO BOT FOR PROCESSING
      Bot.read(entry.sender.id, entry.message, function (sender, reply) {
        console.log("-- from bot to user vv --");
        console.log(reply);
        FB.newMessage(sender, reply);
      });
    }
  }

  res.sendStatus(200);
});
