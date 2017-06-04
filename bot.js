'use strict';

var Config = require('./config');
var wit = require('./services/wit').getWit();

// LETS SAVE USER SESSIONS
var sessions = {};

var findOrCreateSession = function (fbid) {
  var sessionId;

  // DOES USER SESSION ALREADY EXIST?
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      console.log('User session already exists with fb');
      // YUP
      sessionId = k;
    }
  });

  // No session so we will create one
  if (!sessionId) {
    sessionId = new Date().toISOString();
     console.log('User session does not exist, creating one...');
    sessions[sessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    };
  }

  return sessionId;
};

var read = function (sender, message, reply) {

  // Let's find the user
  var sessionId = findOrCreateSession(sender);

  // Log data
  // console.log("Sender");
  // console.log(sender);
  // console.log("message");
  console.log(message);
  // console.log("reply");
  // console.log(reply);


  // STRETCHING
  if(message.quick_reply.payload == "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_STRETCH") {

      var replies = [
        {
          "content_type": "text",
          "title": "Morning",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MORNING"
        },
        {
          "content_type": "text",
          "title": "Afternoon",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_AFTERNOON"
        },
        {
          "content_type": "text",
          "title": "Evening",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRINK_EVENING"
        }
      ];

      var msg = message;
      message = {
        text: 'Cool I love to ' + msg.text + '. What time do you want to ' + msg.text + '?',
        quick_replies: replies
      };

      reply(sender, message);

  } else if(message.quick_reply.payload == "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MORNING") {

      var replies = [
        {
          "content_type": "text",
          "title": "Visual",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VISUAL"
        },
        {
          "content_type": "text",
          "title": "Sound",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_SOUND"
        },
        {
          "content_type": "text",
          "title": "Vibration",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VIBRATION"
        }
      ];

      var msg = message;
      message = {
        text: 'Nice, I will remind you around that time, what mode of reward would you like?',
        quick_replies: replies
      };

      reply(sender, message);

  } else if(message.quick_reply.payload == "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VISUAL") {

      var msg = message;
      message = {
        text: 'Sweet. I will catch you later.'
      };

      reply(sender, message);

  } else {

    // If they are new, then send them the standard reply:
    var replies = [
      {
        "content_type": "text",
        "title": "Stretch",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_STRETCH"
      },
      {
        "content_type": "text",
        "title": "Meditate",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MEDITATE"
      },
      {
        "content_type": "text",
        "title": "Drink Water",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRINK_WATER"
      }
    ];

    message = {
      text: 'Yo, I am Arthur. What habit are you tracking?',
      quick_replies: replies
    };

    reply(sender, message);
  }




	// if (message === 'hello') {
	// 	// Let's reply back hello
	// 	message = 'Hello yourself! I am a chat bot. You can say "what is the weather like in london"';
	// 	reply(sender, message);


	// } else {
	// 	// Let's find the user
	// 	var sessionId = findOrCreateSession(sender);
	// 	// Let's forward the message to the Wit.ai bot engine
	// 	// This will run all actions until there are no more actions left to do
	// 	wit.runActions(
	// 		sessionId, // the user's current session by id
	// 		message,  // the user's message
	// 		sessions[sessionId].context, // the user's session state
	// 		function (error, context) { // callback
	// 		if (error) {
	// 			console.log('oops!', error);
	// 		} else {
	// 			// Wit.ai ran all the actions
	// 			// Now it needs more messages
	// 			console.log('Waiting for further messages');

	// 			// Based on the session state, you might want to reset the session
	// 			// Example:
	// 			// if (context['done']) {
	// 			// 	delete sessions[sessionId]
	// 			// }

	// 			// Updating the user's current session state
	// 			sessions[sessionId].context = context;
	// 		}
	// 	});
	// }
};



module.exports = {
	findOrCreateSession: findOrCreateSession,
	read: read,
};
