
(function () {
  'use strict';

  module.exports = function (callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

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

    const request = require('request-promise');
    const options = {
      method: 'POST',
      uri: 'http://localhost:' + process.env.PORT + '/webhooks',
      body: jsonResponse,
      json: true
    };

    request(options)
      .then(response => {
        console.log(response);
        callback(false);
      })
      .catch(err => {
        console.log(err);
        callback(true);
      });
  };
})();
