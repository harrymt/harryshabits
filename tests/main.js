
//
// File to run all the tests
//

(function () {
  'use strict';

  // Start the chatbot server and run an initial test
  const botServer = require('../index');

  const waitTime = 500;

  require('./basic')(isError => {
    if (isError) {
      throw new Error('Test basic failed.');
    }
    setTimeout(() => {
      testMessageHello(); // Should be the first test
    }, waitTime);
  });

  function testMessageHello() {
    require('./message-hello')(isError => {
      if (isError) {
        throw new Error('Test message hello failed.');
      }
      setTimeout(() => {
        testChooseHabit(); // Should be the next test
      }, waitTime);
    });
  }

  function testChooseHabit() {
    require('./choose-habit')(isError => {
      if (isError) {
        throw new Error('Test choose habit failed.');
      }
      setTimeout(() => {
        testChooseTime();
      }, waitTime);
    });
  }

  function testChooseTime() {
    require('./choose-time')(isError => {
      if (isError) {
        throw new Error('Test choose time failed.');
      }
      setTimeout(() => {
        testChooseNestedTime();
      }, waitTime);
    });
  }

  function testChooseNestedTime() {
    require('./choose-nested-time')(isError => {
      if (isError) {
        throw new Error('Test choose nested time failed.');
      }
      setTimeout(() => {
        testChooseButtonBack();
      }, waitTime);
    });
  }

  function testChooseButtonBack() {
    require('./choose-button-back')(isError => {
      if (isError) {
        throw new Error('Test choose button back failed.');
      }
      setTimeout(() => {
        testChooseModality();
      }, waitTime);
    });
  }

  function testChooseModality() {
    require('./choose-modality')(isError => {
      if (isError) {
        throw new Error('Test choose modality failed.');
      }
      setTimeout(() => {
        testEnd();
      }, waitTime);
    });
  }

  function testEnd() {
    console.log('Finished processing tests...waiting for promises...');
    botServer.shutdown();
  }
})();
