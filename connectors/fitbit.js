'use strict';

const request = require('request');

module.exports = {

  sendVibration(userId, trackerId, callback) {
    console.log('Sending vibration to user: ' + userId + ' tracker: ' + trackerId);

    // Set new alarm from fitbit
    const newRequest = request.defaults({
      uri: 'https://api.fitbit.com/1/user/' + userId + '/devices/tracker/' + trackerId + '/alarms.json',
      method: 'POST',
      json: true,
      headers: {
        'Content-Type': 'application/json',
        response_type: 'token',
        client_id: process.env.FITBIT_CLIENT_ID,
        scope: 'settings'
      }
    });

    const payload = {
      form: {
        // TODO add fitbit details here
      }
    };

    newRequest(payload, (err, resp, data) => {
      if (err) {
        callback((err || data.error) && data.error.message);
      } else {
        // Get data from request
        // data.xxx

        callback();
      }
    });
  }
};
