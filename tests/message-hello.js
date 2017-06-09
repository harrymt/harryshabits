
(function() {
  'use strict';

  module.exports = function(callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    var request = require('request');
    var message = "Hello";

    var json_response =
    {
     "hub": {
        "verify_token": process.env.FB_VERIFY_TOKEN
      },
     "object":"page",
     "entry":[
       {
         "id":"PAGE_ID",
         "time": Date.now(),
         "messaging":[
           {
             "sender":{
               "id": process.env.USER_ID
             },
             "recipient":{
               "id": process.env.FB_PAGE_TOKEN
             },
             "message": message
           }
         ]
       }
     ]
   };

    request.post(
      {
        url: "http://localhost:" + process.env.PORT + "/webhooks",
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
