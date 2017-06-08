
//
// File to run all the tests
//

(function() {
  'use strict';

  // Start the chatbot server and run an initial test
  var bot_server = require('../index');
  require('./basic')(function() {
    test_user_flow(); // should be the first test
  });


  function test_xxxx() {
    require('./xxxx')(function() {
      test_user_flow(); // should be the next test
    });
  }

  function test_user_flow() {
    require('./user-flow')(function() {
      end_tests();
    });
  }


  function end_tests() {
    bot_server.shutdown();
  }


})();