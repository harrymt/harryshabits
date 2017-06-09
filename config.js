
'use strict';

module.exports = {

  isReady: function(callback) {
    process.env.PORT = 5000;

    if(process.env.NODE_ENV === 'production') {
      var datastore = require('@google-cloud/datastore')();

      var key = datastore.key(
        ['Settings', datastore.int('5629499534213120')]
      );

      datastore.get(key, function(err, entity) {
        // Array of entity objects
        console.log(entity);
        console.log(err);

        process.env.FB_PAGE_TOKEN = entity.FB_PAGE_TOKEN;
        process.env.FB_VERIFY_TOKEN = entity.FB_VERIFY_TOKEN;
        process.env.WIT_TOKEN = entity.WIT_TOKEN;
        process.env.USER_ID = entity.USER_ID;

        callback(err);
      });

    } else {
      // Load the .env file, that sets process.env..
      require('dotenv').load();

      callback(false);
    }
  }

};
