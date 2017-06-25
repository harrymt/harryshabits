'use strict';

const request = require('request');

module.exports = {

  sendVibration(userId, trackerId, accessToken, callback) {
    console.log('Sending vibration to user: ' + userId + ' tracker: ' + trackerId);

    // TODO remove, add another hour for BST
    const reminderHour = new Date();
    reminderHour.setHours(reminderHour.getHours() + 1);
    const strReminderTime = reminderHour + ':' + reminderHour.getUTCMinutes();

    const anotherReq = request.defaults({
      uri: 'https://api.fitbit.com/1/user/' + userId + '/devices/tracker/' + trackerId + '/alarms.json',
      method: 'POST',
      json: true,
      form: {
        time: strReminderTime + ':' + strReminderTime,
        enabled: true,
        recurring: false,
        weekDays: []
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      }
    });

    anotherReq((err, resp, data) => {
      if (err) {
        callback((err || data.error) && data.error.message);
      } else {
        callback();
      }
    });
  }
};
