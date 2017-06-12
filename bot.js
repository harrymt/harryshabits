
'use strict';

/**
 * Save user data in a memory object
 */
const sessions = {};

const findOrCreateUser = (fbid, callback) => {
  if (sessions[fbid] === undefined) {
    // User doesn't exist, lets create them
    const userData = {
      fbid,
      modality: null,
      seen_before: false,
      reminder_time: null,
      habit: null,
      completedHabits: []
    };

    sessions[fbid] = userData;
    callback(userData);
  } else {
    // User already exists
    callback(sessions[fbid]);
  }
};

/**
 * Creates a quick reply.
 *
 * @param message String to send.
 * @param options ['reply1', 'reply2'] Array of buttons.
 * @returns {{text: *, quick_replies: Array}}
 */
const createQuickReply = (message, options) => {
  let replies = [];

  options.forEach(function(el) {
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

const updateUser = (user, callback) => {
  if (sessions[user.fbid] === undefined) {
    // User doesn't exist, throw warning
    console.log('Warning user doesnt exist in session!');
    callback(user);
  } else {
    // User already exists, so lets update them
    sessions[user.fbid] = user;
    callback(user);
  }
};

/**
 * Convert to Pascal Case.
 *
 * @param str Unfriendly string.
 * @returns {string}
 */
const convertToFriendlyName = (str) => {
  return str.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ');
};

const read = function (sender, message, reply) {
  // Let's find the user object
  findOrCreateUser(sender, user => {

    let messageStart = '';

    // If we have seen this user before, send them a greeting
    if (user.seen_before) {
      messageStart = 'Welcome back! ';
    } else {
      user.seen_before = true;
      messageStart = 'Hello new person! ';
    }
    console.log(message);

    if (message.quick_reply === undefined) {
      if (message.text && (message.text.toLowerCase() === 'stats' || message.text.toLowerCase() === 'settings')) {
        console.log(user.toString());
        reply(sender,
          {
            text: 'Your settings are: ' + JSON.stringify(user)
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
        user.reminder_time = timeOfDay;
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
            text: convertToFriendlyName(modality) + ' rewards are the best! I will drop you a message in the ' + convertToFriendlyName(user.reminder_time) + '!'
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_SNOOZE') {

        // Set their reminder time to be the next cron job!
        if (user.reminder_time === 'MORNING') {
          user.reminder_time = 'AFTERNOON';
        } else if (user.reminder_time === 'AFTERNOON') {
          user.reminder_time = 'EVENING';
        } else if (user.reminder_time === 'EVENING') {
          user.reminder_time = 'NIGHT';
        }

        // Save user information to datastore
        updateUser(user, () => {
          reply(sender, {
            text: 'Okay I will remind you this ' + convertToFriendlyName(user.reminder_time) + '!'
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_NOT_TODAY') {
        // Save the failed habit!
        user.completedHabits.push({
          fbid: user.fbid,
          day: (new Date()).toLocaleString(),
          reward: user.modality,
          completed: false,
          reminder_time: user.reminder_time,
          habit: user.habit
        });

        // Save user information to datastore
        updateUser(user, () => {
          reply(sender, {
            text: 'There is always tomorrow.'
          });
        });

      } else if (message.quick_reply.payload === 'PICKED_COMPLETED_HABIT') {
        // Save the completion!
        user.completedHabits.push({
          fbid: user.fbid,
          day: (new Date()).toLocaleString(),
          reward: user.modality,
          completed: true,
          reminder_time: user.reminder_time,
          habit: user.habit
        });

        updateUser(user, () => {
          // Send the modality reward!
          if (user.modality === 'VISUAL') {
            reply(sender, {
              text: 'Awesome! Here is your Visual reward.'
            });

          } else if (user.modality === 'AUDIO') {
            reply(sender, {
              text: 'Awesome! Here is your Audio reward.'
            });

          } else if (user.modality === 'VIBRATION') {
            reply(sender, {
              text: 'Awesome! Here is your Vibration reward.'
            });
          }
        });
      }
    }
  });
};

module.exports = {
  read,
  updateUser,
  sessions,
  convertToFriendlyName,
  createQuickReply
};
