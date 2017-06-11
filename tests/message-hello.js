
(function () {
  'use strict';

  module.exports = function (callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    const request = require('request');
    const msg = 'Hello';

    const jsonResponse = {
      hub: {
        verify_token: process.env.FB_VERIFY_TOKEN
      },
      object: 'page',
      entry: [
        {
          id: 'PAGE_ID',
          time: Date.now(),
          messaging: [{
            sender: {
              id: process.env.USER_ID
            },
            recipient: {
              id: process.env.FB_PAGE_TOKEN
            },
            message: msg
          }]
        }
      ]
    };

    request.post({
      url: 'http://localhost:' + process.env.PORT + '/webhooks',
      body: jsonResponse,
      json: true
    }, (error, response, body) => {
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
