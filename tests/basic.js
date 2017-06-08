
(function() {
  'use strict';

  module.exports = function(callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    var Config = require('../config');
    var request = require('request');

    request("http://localhost:" + Config.PORT, function (error, response, body) {
       if (!error && response.statusCode === 200) {
          console.log(body);
          callback(1);
       } else {
          console.log(error);
          callback(-1);
       }
    });



    // PAGE_ACCESS_TOKEN=$(cat .env | grep FB_VERIFY_TOKEN | cut -d '=' -f 2)
    // echo PAGE_ACCESS_TOKEN
    // http://localhost:5000/webhooks

    //  {
    //   "hub": {
    //      "verify_token": "just_do_it"

    //    },
    //   "object":"page",
    //   "entry":[
    //     {

    //       "id":"PAGE_ID",
    //       "time":1458692752478,
    //       "messaging":[
    //         {
    //           "sender":{
    //             "id":"10153895902809565"
    //           },
    //           "recipient":{
    //             "id":"EAAEirKcDylYBAAudOU4ma2sE48aXA97Ih676G3sJxkCVrQwOUdock9uW4bmQ2f3glUlSMo5IdTMmY6JwQ8240nlAFmRCLPgvMkF2IeCz8iWOfZCYOWtZBVG9j73bnsimyNKTKs5AD3Km0XDZBVR9wSxxoqId9vGrc3Wpi7DhgZDZD"
    //           },
    //           "message": "hello"
    //         }
    //       ]
    //     }
    //   ]
    // }

  };
})();
