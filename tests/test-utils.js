'use strict';

const send = json => {
  const options = {
    method: 'POST',
    uri: 'http://localhost:' + process.env.PORT + '/webhooks',
    body: json,
    json: true
  };

  return new Promise((resolve, reject) => {
    require('request')(options, (err, resp) => {
      if (err) {
        reject(resp);
      } else {
        resolve(resp);
      }
    });
  });
};

const buildMessage = msg => {
  msg.mid = 'mid.1464990849238:b9a22a2bcb1de31773';
  msg.seq = 69;

  return {
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
};

const message = j => {
  return send(buildMessage(j));
};

module.exports = {
  message,
  send
};
