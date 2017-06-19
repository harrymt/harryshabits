
'use strict';

// UTC time
const reminder_times = {
  morning: 10,
  afternoon: 14,
  evening: 18,
  night: 21,
  newDay: 0
};

const findOrCreateUser = (fbid, callback) => {
  // Setup online database, airtable
  const base = require('airtable').base('app5u2vOBmkjxLp4M');
  console.log('Finding user with fbid ' + fbid);

  base('Users').select({
    filterByFormula: '({fbid} = "' + fbid + '")'
  }).eachPage(function page(records, fetchNextPage) {
    if (records !== undefined && records[0] !== undefined) {
      const userData = records[0].fields;
      userData.id = records[0].getId();
      callback(userData);
    } else {
      const userData = {
        fbid,
        modality: '',
        seenBefore: false,
        reminderTime: '',
        habit: ''
      };

      // User doesn't exist, so lets create them
      base('Users').create(userData, (err, record) => {
        if (err) {
          console.error(err);
          throw new Error(err);
        }
        console.log('Created user in database fbid: ' + fbid);
        userData.id = record.getId();
        callback(userData);
      });
    }
  }, function done(err) {
    if (err) {
      console.error(err);
      throw new Error(err);
    }
  });
};

const updateHabit = (habit, callback) => {
  const base = require('airtable').base('app5u2vOBmkjxLp4M');
  const callbackHabit = habit;
  delete habit.id;
  console.log('Creating a new row in habit table...');
  base('Habits').create(habit, function(err, record) {
    if (err) {
      console.error(err);
      throw new Error(err);
    }
    console.log('Added new habit');
    callbackHabit.id = record.getId();
    callback(callbackHabit);
  });
};

const updateUser = (user, callback) => {
  const base = require('airtable').base('app5u2vOBmkjxLp4M');

  const callbackUser = user;
  const userId = user.id;
  delete user.id;

  console.log('Updating user...');
  base('Users').update(userId, user, (err, record) => {
    if (err) {
      console.error(err);
      callback(null);
    }
    console.log('Updated user to:');
    console.log(record.fields);
    callbackUser.id = record.getId();
    callback(callbackUser);
  });
};

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
  findOrCreateUser(sender, user => {
    let messageStart = '';

    // If we have seen this user before, send them a greeting
    if (user.seenBefore) {
      messageStart = 'Welcome back! ';
    } else {
      user.seenBefore = true;
      messageStart = 'Hello new person! ';
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
        reply(sender,
          createQuickReply(
            messageStart + 'I\'m Arthur. I\'m not a talkative bot. What habit do you want to track?',
            [
              'Stretch',
              'Meditate',
              'Drink Water'
            ]
          )
        );
      }
    } else {
      if (message.quick_reply.payload === 'PICKED_STRETCH' ||
          message.quick_reply.payload === 'PICKED_MEDITATE' ||
          message.quick_reply.payload === 'PICKED_DRINK_WATER') {

        const habit = message.quick_reply.payload.substring(7);

        // Save habit against user
        user.habit = habit;

        // Save user information to datastore
        updateUser(user, () => {
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

      } else if (message.quick_reply.payload === 'PICKED_MORNING' ||
                 message.quick_reply.payload === 'PICKED_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_EVENING') {

        const timeOfDay = message.quick_reply.payload.substring(7);
        user.reminderTime = timeOfDay;
        user.snoozedReminderTime = timeOfDay;

        // Save user information to datastore
        updateUser(user, () => {
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
      } else if (message.quick_reply.payload === 'PICKED_VISUAL' ||
                 message.quick_reply.payload === 'PICKED_SOUND' ||
                 message.quick_reply.payload === 'PICKED_VIBRATION') {

        const modality = message.quick_reply.payload.substring(7);
        user.modality = modality;
        // Save user information to datastore
        updateUser(user, () => {
          reply(sender, {
            text: convertToFriendlyName(modality) + ' rewards are the best! I will drop you a message in the ' + convertToFriendlyName(user.reminderTime) + '!'
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_SNOOZE') {

        // Set their reminder time to be the next cron job!
        if (user.snoozedReminderTime === 'MORNING') {
          user.snoozedReminderTime = 'AFTERNOON';
        } else if (user.snoozedReminderTime === 'AFTERNOON') {
          user.snoozedReminderTime = 'EVENING';
        } else if (user.snoozedReminderTime === 'EVENING') {
          user.snoozedReminderTime = 'NIGHT';
        }

        // Save user information to datastore
        updateUser(user, () => {
          reply(sender, {
            text: 'Okay I will remind you this ' + convertToFriendlyName(user.snoozedReminderTime) + '!'
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_NOT_TODAY') {

        // Save the failed habit!
        const habit = {
          fbid: user.fbid,
          day: (new Date()).toUTCString(),
          completed: false,
          reminderTime: user.reminderTime,
          numberOfSnoozes: getDifferenceInTimes(user.reminderTime, user.snoozedReminderTime),
          currentModality: user.modality,
          currentHabit: user.habit
        };

        // Revert back to normal reminder time
        user.snoozedReminderTime = user.reminderTime;

        // Save user information to datastore
        updateHabit(habit, () => {
          updateUser(user, () => {
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
          completed: true,
          reminderTime: user.reminderTime,
          numberOfSnoozes: getDifferenceInTimes(user.reminderTime, user.snoozedReminderTime),
          currentModality: user.modality,
          currentHabit: user.habit
        };

        // Revert back to normal reminder time
        user.snoozedReminderTime = user.reminderTime;

        updateHabit(habit, () => {
          updateUser(user, () => {
            // Send the modality reward!
            if (user.modality === 'VISUAL') {
              reply(sender, {
                text: 'Awesome! Here is your Visual reward.'
              });
            } else if (user.modality === 'SOUND') {
              reply(sender, {
                text: 'Awesome! Here is your Audio reward.'
              });
            } else if (user.modality === 'VIBRATION') {
              reply(sender, {
                text: 'Awesome! Here is your Vibration reward.'
              });
            }
          });
        });
      }
    }
  });
};

function getDifferenceInTimes(baseTime, extendedTime) {
  if (baseTime === 'MORNING' && extendedTime === 'MORNING') {
    return 0;
  } else if (baseTime === 'MORNING' && extendedTime === 'AFTERNOON') {
    return 1;
  } else if (baseTime === 'MORNING' && extendedTime === 'EVENING') {
    return 2;
  } else if (baseTime === 'MORNING' && extendedTime === 'NIGHT') {
    return 3;

  } else if (baseTime === 'AFTERNOON' && extendedTime === 'AFTERNOON') {
    return 0;
  } else if (baseTime === 'AFTERNOON' && extendedTime === 'EVENING') {
    return 1;
  } else if (baseTime === 'AFTERNOON' && extendedTime === 'NIGHT') {
    return 2;

  } else if (baseTime === 'EVENING' && extendedTime === 'EVENING') {
    return 0;
  } else if (baseTime === 'EVENING' && extendedTime === 'NIGHT') {
    return 1;
  } else {
    return 0;
  }
}

module.exports = {
  read,
  updateUser,
  updateHabit,
  convertToFriendlyName,
  createQuickReply,
  time: reminder_times
};
