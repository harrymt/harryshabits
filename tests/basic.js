
(function () {
  'use strict';

  module.exports = function (callback) {
    console.log('Start of ' + __filename.slice(__dirname.length + 1));

    const request = require('request-promise');
    const options = {
      method: 'GET',
      uri: 'http://localhost:' + process.env.PORT
    };

    request(options)
      .then(response => {
        console.log(response);
        callback(false);
      })
      .catch(err => {
        console.log(err);
        callback(true);
      });
  };
})();
