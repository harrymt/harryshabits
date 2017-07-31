//
// Database module
//

'use strict';

if (process.env.NODE_ENV !== 'production') {
  // Load the .env file, that sets process.env.
  require('dotenv').load();
}

const pg = require('pg');
const db = new pg.Client({
  ssl: true,
  connectionString: process.env.DATABASE_URL
});

// TODO may have to have this inside of every function call below
// Yes do it!s
// e.g.
// db.connect((err, client) => {
//   if (err) {
//     throw err;
//   }
//   // client.query()...
// });
db.connect(err => {
  if (err) {
    console.log('Err connecting to db: ' + err);
  }
});

// For tests
const removeUserByFbid = (fbid, callback) => {
  db.query("delete from users where \"fbid\"='" + fbid + "';", (err, res) => {
    if (err) {
        console.error(err);
        return callback(err.error);
      } else {
        if (res.rowCount === 0) {
          console.log('No user found with fbid ' + fbid);
          return callback(false);
        } else {
          console.log('Successfully deleted user fbid ' + fbid);
          return callback(true);
        }
      }
  });
};

const findOrCreateUser = (fbid, callback) => {
  console.log('Finding user with fbid ' + fbid);
  db.query("select * from users where \"fbid\"='" + String(fbid) + "' limit 1;", (err, res) => {
    if (err) {
      console.error(err);
      callback(err.error);
    } else {
      // User found, just return the result
      if (res.rows.length > 0) {
        for (let i = 0, len = res.rows.length; i < len; i++) {
          callback(res.rows[i]);
        }
      } else {
        console.log('New user, creating user with fbid: ' + fbid);

        // Default values
        const values = [
          fbid,
          '', // modality
          false, // seenBefore
          '', // reminderTime
          '', // habit
          '', // habitCategory
          0, // snoozesToday
          0, // streak
          0, // totalNumberOfSnoozes
          0, // totalNumberOfFailedSnoozes
          false, // expectingAge
          '', // age
          false, // hasUsedHabitAppsBefore
          false, // expectingPreviousHabits
          '', // previousHabits
          false, // hasUsedHabitAppsBeforeWorked
          false, // expectingHabitContext
          '', // habitContext
          '', // email
          false, // interview
          false, // expectingContactDetails
          '', // gender
          false, // expectingMoreFeedback
          '', // survey1a
          '', // survey1b
          '', // survey1c
          '', // survey1d
          '', // surveyModality1a
          '', // surveyModality1b
          '', // surveyModality1c
          '', // surveyModality1d
          '', // moreFeedback
          false // finished
        ];

        const sql = "insert into users(" +
          "\"fbid\", " +
          "\"modality\", " +
          "\"seenBefore\", " +
          "\"reminderTime\", " +
          "\"habit\", " +
          "\"habitCategory\", " +
          "\"snoozesToday\", " +
          "\"streak\", " +
          "\"totalNumberOfSnoozes\", " +
          "\"totalNumberOfFailedSnoozes\", " +
          "\"expectingAge\", " +
          "\"age\", " +
          "\"hasUsedHabitAppsBefore\", " +
          "\"expectingPreviousHabits\", " +
          "\"previousHabits\", " +
          "\"hasUsedHabitAppsBeforeWorked\", " +
          "\"expectingHabitContext\", " +
          "\"habitContext\", " +
          "\"email\", " +
          "\"interview\", " +
          "\"expectingContactDetails\", " +
          "\"gender\", " +
          "\"expectingMoreFeedback\", " +
          "\"survey1a\", " +
          "\"survey1b\", " +
          "\"survey1c\", " +
          "\"survey1d\", " +
          "\"surveyModality1a\", " +
          "\"surveyModality1b\", " +
          "\"surveyModality1c\", " +
          "\"surveyModality1d\", " +
          "\"moreFeedback\", " +
          "\"finished\" " +
          ") values (" +
          "$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33) returning *;";

        db.query(sql, values, (err, res) => {
          if (err) {
              console.error(err);
              throw new Error(err);
            } else {
              for (let i = 0, len = res.rows.length; i < len; i++) {
                callback(res.rows[i]);
              }
            }
        });
      }
    }
  });
};


// Only get users that have finished setup
const getUsers = callback => {
  let users = [];
  db.query("SELECT * from users WHERE \"modality\"!='' AND \"habitContext\"!='' AND \"snoozedReminderTime\"!='';", (err, res) => {
    if (err) {
      console.error(err);
      callback(null);
    } else {
      for (let i = 0, len = res.rows.length; i < len; i++) {
        users.push(res.rows[i]);
      }
      callback(users);
    }
  });
};

const getUsersByTime = (timeOfDay ,callback) => {
  let users = [];
  db.query("SELECT * from users WHERE \"snoozedReminderTime\"='" + timeOfDay + "';", (err, res) => {
    if (err) {
      console.error(err);
      callback([]);
    } else {
      for (let i = 0, len = res.rows.length; i < len; i++) {
        users.push(res.rows[i]);
      }
      callback(users);
    }
  });
};


const getUsersByStreak = callback => {
  let users = [];
  db.query('SELECT * from users ORDER BY streak DESC;', (err, res) => {
    if (err) {
      console.error(err);
      callback(null);
    } else {
      for (let i = 0, len = res.rows.length; i < len; i++) {
        users.push(res.rows[i]);
      }
      callback(users);
    }
  });
};

const getGlobals = callback => {
  db.query('select * from globals limit 1', (err, res) => {
    if (err) {
      console.error(err);
      callback(err.error);
    } else {
      for (let i = 0, len = res.rows.length; i < len; i++) {
        callback(res.rows[i]);
      }
    }
  });
};

const updateGlobals = (globals, callback) => {
  db.query('update globals SET "remainingDays"=' + globals.remainingDays + ', "studyActive"=' + globals.studyActive + ' where id=1;', (err, res) => {
    if (err) {
        console.error(err);
        callback(err.error);
      } else {
        callback(globals);
      }
  });
};

const hasUserCompletedHabit = (user, callback) => {
  const today = (new Date()).toUTCString().slice(5, -13); // Save date;
  db.query("select count(*) from habits where \"day\" like '" + today + "' and \"fbid\"='" + user.fbid + "';", (err, res) => {
   if (err) {
      console.error(err);
      callback(err.error);
    } else {
      for (let i = 0, len = res.rows.length; i < len; i++) {
        callback(res.rows[i].count > 0);
      }
    }
  });
};

const updateHabit = (habit, callback) => {
  console.log('Creating a new row in habit table...');

  const values = [
    habit.fbid,
    habit.fullDay,
    habit.day,
    habit.competed,
    habit.reminderTime,
    habit.numberOfSnoozes,
    habit.currentModality,
    habit.currentHabit,
    habit.currentStreak
  ];

  db.query("insert into habits(\"fbid\", \"fullDay\", \"day\", \"completed\", \"reminderTime\", \"numberOfSnoozes\", \"currentModality\", \"currentHabit\", \"currentStreak\") values($1, $2, $3, $4, $5, $6, $7, $8, $9);", values, (err, res) => {
    if (err) {
        console.error(err);
        throw new Error(err);
      } else {
        callback(habit);
      }
  });
};

const updateUser = (user, callback) => {
  const id = user.fbid;
  if (user.fbid === null) {
    console.log(user);
    console.log('Cannot update user as no fbid');
    callback(user);
  } else {
    delete user.fbid;
  }
  console.log('Updating user...');
  let sql = 'update users set ';
  Object.keys(user).forEach((key, i) => {
    if (user[key] === null) {
      user[key] = false;
    }
    sql += "\"" + key + "\"=";
    if (typeof user[key] === 'boolean') {
      sql += user[key] + ",";
    } else {
      sql += "'" + user[key] + "',";
    }
  });
  console.log(sql);
  sql = sql.slice(0, -1);
  sql += " where \"fbid\"='" + id + "';";

  db.query(sql, (err, res) => {
    if (err) {
        console.error(err);
        throw new Error(err);
      } else {
        user.fbid = id;
        callback(user);
      }
  });
};

const getAllModalities = callback => {
  const modalities = {
    VISUAL: 0,
    SOUND: 0,
    VISUAL_AND_SOUND: 0,
    NONE: 0
  };

  db.query('select count(\"modality\"), "modality" from users group by "modality";', (err, res) => {
    if (err) {
      console.error(err);
      callback(err.error);
    } else {
      for (let i = 0, len = res.rows.length; i < len; i++) {
        modalities[res.rows[i].modality] = res.rows[i].count;
      }

      callback(modalities);
    }
  });
};

module.exports = {
  getUsersByStreak,
  getUsers,
  getUsersByTime,
  updateUser,
  updateHabit,
  find: findOrCreateUser,
  hasUserCompletedHabit,
  getGlobals,
  updateGlobals,
  getAllModalities,
  removeUserByFbid
};
