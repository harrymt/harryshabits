
'use strict';

function getDatastore() {
  if (process.env.NODE_ENV === 'production') {
    return require('@google-cloud/datastore')();
  }

  // Development
  return require('@google-cloud/datastore')(
    {
      credentials: {
        client_email: process.env.GCLOUD_CLIENT_EMAIL,
        private_key:
          '-----BEGIN PRIVATE KEY-----\n' +
          process.env.GCLOUD_PRIVATE_KEY +
          '\n-----END PRIVATE KEY-----\n'
      },
      projectId: process.env.PROJECT_ID
    }
  );
}

/**
 * Update datastore with new user information
 *
 * @param user
 * @param callback
 */
const updateUser = (user, callback) => {
  const datastore = getDatastore();

  // Query our datastore for this fbid user
  const query = datastore.createQuery('User').filter('fbid', '=', user.fbid);
  datastore.runQuery(query, (err, entities, info) => {
    if (err) {
      console.log(err);
      console.log('Error running query, with User=fbid');
      throw new Error('Error running query with User=' + user.fbid);
    }

    console.log(entities.length + ' users found.');

    // Check if  more results may exist.
    if (entities.length === 0 && info.moreResults === datastore.NO_MORE_RESULTS) {
      console.log('No user found, error!');
      throw new Error('Error updating User=' + user.fbid + ', no user found!');
    } else {
      console.log('User found in datastore.');
      console.log(entities[0]);

      console.log('Updating with new user info...');
      console.log(user);

      const key = datastore.key(['User', user.fbid]);
      datastore.save({
        key,
        data: user
      }, err => {
        if (!err) {
          // The user is now published!
          callback();
        } else {
          console.log(err);
          throw new Error('Error updating User=' + user.fbid + ': err: ' + err);
        }
      });
    }
  });
};

const findOrCreateUser = (fbid, callback) => {
  const datastore = getDatastore();

  // Query our datastore for this fbid user
  const query = datastore.createQuery('User').filter('fbid', '=', fbid);
  datastore.runQuery(query, (err, entities, info) => {
    if (err) {
      console.log(err);
      console.log('Error running query, with User=fbid');
      throw new Error('Error running query with User=' + fbid);
    }

    console.log(entities.length + ' results found.');

    // Check if  more results may exist.
    if (entities.length === 0 && info.moreResults === datastore.NO_MORE_RESULTS) {
      console.log('No user found, creating one now...');

      // Not user found! Lets create one! Then return the fbid
      const userData = {
        fbid,
        modality: null,
        seen_before: false,
        reminder_time: null
      };

      const key = datastore.key(['User', fbid]);

      datastore.save({
        key,
        data: userData
      }, err => {
        if (!err) {
          // The user is now published!
          callback(userData);
        }
      });
    } else {
      console.log('User found.');
      console.log(entities[0]);

      // Return the actual user object
      callback(entities[0]);
    }
  });
};

/**
 * Creates a quick reply.
 *
 * @param message String to send.
 * @param options ['reply1', 'reply2'] Array of buttons.
 * @returns {{text: *, quick_replies: Array}}
 */
function createQuickReply(message, options) {
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
}

/**
 * Convert to Pascal Case.
 *
 * @param str Unfriendly string.
 * @returns {string}
 */
function convertToFriendlyName(str) {
  console.log('Converting... : ' + str);
  return str.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join(' ');
}

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

    if (message.quick_reply === undefined) {
      if (message && (message.toLowerCase() === 'stats' || message.toLowerCase() === 'settings')) {
        console.log(user.toString());
        reply(sender,
          { message: 'Your settings are: ' + JSON.stringify(user) }
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
            message: modality + ' rewards are the best! See you later!'
          });
        });
      }
    }
  });
};

module.exports = {
  read,
  updateUser
};
