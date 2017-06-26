'use strict';

module.exports = {
  sendVibration(userId, trackerId, accessToken, callback) {
    console.log('Sending vibration to user: ' + userId + ' tracker: ' + trackerId);

    const reminderHour = new Date();
    reminderHour.setMinutes(reminderHour.getUTCMinutes() + 1); // 1 m into the future
    const strReminderTime = reminderHour.getHours() + ':' + reminderHour.getUTCMinutes();

    const request = require('request-promise');
    const options = {
      uri: 'https://api.fitbit.com/1/user/' + userId + '/devices/tracker/' + trackerId + '/alarms.json',
      method: 'POST',
      json: true,
      qs: {
        time: strReminderTime + '+' + "01:00", // BST time // TODO remove
        enabled: true,
        recurring: false,
        weekDays: []
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      }
    };

    request(options)
      .then(response => {
        console.log('Finished communicating with fitbit alarms:');
        console.log(response);
        callback();
      })
      .catch(err => {
        console.log('Err communicating with Fitbit');
        console.log(err.message);
        callback(err);
    });
  }
};
