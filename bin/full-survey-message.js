'use strict';

const Bot = require('../bot');
const FB = require('../connectors/facebook');
const database = require('../connectors/database');

const startFullSurvey = callback => {
  const endOfStudy = {
    text: 'Hello again! I am back, it\'s been a week.'
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

  // Only gets users that have finished the setup
  database.getUsers(users => {
    for (let i = 0; i < users.length; i++) {
      console.log('Sending full survey to user ' + users[i].fbid);

      FB.newMessage(users[i].fbid, endOfStudy, (msg, data) => {
        if (data.error) {
          console.log('Error sending new fb message 1');
          console.log(msg);
          console.log(data);
        } else {
          FB.newMessage(users[i].fbid, analysisQuestion, (msg, data) => {
            if (data.error) {
              console.log('Error sending new fb message 2');
              console.log(msg);
              console.log(data);
            } else {
              startQR.text = Bot.convertToFriendlyName(users[i].habit) + ' after ' + Bot.convertToFriendlyName(users[i].habitContext) + startQR.text;
              FB.newMessage(users[i].fbid, startQR, (msg, data) => {
                if (data.error) {
                  console.log('Error sending new fb message 3');
                  console.log(msg);
                  console.log(data);
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports = {
  startFullSurvey
};
