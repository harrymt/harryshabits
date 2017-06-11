
(function () {
  'use strict';

  module.exports = function (callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    require('request')('http://localhost:' + process.env.PORT, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log(body);
        callback(false);
      } else {
        console.log(error);
        console.log(response);
        console.log(body);
        callback(true);
      }
    });
  };
})();
