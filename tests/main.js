

//
// File to run all the tests
//

(function () {
  'use strict';

  // Start the chatbot server and run an initial test
  const botServer = require('../index');
  const waitTime = 2000;

  const t = require('./test-utils');
  const ps = [];

  function sleep() {
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }

  start();
  function start() {

    // Remove my test user from database
    removeTestUser(r => {

      setTimeout(() => {
         hi().then(setTimeout(() => {
         male().then(setTimeout(() => {
         age23().then(setTimeout(() => {
         usedHabitSystems().then(setTimeout(() => {
         trackedTime().then(setTimeout(() => {
         theyDidWork().then(setTimeout(() => {
         choosePhysicalHabit().then(setTimeout(() => {
         chooseStretchHabit().then(setTimeout(() => {
         chooseMorning().then(setTimeout(() => {
         chooseEarlyMorning().then(setTimeout(() => {
         chooseMorning().then(setTimeout(() => {
         myExistingRoutine().then(setTimeout(() => {
         availableForInterview().then(setTimeout(() => {
         email().then(setTimeout(() => {
         about().then(setTimeout(() => {
         settings().then(setTimeout(() => {
         help().then(setTimeout(() => {

        thumb()
        .then(setTimeout(() => {
          process.exit(0)
        }, waitTime)
        ).catch(console.log(console.error) && process.exit(1));

        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
        }, waitTime));
      }, waitTime);

    });
  }


  function removeTestUser(callback) {
    require('../connectors/database').removeUserByFbid(process.env.USER_ID, s => {
      callback(s);
    });
  }

  function hi() {
    return t.message({
      text: 'Hi'
    });
  }

  function male() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_GENDER_MALE'
      }
    });
  }

  function age23() {
    return t.message({
      text: '23'
    });
  }

  function usedHabitSystems() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_HABIT_APPS_YES'
      }
    });
  }

  function trackedTime() {
    return t.message({
      text: 'Tracking some time'
    });
  }

  function theyDidWork() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_PREVIOUS_HABIT_APPS_DID_WORK_YES'
      }
    });
  }

  function choosePhysicalHabit() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_HABIT_CATEGORY_PHYSICAL'
      }
    });
  }

  function chooseStretchHabit() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_HABIT_STRETCH'
      }
    });
  }

  function chooseMorning() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_MORNING'
      }
    });
  }

  function chooseEarlyMorning() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_EARLY_MORNING'
      }
    });
  }

  function myExistingRoutine() {
    return t.message({
      text: 'Waking up'
    });
  }

  function availableForInterview() {
    return t.message({
      quick_reply: {
        payload: 'PICKED_INTERVIEW_YES'
      }
    });
  }

  function email() {
    return t.message({
      text: 'Robot@me.com'
    });
  }

  function thumb() {
    return t.message({
      sticker_id: 123
    });
  }

  function about() {
    return t.message({
      text: 'about'
    });
  }

  function settings() {
    return t.message({
      text: 'settings'
    });
  }

  function help() {
    return t.message({
      text: 'help'
    });
  }
})();
