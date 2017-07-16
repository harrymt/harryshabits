
'use strict';

const Bot = require('../bot');
const database = require('../connectors/database');
const FB = require('../connectors/facebook');
const Time = require('../time');

const decideOnReminder = (override, callback) => {

  let quickReplyActions = [
    'Completed habit',
    'Not yet'
  ];

  // Decide what period of the day it is
  const timeOfDay = Time.period(override);

  console.log(timeOfDay, override);

  if (timeOfDay === 'NIGHT') {
    // Remove snooze if its in the night time
    quickReplyActions = [
      'Completed habit',
      'Not today'
    ];
  }

  if (timeOfDay === 'NEW_DAY') {
    console.log('Time is new day');

    // Reset snooze time
    database.getGlobals(g => {
      g.remainingDays--;
      console.log('Decrementing remaining days to ' + g.remainingDays);
      if (g.remainingDays < 0) {
        // Send out end of study messages
        sendEndOfStudyMessages(result => {
          if (result.success) {
            console.log('Successfully sent end of study messages');
          } else {
            console.log('We couldn\'t send end of study messages');
          }
          callback(null);
        });
      } else {
        database.updateGlobals(g, globals => {
          console.log('Remaining days : ' + globals.remainingDays);
          callback(timeOfDay, quickReplyActions);
        });
      }
    });
  }

  if (timeOfDay === null) {
    // Not time to send reminders
    console.log('Not time to send reminders... time: ' + Time.hour() + ' date: ' + (new Date()).toUTCString());
    console.log('Reminder times are: ' + JSON.stringify(Time.reminderTimes));
    callback(null);
  } else {
    callback(timeOfDay, quickReplyActions);
  }
};

const sendEndOfStudyMessages = callback => {
  const message = {
    text: 'My time is up, I will be quiet for a while, I will check on you for about a week to see how youre getting on with your habit. To help with my analysis what extent do you agree with the following:'
  };

  const startQR = {
    text: ' is something I do automatically.',
    quick_replies: [
      Bot.createQRItem('Strongly agree', 'SURVEY1_A_STRONGLY_AGREE'),
      Bot.createQRItem('Agree', 'SURVEY1_A_AGREE'),
      Bot.createQRItem('Neither', 'SURVEY1_A_NEITHER'),
      Bot.createQRItem('Disagree', 'SURVEY1_A_DISAGREE'),
      Bot.createQRItem('Strongly disagree', 'SURVEY1_A_STRONGLY_DISAGREE')
    ]
  };

  const base = require('airtable').base(process.env.AIRTABLE_BASE);
  base('Users').select({
      filterByFormula: '({finished} != "' + true + '")'
  }).eachPage(function page(records, fetchNextPage) {
    for (let i = 0; i < records.length; i++) {
      if (records[i].get('finished')) {
        console.log('Users finished, so not sending reminder.');
        continue;
      }
      console.log('Sending end of study message to user ' + records[i].get('fbid'));

      FB.newMessage(records[i].get('fbid'), message,
        (msg, data) => {
          if (data.error) {
            console.log('Error sending new fb message');
            console.log(msg);
            console.log(data);
          } else {
            startQR.text = '1a, ' + Bot.convertToFriendlyName(records[i].get('habit')) + ' after ' + Bot.convertToFriendlyName(records[i].get('habitContext')) + ' ' + startQR.text;
            FB.newMessage(records[i].get('fbid'), startQR,
              (msg, data) => {
              if (data.error) {
                console.log('Error sending new fb message');
                console.log(msg);
                console.log(data);
              }
            });
          }
          console.log('Looking for next user');
          if ((i + 1) >= records.length) {
            // last record, fetch next page
            console.log('fetching next page');
            fetchNextPage();
          }
        }
      );
    }
  }, function done(err) {
    if (err) {
      console.log(err);
      callback({ error: err, success: true });
    } else {
      console.log('Sent end of study messages.');
      callback({ success: true });
    }
  });
};

/**
 * Send a reminder for everyone.
 * Optional timeperiod can be set to an integer, e.g. 17 for pm
 */
const sendReminders = (timePeriod, callback) => {

  decideOnReminder(timePeriod, (timeOfDay, quickReplyActions) => {
    if (timeOfDay === null) {
      callback({ failure: false, notTimeToSendReminders: true });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Load the .env file, that sets process.env.
      require('dotenv').load();
    }
    // Debug Logging!
    console.log('We got a reminder at time: ' + timeOfDay);

    // Get all users based on time
    // Setup online database, airtable
    const base = require('airtable').base(process.env.AIRTABLE_BASE);
    const filter = '({snoozedReminderTime} = "' + timeOfDay + '")';
    base('Users').select({
      filterByFormula: filter
    }).eachPage(function page(records, fetchNextPage) {

      for (let i = 0; i < records.length; i++) {
        if (records[i].fields.habit === undefined) {
          console.log('User hasn\'t told us their habit');
          console.log('Looking for next user');
        } else {
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
                  console.log(msg);
                  console.log(data);
                }
                console.log('Looking for next user');
                if ((i + 1) >= records.length) {
                  // last record, fetch next page
                  console.log('fetching next page');
                  fetchNextPage();
                }
              });
            });
          } else {
            console.log('Sending ' + timeOfDay + ' reminder to user ' + records[i].get('fbid'));
            FB.newMessage(records[i].get('fbid'),
              Bot.createQuickReply(
                'Hey, after ' + Bot.convertToFriendlyName(records[i].get('habitContext')) + ' have you completed your daily ' + Bot.convertToFriendlyName(records[i].get('habit')) + '?',
                quickReplyActions
              ),
              (msg, data) => {
                if (data.error) {
                  console.log('Error sending new fb message');
                  console.log(msg);
                  console.log(data);
                }
                console.log('Looking for next user');
                if ((i + 1) >= records.length) {
                  // last record, fetch next page
                  console.log('fetching next page');
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
        callback({ time: timeOfDay, failure: true });
      } else {
        console.log('Sent ' + timeOfDay + ' reminders users.');
        callback({ time: timeOfDay, success: true });
      }
    });
  });
};

module.exports = {
  sendReminders
};
