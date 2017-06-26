'use strict';

const router = require('express').Router();

const database = require('../database');
const FB = require('../connectors/facebook');
const Bot = require('../bot');

router.get('/', (req, res) => {
  if (req.query.state && req.query.code) {
    // Extract FBID
    const fbid = req.query.state;

    // Send request to get the access token
    const request = require('request-promise');
    const options = {
      method: 'POST',
      uri: 'https://api.fitbit.com/oauth2/token',
      form: {
        clientId: process.env.FITBIT_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: 'https://infinite-falls-46264.herokuapp.com/fitbit',
        code: req.query.code
      },
      headers: {
        Authorization: 'Basic ' + Buffer.from(process.env.FITBIT_CLIENT_ID + ':' + process.env.FITBIT_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    request(options)
      .then(response => {
        console.log(JSON.parse(response));
        const data = JSON.parse(response);

        // Let's find the user object
        database.find(fbid, user => {
          user.fitbit_access_token = data.access_token;
          user.fitbit_refresh_token = data.refresh_token;
          user.fitbit_user_id = data.user_id;
          user.modality = 'VIBRATION';

          const trackersGet = {
            method: 'GET',
            uri: 'https://api.fitbit.com/1/user/' + user.fitbit_user_id + '/devices.json',
            headers: {
              Authorization: 'Bearer ' + user.fitbit_access_token
            }
          };
          // Make an API call to get users devices
          request(trackersGet).then(trackerResponse => {
            const trackerData = JSON.parse(trackerResponse);
            console.log(trackerData);

            if (trackerData.length > 1) {
              // Need to select a tracker
              console.log('They have more than 1 tracker :(');
              // TODO implement multiple tracker selection
              res.send('<h1>You have more than 1 tracker...this is unsupported</h1>');
            } else if (trackerData.length === 0) {
              console.log('They don\'t have a fitbit ...');
              res.send('<h1>No Fitbit found</h1>');
            }

            // Set tracker id
            user.fitbit_tracker_id = trackerData[0].id;

            // Update user
            database.updateUser(user, () => {

              // Send them the next flow
              const msg = {
                text: 'Vibration rewards are all setup. Thanks for connecting with Fitbit! I will remind you in the ' + Bot.convertToFriendlyName(user.reminderTime) + ' about your ' + Bot.convertToFriendlyName(user.habit) + '!'
              };

              // Send them the next message, then close the web view
              FB.newMessage(fbid, msg, (msg, data) => {
                if (data.error) {
                  console.log('Error sending new fb message');
                  console.log(msg); // Log received info
                  console.log(data); // Log recieved info
                } else {
                  res.send(
                    '<script>' +
                    '(function(d, s, id){' +
                    '  var js, fjs = d.getElementsByTagName(s)[0];' +
                    '  if (d.getElementById(id)) {return;}' +
                    '  js = d.createElement(s); js.id = id;' +
                    '  js.src = "//connect.facebook.com/en_US/messenger.Extensions.js";' +
                    '  fjs.parentNode.insertBefore(js, fjs);' +
                    '}(document, "script", "Messenger"));' +
                    '</script>' +
                    '<h1>Successfully connected with Fitbit!</h1><script>window.extAsyncInit = function() {MessengerExtensions.requestCloseBrowser();};</script>'
                  );
                }
              });
            });
          }).catch(err => {
            console.log(err);
            res.send(err);
          });
        });
      })
      .catch(err => {
        console.log(err);
        res.send(err);
      });
  } else {
    res.send(
      '<h1>Please verify with Fitbit.</h1>'
    );
  }
});

/**
 * Authenticate user with Fitbit using users facebook id.
 */
router.get('/:fbid', (req, res) => {
  if (req.params.fbid) {
    res.redirect('https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=228F68&redirect_uri=https%3A%2F%2Finfinite-falls-46264.herokuapp.com%2Ffitbit&state=' + req.params.fbid + '&scope=settings&expires_in=3196800');
  } else {
    res.send(
      '<h1>Please specify a Facebook ID</h1>'
    );
  }
});

module.exports = router;