'use strict';

const request = require('request');

// Prepare request to facebook
const newRequest = request.defaults({
  uri: 'https://graph.facebook.com/v2.6/me/messages',
  method: 'POST',
  json: true,
  qs: {
    access_token: process.env.FB_PAGE_TOKEN
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

module.exports = {
  newMessage(recipientId, msg, cb) {
    const opts = {
      form: {
        recipient: {
          id: recipientId
        },
        message: msg
      }
    };

    newRequest(opts, (err, resp, data) => {
      if (cb) {
        cb((err || data.error) && data.error.message, data);
      }
    });
  },

  getMessageEntry(body) {
    console.log(body);
    const val = body.object === 'page' &&
              body.entry &&
              Array.isArray(body.entry) &&
              body.entry.length > 0 &&
              body.entry[0] &&
              body.entry[0].messaging &&
              Array.isArray(body.entry[0].messaging) &&
              body.entry[0].messaging.length > 0 &&
              body.entry[0].messaging[0];
    // If its a button postback, make it seem like a quick reply has been chosen for ease
    if (val.postback) {
      val.message = {
        quick_replies: {
          payload: val.postback.payload
        }
      };
    }
    return val || null;
  }
};

// https://developers.facebook.com/docs/messenger-platform/send-api-reference

// FOR IMAGES
// "message":{
//    "attachment":{
//      "type":"image",
//      "payload":{
//        "url":"https://petersapparel.com/img/shirt.png"
//      }
//    }
//  }

// FOR TEMPLATES
// "message":{
//   "attachment":{
//     "type":"template",
//     "payload":{
//       "template_type":"button",
//       "text":"What do you want to do next?",
//       "buttons":[
//         {
//           "type":"web_url",
//           "url":"https://petersapparel.parseapp.com",
//           "title":"Show Website"
//         },
//         {
//           "type":"postback",
//           "title":"Start Chatting",
//           "payload":"USER_DEFINED_PAYLOAD"
//         }
//       ]
//     }
//   }
// }

// var replies = [];
// var example_reply = {
//    "content_type": "text",
//    "title": "Okay",
//    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
// };
// replies.push(example_reply);

// var message = null;
// // if (atts) {
// //   message = {
// //     attachment: {
// //       "type": "image",
// //       "payload": {
// //         "url": msg
// //       }
// //     }
// //   };
// // } else {
// message = {
//  text: msg,
//  quick_replies: replies
// };
// // }
