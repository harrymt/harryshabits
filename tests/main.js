
//
// File to run all the tests
//

(function() {
  'use strict';

  // Start the chatbot server and run an initial test
  var bot_server = require('../index');
  require('./basic')(function(is_error) {
    if(is_error) { process.exit(1); }
    test_message_hello(); // should be the first test
  });


  function test_message_hello() {
    require('./message-hello')(function() {
      test_choose_habit(); // should be the next test
    });
  }

  function test_choose_habit() {
    require('./choose-habit')(function(is_error) {
      if(is_error) { process.exit(1); }
      test_choose_time();
    });
  }

  function test_choose_time() {
    require('./choose-time')(function(is_error) {
      if(is_error) { process.exit(1); }
      test_choose_modality();
    });
  }

  function test_choose_modality() {
    require('./choose-modality')(function(is_error) {
      if(is_error) { process.exit(1); }
      end_tests();
    });
  }

  function end_tests() {
    bot_server.shutdown();
    process.exit(0);
  }

})();