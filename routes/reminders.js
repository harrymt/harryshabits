
'use strict';

const Bot = require('../bot');
const database = require('../connectors/database');
const FB = require('../connectors/facebook');
const Time = require('../time');


/**
 * Decide if it is time to send post completion messages to what users.
 * should be ran every hour.
 * An override can be provided to manually send reminders, useful for debugging.
 */
const decideOnReminder = (override, callback) => {

  let quickReplyActions = [
    'Completed habit',
    'Not yet'
  ];

  const timeOfDay = Time.period(override);
  console.log(timeOfDay, 'override is : ' + override);

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
      if (g.remainingDays == 0) {
        database.updateGlobals(g, globals => {
          // Send out end of study messages
          sendEndOfStudyMessages(result => {
            if (result.success) {
              console.log('Successfully sent end of study messages');
            } else {
              console.log('We couldn\'t send end of study messages');
            }
            return callback(null);
          });
          console.log('Remaining days : ' + globals.remainingDays);
          return callback(timeOfDay, quickReplyActions);
        });
      } else {
        database.updateGlobals(g, globals => {
          console.log('Remaining days : ' + globals.remainingDays);
          return callback(timeOfDay, quickReplyActions);
        });
      }
    });
  } else if (timeOfDay === null) {
    // Not time to send reminders
    console.log('Not time to send reminders... time: ' + Time.hour() + ' date: ' + (new Date()).toUTCString());
    console.log('Reminder times are: ' + JSON.stringify(Time.reminderTimes));
    return callback(null);
  } else {
    return callback(timeOfDay, quickReplyActions);
  }
};


/**
 * Send the first questionnaire to users.
 */
const sendEndOfStudyMessages = callback => {
  const endOfStudy = {
    text: 'This part of the study is over. Thank you for taking part! I will not track your habits for about a week to see how well you do without me.'
  };

  const analysisQuestion = {
    text: 'To help with my analysis I will ask you a few questions. What extent do you agree with the following:'
  };

  const startQR = {
    text: ' is something I do automatically',
    quick_replies: [
      Bot.createQRItem('Strongly agree', 'SURVEY1_A_STRONGLY_AGREE'),
      Bot.createQRItem('Agree', 'SURVEY1_A_AGREE'),
      Bot.createQRItem('Neither', 'SURVEY1_A_NEITHER'),
      Bot.createQRItem('Disagree', 'SURVEY1_A_DISAGREE'),
      Bot.createQRItem('Strongly disagree', 'SURVEY1_A_STRONGLY_DISAGREE')
    ]
  };

  database.getUsers(users => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].finished) {
        console.log('Users finished, so not sending reminder.');
        continue;
      }
      console.log('Sending end of study message to user ' + users[i].fbid);

      FB.newMessage(users[i].fbid, endOfStudy, (msg, data) => {
        if (data.error) {
          console.log('Error sending new fb message');
          console.log(msg);
          console.log(data);
        } else {
          FB.newMessage(users[i].fbid, analysisQuestion, (msg, data) => {
            if (data.error) {
              console.log('Error sending new fb message');
              console.log(msg);
              console.log(data);
            } else {
              startQR.text = Bot.convertToFriendlyName(users[i].habit) + ' after ' + Bot.convertToFriendlyName(users[i].habitContext) + startQR.text;
              FB.newMessage(users[i].fbid, startQR,
                (msg, data) => {
                if (data.error) {
                  console.log('Error sending new fb message');
                  console.log(msg);
                  console.log(data);
                }
              });
            }
          });
        }
      });
    }
    console.log('Sent end of study messages.');
  });
};

/**
 * Deprecated, send the end of day messages telling users if they
 * haven't completed any habits.
 */
const sendNewDayMessages = (timeOfDay, callback) => {
  console.log('Start of sendNewDayMessages');
  database.getUsers(users => {

    for (let i = 0; i < users.length; i++) {
      if (users.length === 0) {
        return callback({ failure: false, noUsersAtTime: timeOfDay });
      } else {
        console.log('Sending final nightime messages');
        // Reset snooze time
        const userData = users[i];
        userData.snoozedReminderTime = users[i].reminderTime;

        // Reset number of snoozes today
        userData.snoozesToday = 0;

        database.hasUserCompletedHabit(users[i], hasCompletedHabit => {
          if (hasCompletedHabit) {
            database.updateUser(userData, () => {
              console.log('User ' + users[i].fbid + ' has completed their habit');
              if (i + 1 === users.length) {
                return callback({ time: timeOfDay, finalMessage: true, success: false });
              }
            });
          } else {
            // Reset users streak
            userData.streak = 0;

            database.updateUser(userData, () => {
              if (i + 1 === users.length) {
                return callback({ time: timeOfDay, finalMessage: true, success: false });
              }
            });
          }
        });
      }
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
      return callback({ failure: false, notTimeToSendReminders: true });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Load the .env file, that sets process.env.
      require('dotenv').load();
    }
    // Debug Logging!
    console.log('We got a reminder at time: ' + timeOfDay);

    if (timeOfDay === 'NEW_DAY') {
      sendNewDayMessages(timeOfDay, cb => {
        return callback(cb);
      });
    } else {
      // Get all users based on time
      database.getUsersByTime(timeOfDay, users => {
        if (users && users.length === 0) {
          return callback({ failure: false, noUsersAtTime: timeOfDay });
        } else {
          for (let i = 0; i < users.length; i++) {
            if (users[i].habit === undefined) {
              console.log('User hasn\'t told us their habit');
              console.log('Looking for next user');
            } else {

              console.log('Sending ' + timeOfDay + ' reminder to user ' + users[i].fbid);
              FB.newMessage(users[i].fbid,
                Bot.createQuickReply(
                  'Hey, after \'' + Bot.convertToFriendlyName(users[i].habitContext) + '\' have you completed your daily ' + Bot.convertToFriendlyName(users[i].habit) + '?',
                  quickReplyActions
                ),
                (msg, data) => {
                  if (data.error) {
                    console.log('Error sending new fb message');
                    console.log(msg);
                    console.log(data);
                  } else {
                    if (i + 1 === users.length) {
                      return callback({ time: timeOfDay, success: true });
                    }
                  }
                }
              );
            }
          }
        }
      });
    }
  });
};

module.exports = {
  sendReminders,
  sendEndOfStudyMessages,
  sendNewDayMessages
};
