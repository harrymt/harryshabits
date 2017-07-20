
'use strict'

const Bot = require('../bot');
const FB = require('../connectors/facebook');

const startFullSurvey = callback => {
  const endOfStudy = {
    text: 'Hey its me again, its been a week.'
  };

  const analysisQuestion = {
    text: 'I have a few questions to ask you about your habit. What extent do you agree with the following:'
  };

  const startQR = {
    text: ' is something I do frequently',
    quick_replies: [
      Bot.createQRItem('Strongly agree', 'SURVEY2_A_STRONGLY_AGREE'),
      Bot.createQRItem('Agree', 'SURVEY2_A_AGREE'),
      Bot.createQRItem('Neither', 'SURVEY2_A_NEITHER'),
      Bot.createQRItem('Disagree', 'SURVEY2_A_DISAGREE'),
      Bot.createQRItem('Strongly disagree', 'SURVEY2_A_STRONGLY_DISAGREE')
    ]
  };

  const base = require('airtable').base(process.env.AIRTABLE_BASE);
  base('Users').select().eachPage(function page(records, fetchNextPage) {
    for (let i = 0; i < records.length; i++) {
      console.log('Sending full survey to user ' + records[i].get('fbid'));

      FB.newMessage(records[i].get('fbid'), endOfStudy, (msg, data) => {
        if (data.error) {
          console.log('Error sending new fb message');
          console.log(msg);
          console.log(data);
        } else {
          FB.newMessage(records[i].get('fbid'), analysisQuestion, (msg, data) => {
            if (data.error) {
              console.log('Error sending new fb message');
              console.log(msg);
              console.log(data);
            } else {
              startQR.text = Bot.convertToFriendlyName(records[i].get('habit')) + ' after ' + Bot.convertToFriendlyName(records[i].get('habitContext')) + startQR.text;
              FB.newMessage(records[i].get('fbid'), startQR,
                (msg, data) => {
                if (data.error) {
                  console.log('Error sending new fb message');
                  console.log(msg);
                  console.log(data);
                }
              });
            }
            console.log('Looking for next user');
            if ((i + 1) >= records.length) {
              // last record, fetch next page
              console.log('fetching next page');
              fetchNextPage();
            }
          });
        }
      });
    }
  }, function done(err) {
    if (err) {
      console.log(err);
      callback({ error: err, success: true });
    } else {
      console.log('Sent full survey messages.');
      callback({ success: true });
    }
  });
};

module.exports = {
  startFullSurvey
};
