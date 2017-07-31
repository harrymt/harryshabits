
'use strict';

const database = require('../connectors/database');
const FB = require('../connectors/facebook');

function fbMessageUsers(users, globalStats, callback) {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    const localStats = 'You are ranked #' + (user.index + 1) + ', with a streak of ' + user.streak + '!\nWant a higher rank? Complete and track your habit!';

    FB.newMessage(user.fbid, {
      text: globalStats + '\n' + localStats
    },
    (msg, data) => {
      if (data.error) {
        console.log('Error sending new fb message');
        console.log(msg); // Log received info
        console.log(data); // Log recieved info
        return callback(false);
      }
      if (users.length === (i + 1)) {
        return callback(true);
      }
    });
  }
}

/**
 * Sends statistics about group.
 * Returns your streak and your group rank.
 *
 */
module.exports = {
  sendStats: callback => {

    database.getUsersByStreak(users => {
      const nPeople = users.length;
      console.log(users);
      console.log(users.length);
      const stats = 'There are ' + nPeople + ' people using Harrys Habits rn!';

      fbMessageUsers(users, stats, function(isError) {
        return callback({
          success: isError, data: stats
        });
      });
    });

  }
};
