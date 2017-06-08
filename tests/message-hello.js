
(function() {
  'use strict';

  module.exports = function(callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    var Config = require('../config');
    var request = require('request');

    var message = "Hello";

    var json_response =
    {
     "hub": {
        "verify_token": Config.verify_token
      },
     "object":"page",
     "entry":[
       {
         "id":"PAGE_ID",
         "time": Date.now(),
         "messaging":[
           {
             "sender":{
               "id": Config.USER_ID
             },
             "recipient":{
               "id": Config.FB_PAGE_TOKEN
             },
             "message": message
           }
         ]
       }
     ]
   };

    request.post(
      {
        url: "http://localhost:" + Config.PORT + "/webhooks",
        body: json_response,
        json: true
      }, function (error, response, body) {
       if (!error && response.statusCode === 200) {
          console.log(body);
          callback(false);
       } else {
          console.log(error);
          console.log(response);
          console.log(response.statusCode);
          callback(true);
       }
    });
  };
})();
