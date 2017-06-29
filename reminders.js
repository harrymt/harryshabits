
'use strict';

const Bot = require('./bot');

/**
 * Send a reminder for everyone.
 * Optional parameter to override the time of day.
 * 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'
 */
const sendReminders = (timePeriod, callback) => {
  let quickReplyActions = [
    'Completed Habit',
    'Snooze Reminder'
  ];

  // Decide what period of the day it is
  const dayHour = (new Date()).getUTCHours();
  let timeOfDay = '';

  if (timePeriod) {
    timeOfDay = timePeriod;
    console.log('Overriding time period to ' + timePeriod);
  } else {
    if (dayHour === Bot.time.morning) {
      timeOfDay = 'MORNING';
    } else if (dayHour === Bot.time.afternoon) {
      timeOfDay = 'AFTERNOON';
    } else if (dayHour === Bot.time.evening) {
      timeOfDay = 'EVENING';
    } else if (dayHour === Bot.time.night) {
      timeOfDay = 'NIGHT';
      // Remove snooze if its the night
      quickReplyActions = [
        'Completed Habit',
        'Not Today'
      ];
    } else if (dayHour === Bot.time.newDay) {
      console.log('Resetting snooze time');
      // Reset snooze time
      quickReplyActions = null;
      timeOfDay = '';
    } else {
      // Not time todo things
      console.log('Not time to send reminders... time: ' + dayHour + ' date: ' + (new Date()).toUTCString());
      console.log('Reminder times are: ' + JSON.stringify(Bot.time));
      callback({ timeToSend: false, sent: 0, time: timeOfDay });
      return;
    }
  }

  let filter = '';

  if (timeOfDay !== '') {
    filter = '({snoozedReminderTime} = "' + timeOfDay + '")';
  }

  if (process.env.NODE_ENV !== 'production') {
    // Load the .env file, that sets process.env.
    require('dotenv').load();
  }

  const FB = require('./connectors/facebook');

  const database = require('./database');

  // Debug Logging!
  console.log('We got a reminder at time: ' + timeOfDay);

  // Get all users based on time
  // Setup online database, airtable
  const base = require('airtable').base('app5u2vOBmkjxLp4M');

  let i = 0;
  base('Users').select({
    filterByFormula: filter
  }).eachPage(function page(records, fetchNextPage) {

    records.forEach(record => {
      console.log('Found user ' + record.fields.fbid);

      if (record.fields.habit === undefined) {
        console.log('User hasn\'t told us their habit');
        console.log('Looking for next user');
      } else {
        if (quickReplyActions === null) {
          console.log('Sending final nightime messages');
          // Reset snooze time
          const userData = record.fields;
          userData.id = record.getId();
          userData.snoozedReminderTime = record.fields.reminderTime;

          // Reset number of snoozes today
          userData.snoozesToday = 0;

          database.updateUser(userData, () => {
            FB.newMessage(record.get('fbid'), {
              text: 'You haven\'t logged any time today. Try again tomorrow.'
            },
            (msg, data) => {
              i++;
              if (data.error) {
                console.log('Error sending new fb message');
                console.log(msg); // Log received info
                console.log(data); // Log recieved info
              }
              console.log('Looking for next user');
            });
          });
        } else {
          FB.newMessage(record.get('fbid'),
            Bot.createQuickReply(
              'Hey, have you completed your daily ' + Bot.convertToFriendlyName(record.get('habit')) + '?',
              quickReplyActions
            ),
            (msg, data) => {
              i++;
              if (data.error) {
                console.log('Error sending new fb message');
                console.log(msg); // Log received info
                console.log(data); // Log recieved info
              }
              console.log('Looking for next user');
            }
          );
        }
      }
    });
  }, function done(err) {
    if (err) {
      console.log(err);
      callback({ sent: i, time: timeOfDay, failure: true });
    } else {
      console.log('Sent ' + timeOfDay + ' reminders to ' + i + ' users.');
      callback({ sent: i, time: timeOfDay });
    }
  });
}


module.exports = {
  sendReminders
};
