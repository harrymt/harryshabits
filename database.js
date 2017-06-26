//
// Database module
//

'use strict';

const hasUserCompletedHabit = (user, callback) => {
  const base = require('airtable').base('app5u2vOBmkjxLp4M');

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

module.exports = {
  updateUser,
  updateHabit,
  find: findOrCreateUser,
  hasUserCompletedHabit
};
