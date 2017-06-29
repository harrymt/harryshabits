
'use strict';

const Bot = require('./bot');

/**
 * Send a reminder for everyone.
 * Optional timeperiod can be set to an integer, e.g. 17 for pm
 */
const sendReminders = (timePeriod, callback) => {
  let quickReplyActions = [
    'Completed Habit',
    'Snooze Reminder'
  ];

  // Decide what period of the day it is
  let dayHour = (new Date()).getUTCHours();
  let timeOfDay = '';

  if (timePeriod) {
    dayHour = timePeriod;
    console.log('Overriding time period to ' + dayHour + ' m ' + Bot.time.early_morning);
  }

  if (dayHour == Bot.time.early_morning) {
    timeOfDay = 'EARLY_MORNING';
  } else if (dayHour == Bot.time.mid_morning) {
    timeOfDay = 'MID_MORNING';
  } else if (dayHour == Bot.time.late_morning) {
    timeOfDay = 'LATE_MORNING';

  } else if (dayHour == Bot.time.early_afternoon) {
    timeOfDay = 'EARLY_AFTERNOON';
  } else if (dayHour == Bot.time.mid_afternoon) {
    timeOfDay = 'MID_AFTERNOON';
  } else if (dayHour == Bot.time.late_afternoon) {
    timeOfDay = 'LATE_AFTERNOON';

  } else if (dayHour == Bot.time.early_evening) {
    timeOfDay = 'EARLY_EVENING';
  } else if (dayHour == Bot.time.mid_evening) {
    timeOfDay = 'MID_EVENING';
  } else if (dayHour == Bot.time.late_evening) {
    timeOfDay = 'LATE_EVENING';

  } else if (dayHour == Bot.time.night) {
    timeOfDay = 'NIGHT';

  } else if (dayHour == Bot.time.newDay) {
    timeOfDay = '';
  } else {
    // Not time todo things
    console.log('Not time to send reminders... time: ' + dayHour + ' date: ' + (new Date()).toUTCString());
    console.log('Reminder times are: ' + JSON.stringify(Bot.time));
    callback({ timeToSend: false, sent: 0, time: timeOfDay });
    return;
  }

  let filter = '({snoozedReminderTime} = "' + timeOfDay + '")';

  if (timeOfDay === '') {
    // Reset snooze time
    quickReplyActions = null;
    filter = '';
  } else if (timeOfDay.includes('LATE_') || timeOfDay.includes('NIGHT')) {
    // Remove snooze if its in the late part of their day or night time
    quickReplyActions = [
      'Completed Habit',
      'Not Today'
    ];
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

  base('Users').select({
    filterByFormula: filter
  }).eachPage(function page(records, fetchNextPage) {

    for (let i = 0; i < records.length; i++) {
      if (records[i].fields.habit === undefined) {
        console.log('User hasn\'t told us their habit');
        console.log('Looking for next user');
      } else {
        // If its the end of the day
        if (quickReplyActions === null) {
          console.log('Sending final nightime messages');
          // Reset snooze time
          const userData = records[i].fields;
          userData.id = records[i].getId();
          userData.snoozedReminderTime = records[i].fields.reminderTime;

          // Reset number of snoozes today
          userData.snoozesToday = 0;

          // Reset users streak
          userData.streak = 0;

          database.updateUser(userData, () => {
            FB.newMessage(records[i].get('fbid'), {
              text: 'You haven\'t logged any time today. Try again tomorrow.'
            },
            (msg, data) => {
              if (data.error) {
                console.log('Error sending new fb message');
                console.log(msg); // Log received info
                console.log(data); // Log recieved info
              }
              console.log('Looking for next user');
              if ((i + 1) >= records.length) {
                // last record, fetch next page
                console.log('fetching next page')
                fetchNextPage();
              }
            });
          });
        } else {
          console.log('Sending ' + timeOfDay + ' reminder to user ' + records[i].get('fbid'));
          FB.newMessage(records[i].get('fbid'),
            Bot.createQuickReply(
              'Hey, have you completed your daily ' + Bot.convertToFriendlyName(records[i].get('habit')) + '?',
              quickReplyActions
            ),
            (msg, data) => {
              if (data.error) {
                console.log('Error sending new fb message');
                console.log(msg); // Log received info
                console.log(data); // Log recieved info
              }
              console.log('Looking for next user');
              if ((i + 1) >= records.length) {
                // last record, fetch next page
                console.log('fetching next page')
                fetchNextPage();
              }
            }
          );
        }
      }
    }

  }, function done(err) {
    if (err) {
      console.log(err);
      callback({ sent: counter, time: timeOfDay, failure: true });
    } else {
      console.log('Sent ' + timeOfDay + ' reminders users.');
      callback({ time: timeOfDay, success: true });
    }
  });
}


module.exports = {
  sendReminders
};
