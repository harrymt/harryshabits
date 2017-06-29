
'use strict';

// UTC time
const reminder_times = {
  early_morning: 7,
  mid_morning: 9,
  late_morning: 11,
  early_afternoon: 12,
  mid_afternoon: 14,
  late_afternoon: 16,
  early_evening: 18,
  mid_evening: 20,
  late_evening: 21,
  night: 22,
  newDay: 23
};

const fitbit = require('./connectors/fitbit');
const database = require('./database');
const rewards = require('./generate-reward');
const request = require('request');

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
      if (message.text && (message.text.toLowerCase() === 'stats' || message.text.toLowerCase() === 'settings')) {
        console.log(user.toString());
        reply(sender,
          {
            text: 'Your settings are: ' + JSON.stringify(user) + '\nTimes are ' + JSON.stringify(reminder_times)
          }
        );
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

              // Check if users have already completd their habit today
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
                reply(sender, { text: 'Sorry, I don\'t know how to respond to that.' });
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

        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender,
            createQuickReply(
              'Nice, I will remind you in the ' + convertToFriendlyName(timeOfDay) + ', what mode of reward would you like?',
              [
                'Visual',
                'Sound',
                'Vibration'
              ]
            )
          );
        });

      } else if (message.quick_reply.payload === 'PICKED_VIBRATION') {

        // Send them the fitbit connect modal
        const myFitbitURL = 'https://infinite-falls-46264.herokuapp.com/fitbitauth/' + user.fbid;

        reply(sender, {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: 'To enable Vibration rewards, you must have a FitBit. Would you like to connect to Fitbit?',
              sharable: false,
              buttons: [{
                type: 'web_url',
                url: myFitbitURL,
                title: 'Connect to Fitbit',
                messenger_extensions: true
              },
              {
                type: 'postback',
                title: 'Back',
                payload: 'PICKED_BACK_TO_MODALITIES'
              }]
            }
          }
        });

      } else if (message.quick_reply.payload === 'PICKED_VISUAL' ||
                 message.quick_reply.payload === 'PICKED_SOUND') {

        const modality = message.quick_reply.payload.substring(7);
        user.modality = modality;
        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender, {
            text: convertToFriendlyName(modality) + ' rewards are the best! I will drop you a message in the ' + convertToFriendlyName(user.reminderTime) + '!'
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_SNOOZE_REMINDER') {
        let numberOfSnoozes = user.snoozesToday;

        // Set their reminder time to be the next cron job!
        if (String(user.snoozedReminderTime).includes('EARLY')) {
          user.snoozedReminderTime = 'MID' + user.snoozedReminderTime.substring(5);
        } else if (String(user.snoozedReminderTime).includes('MID')) {
          user.snoozedReminderTime = 'LATE' + user.snoozedReminderTime.substring(3);
        }
        // Can't snooze if its the night or if its the late part of their timeslot

        // Update number of snoozes counter
        numberOfSnoozes++;
        user.snoozesToday = numberOfSnoozes;

        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender, {
            text: 'Okay I will remind you this ' + convertToFriendlyName(user.snoozedReminderTime) + '!'
          });
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
          currentHabit: user.habit
        };

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
          day: (new Date()).toUTCString(),
          fullDay: (new Date()).toUTCString(), // Save date and time
          completed: true,
          reminderTime: user.reminderTime,
          numberOfSnoozes: user.snoozesToday,
          currentModality: user.modality,
          currentHabit: user.habit
        };

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
                    title: 'Prepare Reward',
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

module.exports = {
  read,
  convertToFriendlyName,
  createQuickReply,
  time: reminder_times
};
