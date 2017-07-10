
'use strict';

const snoozeAmountReminderTrigger = 5;

const fitbit = require('./connectors/fitbit');
const database = require('./connectors/database');
const rewards = require('./generate-reward');
const request = require('request');
const Time = require('./time');

/**
 * Creates a quick reply.
 *
 * @param message String to send.
 * @param options ['reply1', 'reply2'] Array of buttons.
 * @returns {{text: *, quick_replies: Array}}
 */
const createQuickReply = (message, options) => {
  const replies = [];

  options.forEach(el => {
    replies.push(
      {
        content_type: 'text',
        title: el,
        payload: 'PICKED_' + el.replace(' ', '_').toUpperCase()
      }
    );
  });

  return {
    text: message,
    quick_replies: replies
  };
};

/**
 * Convert to Pascal Case.
 *
 * @param str Unfriendly string.
 * @returns {string}
 */
const convertToFriendlyName = str => {
  return str.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ');
};

function displaySettings(user, sender, reply, debug) {
  let usr = user;
  // Remove some stuff so we arent over the 640 character limit
  delete usr.fitbit_user_id;
  delete usr.fitbit_access_token;
  delete usr.fitbit_tracker_id;
  delete usr.fitbit_refresh_token;

  if (debug) {
    reply(sender,
      {
        text: JSON.stringify(usr) + '\nTimes are ' + JSON.stringify(Time.reminderTimes)
      }
    );
  } else {
    reply(sender,
      {
        text: 'Your reminder time is set to ' + convertToFriendlyName(user.reminderTime) + ' and your rewards are ' + convertToFriendlyName(user.modality) + ' rewards.'
      }
    );
  }
}

function displayAbout(sender, reply) {

  database.getGlobals(globals => {
    reply(sender,
      {
        text: 'Information about the trial.'
      },
      {
        text: 'TODO'
      }
    );
  });
}

function displayHelp(sender, reply) {
  database.getGlobals(globals => {
    let firstMsg = 'There are ' + globals.remainingDays + ' days remaining in the trial.';
    if (globals.remainingDays <= 0) {
      firstMsg = 'The trail has ended.';
    }
    reply(sender,
      {
        text: firstMsg
      },
      createQuickReply(
       'Here are the list of commands you can message me.',
        [
          'About',
          'Settings',
          'Help'
        ]
      )
    );
  });
}

const read = function (sender, message, reply) {
  // Let's find the user object
  database.find(sender, user => {
    let messageStart = '';
    let firstTime = false;

    // If we have seen this user before, send them a greeting
    if (user.seenBefore) {
      messageStart = 'Welcome back! ';
    } else {
      user.seenBefore = true;
      messageStart = 'Hello new person! ';
    }

    // If user hasnt finish setting up, don't let them mark as completed.
    if (!user.habit || !user.modality || !user.reminderTime) {
      firstTime = true;
    }

    console.log(message);

    if (message.quick_reply === undefined) {
      if (message.text && message.text.toLowerCase() === 'settings') {
        displaySettings(user, sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'help')) {
        displayHelp(sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'about')) {
        displayAbout(sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'harrymt')) {
        displaySettings(user, sedner, reply, true);
      } else {
        if (firstTime) {
          reply(sender,
            createQuickReply(
              messageStart + 'I\'m Harry. I\'m not a talkative bot. What habit do you want to track?',
              [
                'Stretch',
                'Meditate',
                'Drink Water'
              ]
            )
          );
        } else {
          // If users are trying to tell us to mark thier habit as completed, then issue the completed dialog
          if (message.text && (String(message.text.toLowerCase()).includes('track') ||
              String(message.text.toLowerCase()).includes('mark') ||
              String(message.text.toLowerCase()).includes('habit') ||
              String(message.text.toLowerCase()).includes('complete') ||
              String(message.text.toLowerCase()).includes('did it'))) {

            // Check if users have already completed their habit today
            database.hasUserCompletedHabit(user, hasCompleted => {
              if (!hasCompleted) {
                 reply(sender,
                  createQuickReply(
                    'Did you want to mark your daily habit ' + convertToFriendlyName(user.habit) + ' as completed?',
                    [
                      'Completed Habit'
                    ]
                  )
                );
              } else {
                reply(sender, { text: 'Well done on completing your habit today. I\'ll see you tomorrow!' });
              }
            });
          } else {
            reply(sender, { text: 'Sorry, I don\'t know how to respond to that.' });
          }
        }
      }
    } else {
      if (message.quick_reply.payload === 'GET_STARTED_PAYLOAD') {
        reply(sender,
          createQuickReply(
            messageStart + 'I\'m Harry. I\'m not a talkative bot. What habit do you want to track?',
            [
              'Stretch',
              'Meditate',
              'Drink Water'
            ]
          )
        );
      } else if (message.quick_reply.payload === 'PICKED_ABOUT') {
        displayAbout(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_SETTINGS') {
        displaySettings(user, sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_HELP') {
        displayHelp(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_STRETCH' ||
          message.quick_reply.payload === 'PICKED_MEDITATE' ||
          message.quick_reply.payload === 'PICKED_DRINK_WATER') {

        const habit = message.quick_reply.payload.substring(7);

        // Save habit against user
        user.habit = habit;

        // Save user information to datastore
        database.updateUser(user, () => {
          // Then reply
          reply(sender,
            createQuickReply(
              'That\'s a good one, what time would you like a reminder to ' + convertToFriendlyName(habit) + '?',
              [
                'Morning',
                'Afternoon',
                'Evening'
              ]
            )
          );
        });

      } else if (message.quick_reply.payload === 'PICKED_BACK_TO_MODALITIES') {
         reply(sender,
          createQuickReply(
            'What mode of reward would you like?',
            [
              'Visual',
              'Sound',
              'Vibration'
            ]
          )
        );
      } else if (message.quick_reply.payload === 'PICKED_MORNING' ||
                 message.quick_reply.payload === 'PICKED_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_EVENING') {

        const timePeriod = message.quick_reply.payload.substring(7).toLowerCase();
        reply(sender,
          createQuickReply(
            'What time in the ' + timePeriod + '?',
            [
              'Early ' + timePeriod,
              'Mid ' + timePeriod,
              'Late ' + timePeriod
            ]
          )
        );

      } else if (message.quick_reply.payload === 'PICKED_EARLY_MORNING' ||
                 message.quick_reply.payload === 'PICKED_MID_MORNING' ||
                 message.quick_reply.payload === 'PICKED_LATE_MORNING' ||
                 message.quick_reply.payload === 'PICKED_EARLY_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_MID_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_LATE_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_EARLY_EVENING' ||
                 message.quick_reply.payload === 'PICKED_MID_EVENING' ||
                 message.quick_reply.payload === 'PICKED_LATE_EVENING') {

        const timeOfDay = message.quick_reply.payload.substring(7);
        user.reminderTime = timeOfDay;
        user.snoozedReminderTime = timeOfDay;

        // Auto assign users a modality.
        autoAssignModality(user.hasAndroid, mode => {
          user.modality = mode;

          // Save user information to datastore
          database.updateUser(user, () => {
            reply(sender,
            {
              text: 'All set up, I will remind you around ' + convertToFriendlyName(timeOfDay) + '.'
            }
            );
          });
        });

      } else if (message.quick_reply.payload === 'PICKED_NO') {
        reply(sender, {
          text: 'No problem.'
        });

      } else if (message.quick_reply.payload.substring(0, 12) === 'CHANGE_TIME_') {
        const newTime = message.quick_reply.payload.substring(12);
        user.reminderTime = newTime;

        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender, {
            text: 'Changed reminder time to ' + convertToFriendlyName(user.reminderTime) + '.'
          });
        });

      } else if (message.quick_reply.payload === 'PICKED_SNOOZE_REMINDER') {
        let numberOfSnoozes = user.snoozesToday;

        let theReturnMessage = '';

        // Get current time and decide what next time period to snooze them to
        const Time = require('./time');

        // Set their reminder time to be the next time period
        const nextPeriod = Time.nextPeriodFromNow();
        if (nextPeriod) {
          user.snoozedReminderTime = nextPeriod;

          // Update number of snoozes counter
          numberOfSnoozes++;
          user.snoozesToday = numberOfSnoozes;

          // Track total number of snoozes
          user.totalNumberOfSnoozes++;

          theReturnMessage = 'Okay I will remind you around ' + convertToFriendlyName(nextPeriod) + '!';
        } else {
          // No next available period, so reset their snooze time
          user.snoozedReminderTime = user.reminderTime;
          user.totalNumberOfFailedSnoozes++;
          theReturnMessage = 'Sorry we can\'t snooze anymore today, try again tomorrow!';
        }

        let snoozeTimeChange = null;
        if (user.totalNumberOfSnoozes % snoozeAmountReminderTrigger === 0) {
          const newReminderTime = getNextReminderTime(user.reminderTime);
          // Send reminder to user asking them if they want to change their snooze time.
          snoozeTimeChange = {
            text: 'I have noticed that you have been snoozing a lot. Would you like me to change your reminder time to ' + convertToFriendlyName(newReminderTime) + ' (from ' + convertToFriendlyName(user.reminderTime) + ')?\nWon\'t affect todays snoozes.',
            quick_replies: [{
              content_type: 'text',
              title: 'Yes',
              payload: 'CHANGE_TIME_' + newReminderTime
            },
            {
              content_type: 'text',
              title: 'No',
              payload: 'PICKED_NO'
            }]
          };
        }

        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender, {
            text: theReturnMessage
          },
          snoozeTimeChange
          );
        });
      } else if (message.quick_reply.payload === 'PICKED_NOT_TODAY') {

        // Save the failed habit!
        const habit = {
          fbid: user.fbid,
          day: (new Date()).toUTCString().slice(5, -13), // Save date
          fullDay: (new Date()).toUTCString(), // Save date and time
          completed: false,
          reminderTime: user.reminderTime,
          numberOfSnoozes: user.snoozesToday,
          currentModality: user.modality,
          currentHabit: user.habit,
          currentStreak: user.streak
        };

        // Reset their streak
        user.streak = 0;

        // Revert back to normal reminder time
        user.snoozedReminderTime = user.reminderTime;

        // Reset number of snoozes
        user.snoozesToday = 0;

        // Save user information to datastore
        database.updateHabit(habit, () => {
          database.updateUser(user, () => {
            reply(sender, {
              text: 'There is always tomorrow.'
            });
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_COMPLETED_HABIT') {

        // Save the completion!
        const habit = {
          fbid: user.fbid,
          day: (new Date()).toUTCString().slice(5, -13),
          fullDay: (new Date()).toUTCString(), // Save date and time
          completed: true,
          reminderTime: user.reminderTime,
          numberOfSnoozes: user.snoozesToday,
          currentModality: user.modality,
          currentHabit: user.habit,
          currentStreak: user.streak
        };

        // Increase their streak
        user.streak = user.streak + 1;

        // Revert back to normal reminder time
        user.snoozedReminderTime = user.reminderTime;

        // Reset number of snoozes
        user.snoozesToday = 0;

        database.updateHabit(habit, () => {
          database.updateUser(user, () => {

            const rewardURL = 'https://infinite-falls-46264.herokuapp.com/rewards/' + String(user.modality).toLowerCase();

            const replyContent = {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'button',
                  text: 'Your ' + convertToFriendlyName(user.modality) + ' is waiting...',
                  sharable: false,
                  buttons: [{
                    type: 'web_url',
                    url: rewardURL,
                    title: 'Open Reward',
                    messenger_extensions: true,
                    webview_height_ratio: 'compact'
                  }]
                }
              }
            };

            // For the demo, enable inline rewards
            if (user.modality === 'VISUAL_INLINE' || user.modality === 'SOUND_INLINE' || user.modality === 'MP3_INLINE') {
              replyContent.attachment.payload.buttons = [{
                type: 'postback',
                title: 'Reveal Reward',
                payload: 'PICKED_' + user.modality + '_REWARD'
              }];
              reply(sender, replyContent);
            } else if (user.modality === 'VIBRATION') {
              console.log('Modality is vibration...');
              console.log(JSON.stringify(user));
              fitbit.sendVibration(user.fitbit_user_id, user.fitbit_tracker_id, user.fitbit_access_token, err => {
                if (err) {
                  console.log('Failed to send vibration reward to user:');
                  console.log(JSON.stringify(user));
                  console.log(err);
                  // TODO remove this reply
                  reply(sender, {
                    text: JSON.stringify(err)
                  });
                } else {
                  console.log('Vibration reward sent.');
                  reply(sender, replyContent, {
                    text: 'Enjoy your reward. I\'ll see you tomorrow!'
                  });
                }
              });
            } else {
                reply(sender, replyContent, {
                text: 'Enjoy your reward. I\'ll see you tomorrow!'
              });
            }
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_MP3_INLINE_REWARD') {
        reply(sender, {
          attachment: {
            type: 'audio',
            payload: {
              url: 'https://infinite-falls-46264.herokuapp.com' + rewards.getAudioReward(false)
            }
          }
        }, {
          text: 'Enjoy the reward. I\'ll see you tomorrow!'
        });
      } else if (message.quick_reply.payload === 'PICKED_VISUAL_INLINE_REWARD') {

        reply(sender, {
          attachment: {
            type: 'image',
            payload: {
              url: rewards.getVisualReward()
            }
          }
        }, {
          text: 'Enjoy the reward. I\'ll see you tomorrow!'
        });

      } else if (message.quick_reply.payload === 'PICKED_SOUND_INLINE_REWARD') {
        const msg = {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'open_graph',
              elements: [{
                url: rewards.getAudioReward(true)
              }]
            }
          }
        };
        reply(sender, msg, {
          text: 'Enjoy the tunes. I\'ll see you tomorrow!'
        });
      }
    }
  });
};

function getNextReminderTime(reminderTime) {
  const timePeriod = reminderTime.split('_')[0];

  if (String(reminderTime).includes('MORNING')) {
    return timePeriod + '_' + 'AFTERNOON';
  } else if (String(reminderTime).includes('AFTERNOON')) {
    return timePeriod + '_' + 'EVENING';
  }
  // Can't snooze if evening
  return null;
}

// Unused
// function getDifferenceInTimes(baseTime, extendedTime) {
//   if (baseTime === 'MORNING' && extendedTime === 'MORNING') {
//     return 0;
//   } else if (baseTime === 'MORNING' && extendedTime === 'AFTERNOON') {
//     return 1;
//   } else if (baseTime === 'MORNING' && extendedTime === 'EVENING') {
//     return 2;
//   } else if (baseTime === 'MORNING' && extendedTime === 'NIGHT') {
//     return 3;

//   } else if (baseTime === 'AFTERNOON' && extendedTime === 'AFTERNOON') {
//     return 0;
//   } else if (baseTime === 'AFTERNOON' && extendedTime === 'EVENING') {
//     return 1;
//   } else if (baseTime === 'AFTERNOON' && extendedTime === 'NIGHT') {
//     return 2;

//   } else if (baseTime === 'EVENING' && extendedTime === 'EVENING') {
//     return 0;
//   } else if (baseTime === 'EVENING' && extendedTime === 'NIGHT') {
//     return 1;
//   } else {
//     return 0;
//   }
// }

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/**
 * Returns:
 * VISUAL
 * SOUND
 * VIBRATION
 * VISUAL_AND_SOUND
 * VISUAL_AND_SOUND_AND_VIBRATION
 * Based on the number of currently assigned users.
 *
 */
function autoAssignModality(vibration, callback) {
  database.getAllModalities(modalities => {
    if (vibration) {
      if (getRandomInt(0, 10) === 0) {
        // 1 in 10 chance of automatically removing vibration and picking something else
        delete modalities.VIBRATION;
        delete modalities.VISUAL_AND_SOUND_AND_VIBRATION;
      }
    } else {
      delete modalities.VIBRATION;
      delete modalities.VISUAL_AND_SOUND_AND_VIBRATION;
    }

    console.log(modalities);
    const lowest = {
      amount: 999999999,
      mode: ''
    };

    for (const mode in modalities) {
      if (modalities[mode] < lowest.amount) {
        lowest.amount = modalities[mode];
        lowest.mode = mode;
      }
    }
    console.log(lowest);
    callback(lowest.mode);
  });
}

module.exports = {
  read,
  convertToFriendlyName,
  createQuickReply
};
