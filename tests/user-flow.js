
(function() {
  'use strict';

  module.exports = function(callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    var Config = require('../config');
    var request = require('request');

    request("http://localhost:" + Config.PORT, function (error, response, body) {
       if (!error && response.statusCode === 200) {
          console.log(body);
          callback(1);
       } else {
          console.log(error);
          callback(-1);
       }
    });
  };
})();
