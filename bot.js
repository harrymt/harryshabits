
'use strict';

if (process.env.NODE_ENV === 'production') {
    var datastore = require('@google-cloud/datastore')();
} else {
  var datastore = require('@google-cloud/datastore')(
    { // Dev only
      projectId: process.env.PROJECT_ID,
      keyFilename: 'gcloud-key.json'
    }
  );
}


var findOrCreateUser = function (fbid, callback) {

  // Query our datastore for this fbid user
  const query = datastore.createQuery('User').filter('fbid', '=', fbid);
  datastore.runQuery(query, function(err, entities, info) {
    if(err) { console.log(err); console.log('Error running query, with User=fbid'); }

    console.log(entities.length + ' results found.');

    // Check if  more results may exist.
    if (entities.length === 0 && info.moreResults === datastore.NO_MORE_RESULTS) {
      console.log('No user found, creating one now...');

      // Not user found! Lets create one! Then return the fbid
      var userData = {
        fbid: fbid,
        reminder_time: null
      };

      var key = datastore.key('User');

      datastore.save({
        key: key,
        data: userData
      }, function(err) {
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

  // const user = {
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

var read = function (sender, message, reply) {

  // Let's find the user object
  findOrCreateUser(sender, function(user) {
    if(message.quick_reply !== undefined) {


    // STRETCHING
    if(message.quick_reply.payload === 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_STRETCH') {

        var replies = [
          {
            'content_type': 'text',
            'title': 'Morning',
            'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MORNING'
          },
          {
            'content_type': 'text',
            'title': 'Afternoon',
            'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_AFTERNOON'
          },
          {
            'content_type': 'text',
            'title': 'Evening',
            'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRINK_EVENING'
          }
        ];

        var msg = message;
        message = {
          text: 'Cool I love to ' + msg.text + '. What time do you want to ' + msg.text + '?',
          quick_replies: replies
        };

        reply(sender, message);

    } else if(message.quick_reply.payload === 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MORNING') {

        var replies = [
          {
            'content_type': 'text',
            'title': 'Visual',
            'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VISUAL'
          },
          {
            'content_type': 'text',
            'title': 'Sound',
            'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_SOUND'
          },
          {
            'content_type': 'text',
            'title': 'Vibration',
            'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VIBRATION'
          }
        ];

        var msg = message;
        message = {
          text: 'Nice, I will remind you around that time, what mode of reward would you like?',
          quick_replies: replies
        };

        reply(sender, message);

    } else if(message.quick_reply.payload === 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_VISUAL') {

        var msg = message;
        message = {
          text: 'Sweet. I will catch you later.'
        };

        reply(sender, message);

    }

    } else {

      // If they are new, then send them the standard reply:
      var replies = [
        {
          'content_type': 'text',
          'title': 'Stretch',
          'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_STRETCH'
        },
        {
          'content_type': 'text',
          'title': 'Meditate',
          'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_MEDITATE'
        },
        {
          'content_type': 'text',
          'title': 'Drink Water',
          'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRINK_WATER'
        }
      ];

      message = {
        text: 'Yo, I am Arthur. What habit are you tracking?',
        quick_replies: replies
      };

      reply(sender, message);
    }

  });
};



module.exports = {
	read: read
};
