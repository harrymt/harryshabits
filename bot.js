
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
        reminder_time: null
      };

      const key = datastore.key('User');

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
      console.log(entities);

      // Return the actual user object
      callback(entities);
    }
  });

  // Const user = {
  //   key: datastore.key(['Users', 'User', 'Harry']),
  //   data: {
  //     fbid: 123,
  //     msg_time: 'morning'
  //   }
  // };

  // datastore.save(user).then(() => {
  //   console.log(`Saved ${user.key.name}: ${user.data.msg_time}`);
  // })
  // .catch((err) => {
  //   console.error('ERROR:', err);
  // });

  // // DOES USER SESSION ALREADY EXIST?
  // Object.keys(sessions).forEach(i => {
  //   if (sessions[i].fbid === fbid) {
  //     console.log('User session already exists with fb');
  //     // YUP
  //     sessionId = i;
  //   }
  // });

  // // No session so we will create one
  // if (!sessionId) {
  //   sessionId = new Date().toISOString();
  //   console.log('User session does not exist, creating one...');

  //   sessions[sessionId] = {
  //     fbid: fbid,
  //     context: {
  //       _fbid_: fbid
  //     }
  //   };
  // }

  // return sessionId;
};

const read = function (sender, message, reply) {
  // Let's find the user object
  findOrCreateUser(sender, user => {
    if (message.quick_reply === undefined) {
      // If they are new, then send them the standard reply:
      const replies = [
        {
          content_type: 'text',
          title: 'Stretch',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_STRETCH'
        },
        {
          content_type: 'text',
          title: 'Meditate',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MEDITATE'
        },
        {
          content_type: 'text',
          title: 'Drink Water',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRINK_WATER'
        }
      ];

      message = {
        text: 'Yo, I am Arthur. What habit are you tracking?',
        quick_replies: replies
      };

      reply(sender, message);
    } else {
      // STRETCHING
      if (message.quick_reply.payload === 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_STRETCH') {
          const replies = [
            {
              content_type: 'text',
              title: 'Morning',
              payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MORNING'
            },
            {
              content_type: 'text',
              title: 'Afternoon',
              payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_AFTERNOON'
            },
            {
              content_type: 'text',
              title: 'Evening',
              payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRINK_EVENING'
            }
          ];

          const msg = message;
          message = {
            text: 'Cool I love to ' + msg.text + '. What time do you want to ' + msg.text + '?',
            quick_replies: replies
          };

          reply(sender, message);

      } else if (message.quick_reply.payload === 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MORNING') {
          const replies = [
            {
              content_type: 'text',
              title: 'Visual',
              payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VISUAL'
            },
            {
              content_type: 'text',
              title: 'Sound',
              payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_SOUND'
            },
            {
              content_type: 'text',
              title: 'Vibration',
              payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VIBRATION'
            }
          ];

          message = {
            text: 'Nice, I will remind you around that time, what mode of reward would you like?',
            quick_replies: replies
          };

          reply(sender, message);

      } else if (message.quick_reply.payload === 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VISUAL') {
        message = {
          text: 'Sweet. I will catch you later.'
        };
        reply(sender, message);
      }
    }
  });
};

module.exports = {
  read
};
