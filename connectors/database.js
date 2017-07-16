//
// Database module
//

'use strict';

if (process.env.NODE_ENV !== 'production') {
  // Load the .env file, that sets process.env.
  require('dotenv').load();
}

// Integrate with airtable
const base = require('airtable').base(process.env.AIRTABLE_BASE);

const getUsersByStreak = callback => {
  let users = [];
  base('Users').select({
    sort: [{field: "streak", direction: "desc"}]
  }).eachPage(function page(records, fetchNextPage) {
    for (let i = 0; i < records.length; i++) {
      const usr = records[i].fields;
      usr.index = i;
      users.push(usr);
    }
    console.log('fetching next page')
    fetchNextPage();
  }, function done(err) {
    if (err) {
      console.log(err);
      callback(false);
    } else {
      callback(users);
    }
  });
};

const getGlobals = callback => {
  base('Globals').select().firstPage((err, records) => {
    if (err) {
      console.error(err);
      callback(err);
    }
    records.forEach(record => {
      const g = record.fields;
      g.id = record.getId();
      console.log('Getting globals: ' + JSON.stringify(g));
      callback(g);
    });
  });
};

const updateGlobals = (globals, callback) => {
  console.log('Updating globals ' + JSON.stringify(globals));
  const callbackGlobals = globals;
  const id = callbackGlobals.id;
  delete globals.id;
  base('Globals').update(id, globals, (err, record) => {
    if (err) {
      console.error(err);
      throw new Error(err);
    }
    callbackGlobals.id = record.getId();
    callback(callbackGlobals);
  });
};

const hasUserCompletedHabit = (user, callback) => {
  const today = (new Date()).toUTCString().slice(5, -13); // Save date;

  base('Habits').select({
    filterByFormula: 'AND({day} = "' + today + '", {fbid} = "' + user.fbid + '")'
  }).eachPage(function page(records, fetchNextPage) {
    if (records !== undefined && records[0] !== undefined) {
      const habitFound = records[0].fields;
      console.log('User has completed their habit today:');
      console.log(habitFound);
      callback(true);
    } else {
      console.log('User has not completed their habit today.')
      callback(false);
    }
  }, function done(err) {
    if (err) {
      console.error(err);
      throw new Error(err);
    }
  });
};

const findOrCreateUser = (fbid, callback) => {
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
        habit: '',
        habitCategory: '',
        snoozesToday: 0,
        streak: 0,
        totalNumberOfSnoozes: 0,
        totalNumberOfFailedSnoozes: 0,
        hasAndroid: false,
        expectingAge: false,
        age: '',
        hasUsedHabitAppsBefore: false,
        expectingPreviousHabits: false,
        previousHabits: '',
        hasUsedHabitAppsBeforeWorked: false,
        expectingHabitContext: false,
        habitContext: '',
        phone: '',
        email: '',
        interview: false,
        expectingContactDetails: false,
        gender: '',
        expectingMoreFeedback: false,
        survey1a: '',
        survey1b: '',
        survey1c: '',
        survey1d: '',
        surveyModality1a: '',
        surveyModality1b: '',
        surveyModality1c: '',
        surveyModality1d: '',
        moreFeedback: '',
        finished: true
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
  const callbackHabit = habit;
  delete habit.id;
  console.log('Creating a new row in habit table...');
  base('Habits').create(habit, (err, record) => {
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

const getAllModalities = callback => {
  const modalities = {
    VISUAL: 0,
    SOUND: 0,
    VIBRATION: 0,
    VISUAL_AND_SOUND: 0,
    VISUAL_AND_SOUND_AND_VIBRATION: 0
  };
  base('Users').select({
    fields: ['modality'],
    sort: [{field: 'modality', direction: 'desc'}]
  }).eachPage(function page(records, fetchNextPage) {
    for (let i = 0; i < records.length; i++) {
      if (records[i].fields && records[i].fields.modality) {
        if (modalities[records[i].fields.modality] === undefined) {
          modalities[records[i].fields.modality] = 0;
        }
        modalities[records[i].fields.modality]++;
      }
    }
    console.log('fetching next page');
    fetchNextPage();
  }, function done(err) {
    if (err) {
      console.log(err);
      callback(false);
    } else {
      callback(modalities);
    }
  });
};

module.exports = {
  getUsersByStreak,
  updateUser,
  updateHabit,
  find: findOrCreateUser,
  hasUserCompletedHabit,
  getGlobals,
  updateGlobals,
  getAllModalities
};
