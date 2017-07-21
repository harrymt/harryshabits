'use strict';

const snoozeAmountReminderTrigger = 5;

const database = require('./connectors/database');
const rewards = require('./generate-reward');
const Time = require('./time');

/**
 * Creates a quick reply.
 *
 * @param message String to send.
 * @param options ['reply1', 'reply2'] Array of buttons.
 * @returns {{text: *, quick_replies: Array}}
 */
const createQuickReply = (message, options) => {
  const replies = [];

  options.forEach(el => {
    replies.push(
      createQRItem(
        el,
        'PICKED_' + el.toUpperCase().split(' ').join('_')
        )
    );
  });

  return {
    text: message,
    quick_replies: replies
  };
};

/**
{
  text: 'Choose these options',
  quick_replies: [
    createQRItem('Hi', 'PICKED_GREETING_MESSAGE')
  ]
}
*/
const createQRItem = (text, payload) => {
  return {
    content_type: 'text',
    title: text,
    payload: payload
  };
};

/**
 * Convert to Pascal Case.
 *
 * @param str Unfriendly string.
 * @returns {string}
 */
const convertToFriendlyName = str => {
  if (str === undefined || str === null) {
    return '';
  }
  return str.split('_').join(' ').toLowerCase();
};

function displaySettings(user, sender, reply, debug) {
  const usr = user;

  if (debug) {
    delete usr.survey1a;
    delete usr.survey1b;
    delete usr.survey1c;
    delete usr.survey1d;
    delete usr.surveyModality1a;
    delete usr.surveyModality1b;
    delete usr.surveyModality1c;
    delete usr.surveyModality1d;
    reply(sender,
      {
        text: JSON.stringify(usr)
      },
      {
        text: JSON.stringify(Time.reminderTimes)
      }
    );
  } else {
    reply(sender,
      {
        text: 'Your reminder time is set to ' + convertToFriendlyName(user.reminderTime) + '.'
      }
    );
  }
}

function displayHelp(showDontKnow, sender, reply) {
  database.getGlobals(globals => {
    let firstMsg = 'There are ' + globals.remainingDays + ' days remaining in the study.';
    const secondMsg = 'If you have any questions email hm16679@my.bristol.ac.uk';
    if (globals.remainingDays === 0) {
      firstMsg = 'This is the last day of the study.';
    }
    if (globals.remainingDays < 0) {
      firstMsg = 'The study has ended.';
    }
    const sorryMsg = 'Sorry, I don\'t know how to respond to that. This is everything I have...';
    const qr = createQuickReply(
     'Here is the list of commands you can message me.',
      [
        'About',
        'Help'
      ]
    );
    if (showDontKnow) {
      reply(sender,{text: sorryMsg},{text: firstMsg},{text: secondMsg},qr);
    } else {
      reply(sender,{text: firstMsg},{text:secondMsg}, qr);
    }
  });
}

function displayAbout(sender, reply) {
  database.getGlobals(globals => {
    reply(sender,
      {
        text: 'Harry\'s Habits is a chatbot to help you form new healthy habits. It is part of a study that looks at habit formation.'
      },
      {
        text: 'The study lasts for 1 month, with 3 weeks of chatbot interaction followed by 1-week without, finishing with a survey.'
      },
      {
        text: 'It\'s conducted by the University of Bristol and approved by their ethics committee (reference id of 54701).'
      },
      {
        text: 'If you would like to quit at any time, press the Manage button at the top of the screen, then Manage Messages to block all communication.'
      },
      {
        text: 'For more information visit www.harrymt.com/harryshabits'
      }
    );
  });
}

function displayGetStarted(sender, reply) {
  reply(sender,
    {
      text: 'Welcome to Harry\'s Habits! Thank you for taking part in the study!'
    },
    {
      text: 'Before we start, can you tell me a bit more about yourself? (This data cannot be used to identify you and will not be shared). What is your gender?',
      quick_replies: [
        createQRItem('Male', 'PICKED_GENDER_MALE'),
        createQRItem('Female', 'PICKED_GENDER_FEMALE'),
        createQRItem('Non-Binary', 'PICKED_GENDER_NON_BINARY'),
        createQRItem('Don\'t Say', 'PICKED_GENDER_DONT_SAY')
      ]
    }
  );
}

function displayHowOld(user, sender, reply) {
  user.expectingAge = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: 'Thank you. How old are you?'
      }
    );
  });
}

function displayUsedHabitAppsBefore(sender, reply) {
  reply(sender,
    {
      text: 'Thanks, have you used any habit tracking apps or systems before?',
      quick_replies: [
        createQRItem('Yes', 'PICKED_HABIT_APPS_YES'),
        createQRItem('No', 'PICKED_HABIT_APPS_NO')
      ]
    }
  );
}

function displayWhatHabitsToDevelop(user, sender, reply) {
  user.expectingPreviousHabits = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: 'Cool, what did you track before?'
      }
    );
  });
}

function displayDidTheyWork(sender, reply) {
  reply(sender,
    {
      text: 'Okay, did they work?',
      quick_replies: [
        createQRItem('Yes', 'PICKED_PREVIOUS_HABIT_APPS_DID_WORK_YES'),
        createQRItem('No', 'PICKED_PREVIOUS_HABIT_APPS_DID_WORK_NO')
      ]
    }
  );
}

function displayPickHabit(sender, reply) {
  reply(sender,
    {
      text: 'Brill! Now onto the fun part. What type of habit would you like to complete?',
      quick_replies: [
        createQRItem('Type: Exercise', 'PICKED_HABIT_CATEGORY_PHYSICAL'),
        createQRItem('Type: Relaxation', 'PICKED_HABIT_CATEGORY_RELAXATION')
      ]
    }
  );
}

function displayPhysicalHabits(sender, reply) {
  reply(sender,
    {
      text: 'What specific habit would you like to pick?',
      quick_replies: [
        createQRItem('Stretching', 'PICKED_HABIT_STRETCH'),
        createQRItem('Press Ups', 'PICKED_HABIT_PRESS_UPS'),
        createQRItem('Plank', 'PICKED_HABIT_PLANK'),
        createQRItem('Back', 'PICKED_SHOW_HABITS_LIST')
      ]
    }
  );
}

function displayRelaxationHabits(sender, reply) {
  reply(sender,
    {
      text: 'What specific habit would you like to pick?',
      quick_replies: [
        createQRItem('Reading', 'PICKED_HABIT_READING'),
        createQRItem('Writing', 'PICKED_HABIT_WRITING'),
        createQRItem('Meditation', 'PICKED_HABIT_MEDITATION'),
        createQRItem('Back', 'PICKED_SHOW_HABITS_LIST')
      ]
    }
  );
}

function displayReminderTime(habit, sender, reply) {
  let habitInstructions = 'Okay, try and';
  if (habit === 'PLANK') {
    habitInstructions += ' hold your plank for at least 30 seconds.';
  } else if (habit === 'PRESS_UPS') {
    habitInstructions += ' complete at least 10 press-ups.';
  } else if (habit === 'STRETCH') {
    habitInstructions += ' stretch for at least 1 minute.';
  } else if (habit === 'READING') {
    habitInstructions += ' read for at least 5 minutes.';
  } else if (habit === 'WRITING') {
    habitInstructions += ' write for at least 5 minutes';
  } else if (habit === 'MEDITATION') {
    habitInstructions += ' close your eyes and take deep breaths for at least 5 minutes.';
  } else {
    habitInstructions = 'Great!';
  }

  reply(sender,
    {
      text: habitInstructions
    },
    {
      text: 'I am going to check every day to see how you\'re getting on with your habit.'
    },
    createQuickReply(
      'What time would you like me to message you?',
      [
        'Morning',
        'Afternoon',
        'Evening'
      ]
    )
  );
}

function displayNestedTime(timePeriod, sender, reply) {
  reply(sender,
    createQuickReply(
      'What time in the ' + timePeriod + '?',
      [
        'Early ' + timePeriod,
        'Mid ' + timePeriod,
        'Late ' + timePeriod
      ]
    )
  );
}

function displayExistingRoutine(habit, time, user, sender, reply) {

  let existingRoutines = [];
  if (time === 'MORNING') {
    existingRoutines = [
      'waking up',
      'eating breakfast',
      'arriving at work'
    ];
  } else if (time === 'AFTERNOON') {
    existingRoutines = [
      'eating lunch',
      'leaving work'
    ];
  } else {
    existingRoutines = [
      'leaving work',
      'eating dinner',
      'getting ready for bed'
    ];
  }

  let message = 'Habits are better formed when part of an existing routine. For example ' + habit + ' after ';
  for (let i = 0; i < existingRoutines.length; i++) {
    if ((i + 1) === existingRoutines.length) {
      message += 'or ' + existingRoutines[i] + '. ';
    } else {
      message += existingRoutines[i] + ', ';
    }
  }

  message += 'Please enter one of these contexts (e.g. \'' + existingRoutines[0] + '\') or enter your own below:';

  user.expectingHabitContext = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: message
      }
    );
  });
}

function displayInterview(sender, reply) {
  reply(sender,
    {
      text: 'At the end of the study, I\'d like to interview you to see how you got on. Would you be interested in this?',
      quick_replies: [
        createQRItem('Yes', 'PICKED_INTERVIEW_YES'),
        createQRItem('No', 'PICKED_INTERVIEW_NO')
      ]
    }
  );
}

function displayContactDetails(user, sender, reply) {
  user.expectingContactDetails = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: 'Thanks! What\'s your email? I\'ll use it to contact you to arrange the interview [nothing else]'
      }
    );
  });
}

function displayFinalStage(habit, time, sender, reply) {
  reply(sender,
    {
      text: 'All set up! I will check if you have completed your ' + convertToFriendlyName(habit) + ' tomorrow around ' + convertToFriendlyName(time) + '!'
    },
    {
      text: 'If you would like to quit at any time, press the Manage button at the top of the screen, then Manage Messages to block all communication.'
    },
    {
      text: 'Catch you tomorrow!'
    },
    {
      text: '(you can close messenger now)'
    }
  );
}

function displaySurvey1b(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I do without having to consciously remember',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_B_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_B_AGREE'),
        createQRItem('Neither', 'SURVEY1_B_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_B_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_B_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey1c(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I do without thinking',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_C_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_C_AGREE'),
        createQRItem('Neither', 'SURVEY1_C_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_C_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_C_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey1d(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I start doing before I realise I\'m doing it',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_D_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_D_AGREE'),
        createQRItem('Neither', 'SURVEY1_D_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_D_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_D_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displayModalityQuestion1a(sender, reply) {
  reply(sender,
    {
      text: 'The rewards helped me form my new habit',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_MODALITY_C_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_MODALITY_C_AGREE'),
        createQRItem('Neither', 'SURVEY1_MODALITY_C_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_MODALITY_C_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_MODALITY_C_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displayModalityQuestion1b(sender, reply) {
  reply(sender,
    {
      text: 'I enjoyed my rewards',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_MODALITY_B_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_MODALITY_B_AGREE'),
        createQRItem('Neither', 'SURVEY1_MODALITY_B_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_MODALITY_B_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_MODALITY_B_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displayModalityQuestion1c(sender, reply) {
  reply(sender,
    {
      text: 'I found my rewards annoying',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_MODALITY_A_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_MODALITY_A_AGREE'),
        createQRItem('Neither', 'SURVEY1_MODALITY_A_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_MODALITY_A_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_MODALITY_A_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displayModalityQuestion1d(sender, reply) {
  reply(sender,
    {
      text: 'I looked forward to my rewards',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY1_MODALITY_D_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY1_MODALITY_D_AGREE'),
        createQRItem('Neither', 'SURVEY1_MODALITY_D_NEITHER'),
        createQRItem('Disagree', 'SURVEY1_MODALITY_D_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY1_MODALITY_D_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displayAnyMoreFeedback(user, sender, reply) {
  reply(sender,
    {
      text: 'Thank you! Do you have any other comments or any other feedback you would like to share?',
      quick_replies: [
        createQRItem('Yes', 'PICKED_YES_MORE_FEEDBACK'),
        createQRItem('No', 'PICKED_NO_MORE_FEEDBACK')
      ]
    }
  );
}

function displayTakeFeedback(user, sender, reply) {
  user.expectingMoreFeedback = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: 'Type your comments below'
      }
    );
  });
}

function displaySurvey2b(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I do automatically',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_B_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_B_AGREE'),
        createQRItem('Neither', 'SURVEY2_B_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_B_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_B_STRONGLY_DISAGREE')
      ]
    }
  );
}


function displaySurvey2c(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I do without having to consciously remember',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_C_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_C_AGREE'),
        createQRItem('Neither', 'SURVEY2_C_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_C_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_C_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2d(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something that makes me feel weird if I do not do it',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_D_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_D_AGREE'),
        createQRItem('Neither', 'SURVEY2_D_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_D_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_D_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2e(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I do without thinking',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_E_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_E_AGREE'),
        createQRItem('Neither', 'SURVEY2_E_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_E_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_E_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2f(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something that would require effort not to do it',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_F_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_F_AGREE'),
        createQRItem('Neither', 'SURVEY2_F_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_F_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_F_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2g(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something that belongs to my daily routine',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_G_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_G_AGREE'),
        createQRItem('Neither', 'SURVEY2_G_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_G_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_G_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2h(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I start doing before I realize I\'m doing it',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_H_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_H_AGREE'),
        createQRItem('Neither', 'SURVEY2_H_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_H_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_H_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2i(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I would find hard not to do',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_I_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_I_AGREE'),
        createQRItem('Neither', 'SURVEY2_I_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_I_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_I_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2j(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I have no need to think about doing',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_J_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_J_AGREE'),
        createQRItem('Neither', 'SURVEY2_J_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_J_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_J_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2k(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something that is typically \'me\'',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_K_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_K_AGREE'),
        createQRItem('Neither', 'SURVEY2_K_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_K_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_K_STRONGLY_DISAGREE')
      ]
    }
  );
}

function displaySurvey2l(habit, context, sender, reply) {
  reply(sender,
    {
      text: convertToFriendlyName(habit) + ' after ' + convertToFriendlyName(context) + ' is something I have been doing for a long time',
      quick_replies: [
        createQRItem('Strongly agree', 'SURVEY2_L_STRONGLY_AGREE'),
        createQRItem('Agree', 'SURVEY2_L_AGREE'),
        createQRItem('Neither', 'SURVEY2_L_NEITHER'),
        createQRItem('Disagree', 'SURVEY2_L_DISAGREE'),
        createQRItem('Strongly disagree', 'SURVEY2_L_STRONGLY_DISAGREE')
      ]
    }
  );
}


function displayFinalFinalMessage(user, sender, reply) {
  reply(sender,
    {
      text: 'Thank you for participating in the study!'
    },
    {
      text: 'If you have any more comments or questions email hm16679@my.bristol.ac.uk'
    },
    {
      text: 'Goodbye! 👋'
    }
  );
}

function displayEndOfBotPeriod(user, sender, reply) {
  const msgA = 'Thank you for your time! You will be unable to use me to track habits anymore.';
  const msgB = 'If you have any further questions about the study, please contact hm16679@my.bristol.ac.uk.';
  const msgGoodbye = 'Goodbye! 👋';

  user.finished = true;
  database.updateUser(user, () => {
    if (user.interview) {
      reply(sender,{text: msgA},{text: msgB},{text: 'I will contact you in about a week to see how you\'re getting on with your habit.'},{text: msgGoodbye});
    } else {
      reply(sender,{text: msgA},{text: msgB},{text: msgGoodbye});
    }
  });
}

const read = function (sender, message, reply) {
  // Let's find the user object
  database.find(sender, user => {
    if (user.finished) {
      reply(sender,
        {
          text: 'The study is now over, please contact hm16679@my.bristol.ac.uk if you have any further questions.'
        }
      );
      return;
    }

    let firstTime = false;

    // If we have seen this user before, marked them as seen
    if (!user.seenBefore) {
      user.seenBefore = true;
    }

    // If user hasnt finish setting up, don't let them mark as completed.
    if (!user.habit || !user.modality || !user.reminderTime) {
      firstTime = true;
    }

    console.log(message);

    if (message.quick_reply === undefined) {
      if (message.text && user.expectingAge) {
        user.expectingAge = false;
        user.age = message.text;

        // Save user information to datastore
        database.updateUser(user, () => {
          displayUsedHabitAppsBefore(sender, reply);
        });
      } else if (message.text && user.expectingPreviousHabits) {
        user.expectingPreviousHabits = false;
        user.previousHabits = message.text;

        // Save user information to datastore
        database.updateUser(user, () => {
          displayDidTheyWork(sender, reply);
        });
      } else if (message.text && user.expectingHabitContext) {
        user.expectingHabitContext = false;
        user.habitContext = message.text;

        // Auto assign users a modality.
        autoAssignModality(mode => {
          user.modality = mode;

          // Save user information to datastore
          database.updateUser(user, () => {
            displayInterview(sender, reply);
          });
        });
      } else if (message.text && user.expectingContactDetails) {
        user.expectingContactDetails = false;
        user.email = message.text;

        // Save user information to datastore
        database.updateUser(user, () => {
          displayFinalStage(user.habit, user.reminderTime, sender, reply);
        });

      } else if (message.text && user.expectingMoreFeedback) {
        user.expectingMoreFeedback = false;
        user.moreFeedback = message.text;

        // Save user information to datastore
        database.updateUser(user, () => {
          displayEndOfBotPeriod(user, sender, reply);
        });
      // } else if (message.text && message.text.toLowerCase() === 'settings') {
      //   displaySettings(user, sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'help')) {
        displayHelp(false, sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'about')) {
        displayAbout(sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'harrymt')) {
        displaySettings(user, sender, reply, true);
      } else {
        if (firstTime) {
          displayGetStarted(sender, reply);
        } else if (message.sticker_id ||
          message.text.toLowerCase() === 'bye' ||
          message.text.toLowerCase() === 'thanks' ||
          message.text.toLowerCase() === 'thank you' ||
          message.text.toLowerCase() === 'sweet' ||
          message.text.toLowerCase() === 'great' ||
          message.text.toLowerCase() === 'cool' ||
          message.text.toLowerCase() === 'awesome') {
          // If user sends a sticker to no response, reply with a thumb
          reply(sender, { text: '👍' });
        } else if (message.text.toLowerCase() === 'sex' || message.text.toLowerCase() === 'dick') {
          // If user sends a sticker to no response, reply with a thumb
          reply(sender, { text: 'I\'m not that kind of bot...' });
        } else {
          // If users are trying to tell us to mark thier habit as completed, then issue the completed dialog
          // if (message.text && (String(message.text.toLowerCase()).includes('track') ||
          //     String(message.text.toLowerCase()).includes('mark') ||
          //     String(message.text.toLowerCase()).includes('habit') ||
          //     String(message.text.toLowerCase()).includes('complete') ||
          //     String(message.text.toLowerCase()).includes('did it'))) {

          //   // Check if users have already completed their habit today
          //   database.hasUserCompletedHabit(user, hasCompleted => {
          //     if (!hasCompleted) {
          //        reply(sender,
          //         createQuickReply(
          //           'Did you want to mark your daily habit ' + convertToFriendlyName(user.habit) + ' as completed?',
          //           [
          //             'Completed Habit'
          //           ]
          //         )
          //       );
          //     } else {
          //       reply(sender, { text: 'Well done on completing your habit today. I\'ll see you tomorrow!' });
          //     }
          //   });
          // } else {
          displayHelp(true, sender, reply);
          // }
        }
      }
    } else {
      if (message.quick_reply.payload === 'GET_STARTED_PAYLOAD') {
        displayGetStarted(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_ABOUT') {
        displayAbout(sender, reply);
      // } else if (message.quick_reply.payload === 'PICKED_SETTINGS') {
      //   displaySettings(user, sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_HELP') {
        displayHelp(false, sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_GENDER_MALE' ||
        message.quick_reply.payload === 'PICKED_GENDER_FEMALE' ||
        message.quick_reply.payload === 'PICKED_GENDER_NON_BINARY' ||
        message.quick_reply.payload === 'PICKED_GENDER_DONT_SAY') {

        user.gender = message.quick_reply.payload.substring(14);
        database.updateUser(user, () => {
          displayHowOld(user, sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_HABIT_APPS_YES') {
        user.hasUsedHabitAppsBefore = true;
        database.updateUser(user, () => {
          displayWhatHabitsToDevelop(user, sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_HABIT_APPS_NO') {
        user.hasUsedHabitAppsBefore = false;
        database.updateUser(user, () => {
          displayPickHabit(sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_PREVIOUS_HABIT_APPS_DID_WORK_YES') {
        user.hasUsedHabitAppsBeforeWorked = true;
        database.updateUser(user, () => {
          displayPickHabit(sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_PREVIOUS_HABIT_APPS_DID_WORK_NO') {
        user.hasUsedHabitAppsBeforeWorked = false;
        database.updateUser(user, () => {
          displayPickHabit(sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_SHOW_HABITS_LIST') {
        displayPickHabit(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_HABIT_CATEGORY_PHYSICAL') {
        displayPhysicalHabits(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_HABIT_CATEGORY_RELAXATION') {
        displayRelaxationHabits(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_HABIT_STRETCH' ||
        message.quick_reply.payload === 'PICKED_HABIT_PRESS_UPS' ||
        message.quick_reply.payload === 'PICKED_HABIT_PLANK') {

        user.habit = message.quick_reply.payload.substring(13);
        user.habitCategory = 'PHYSICAL';

        database.updateUser(user, () => {
          displayReminderTime(user.habit, sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_HABIT_READING' ||
        message.quick_reply.payload === 'PICKED_HABIT_WRITING' ||
        message.quick_reply.payload === 'PICKED_HABIT_MEDITATION') {

        user.habit = message.quick_reply.payload.substring(13);
        user.habitCategory = 'RELAXATION';

        database.updateUser(user, () => {
          displayReminderTime(user.habit, sender, reply);
        });

      } else if (message.quick_reply.payload === 'PICKED_BACK_TO_MODALITIES') {
        reply(sender,
          createQuickReply(
            'What mode of reward would you like?',
            [
              'Visual',
              'Sound',
              'Both'
            ]
          )
        );
      } else if (message.quick_reply.payload === 'PICKED_MORNING' ||
                 message.quick_reply.payload === 'PICKED_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_EVENING') {

        displayNestedTime(message.quick_reply.payload.substring(7).toLowerCase(), sender, reply);

      } else if (message.quick_reply.payload === 'PICKED_EARLY_MORNING' ||
                 message.quick_reply.payload === 'PICKED_MID_MORNING' ||
                 message.quick_reply.payload === 'PICKED_LATE_MORNING' ||
                 message.quick_reply.payload === 'PICKED_EARLY_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_MID_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_LATE_AFTERNOON' ||
                 message.quick_reply.payload === 'PICKED_EARLY_EVENING' ||
                 message.quick_reply.payload === 'PICKED_MID_EVENING' ||
                 message.quick_reply.payload === 'PICKED_LATE_EVENING') {

        user.reminderTime = message.quick_reply.payload.substring(7);
        user.snoozedReminderTime = user.reminderTime;
        database.updateUser(user, () => {
          displayExistingRoutine(user.habit, user.reminderTime.split('_').pop(), user, sender, reply);
        });

      } else if (message.quick_reply.payload === 'PICKED_INTERVIEW_NO' || message.quick_reply.payload === 'PICKED_INTERVIEW_YES') {
        user.interview = (message.quick_reply.payload.split('_').pop() === 'YES');

        if (user.interview) {
          displayContactDetails(user, sender, reply);
        } else {
          displayFinalStage(user.habit, user.reminderTime, sender, reply);
        }

      } else if (message.quick_reply.payload === 'PICKED_NO') {
        reply(sender, {
          text: 'No problem.'
        });

      } else if (message.quick_reply.payload.substring(0, 12) === 'CHANGE_TIME_') {
        const newTime = message.quick_reply.payload.substring(12);
        user.reminderTime = newTime;

        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender, {
            text: 'Changed reminder time to ' + convertToFriendlyName(user.reminderTime) + '.'
          });
        });

      } else if (message.quick_reply.payload === 'PICKED_NOT_YET') {
        let numberOfSnoozes = user.snoozesToday;

        let theReturnMessage = '';

        // Get current time and decide what next time period to snooze them to
        const Time = require('./time');

        // Set their reminder time to be the next time period
        const nextPeriod = Time.nextPeriodFromNow();
        if (nextPeriod !== null) {
          user.snoozedReminderTime = nextPeriod;

          console.log(nextPeriod);

          // Update number of snoozes counter
          numberOfSnoozes++;
          user.snoozesToday = numberOfSnoozes;

          // Track total number of snoozes
          user.totalNumberOfSnoozes++;

          theReturnMessage = 'Okay I will check on you later!';
        } else {
          // No next available period, so reset their snooze time
          user.snoozedReminderTime = user.reminderTime;
          user.totalNumberOfFailedSnoozes++;
          theReturnMessage = 'Sorry we can\'t snooze anymore today, try again tomorrow!';
        }

        let snoozeTimeChange = null;
        if (user.totalNumberOfSnoozes % snoozeAmountReminderTrigger === 0) {
          const newReminderTime = getNextReminderTime(user.reminderTime);
          // Send reminder to user asking them if they want to change their snooze time.
          snoozeTimeChange = {
            text: 'I have noticed that you have been snoozing a lot. Would you like me to change your reminder time to ' + convertToFriendlyName(newReminderTime) + ' (from ' + convertToFriendlyName(user.reminderTime) + ')?\nWon\'t affect today\'s snoozes.',
            quick_replies: [{
              content_type: 'text',
              title: 'Yes',
              payload: 'CHANGE_TIME_' + newReminderTime
            },
            {
              content_type: 'text',
              title: 'No',
              payload: 'PICKED_NO'
            }]
          };
        }

        // Save user information to datastore
        database.updateUser(user, () => {
          reply(sender, {
            text: theReturnMessage
          },
          snoozeTimeChange
          );
        });
      } else if (message.quick_reply.payload === 'PICKED_NOT_TODAY') {

        // Save the failed habit!
        const habit = {
          fbid: user.fbid,
          day: (new Date()).toUTCString().slice(5, -13), // Save date
          fullDay: (new Date()).toUTCString(), // Save date and time
          completed: false,
          reminderTime: user.reminderTime,
          numberOfSnoozes: user.snoozesToday,
          currentModality: user.modality,
          currentHabit: user.habit,
          currentStreak: user.streak
        };

        // Reset their streak
        user.streak = 0;

        // Revert back to normal reminder time
        user.snoozedReminderTime = user.reminderTime;

        // Reset number of snoozes
        user.snoozesToday = 0;

        // Save user information to datastore
        database.updateHabit(habit, () => {
          database.updateUser(user, () => {
            reply(sender, {
              text: 'There is always tomorrow.'
            });
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_COMPLETED_HABIT') {

        // Save the completion!
        const habit = {
          fbid: user.fbid,
          day: (new Date()).toUTCString().slice(5, -13),
          fullDay: (new Date()).toUTCString(), // Save date and time
          completed: true,
          reminderTime: user.reminderTime,
          numberOfSnoozes: user.snoozesToday,
          currentModality: user.modality,
          currentHabit: user.habit,
          currentStreak: user.streak
        };

        // Increase their streak
        user.streak = user.streak + 1;

        // Revert back to normal reminder time
        user.snoozedReminderTime = user.reminderTime;

        // Reset number of snoozes
        user.snoozesToday = 0;

        database.updateHabit(habit, () => {
          database.updateUser(user, () => {

            const rewardURL = 'https://infinite-falls-46264.herokuapp.com/rewards/' + String(user.modality).toLowerCase();

            const replyContent = {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'button',
                  text: 'Your reward is waiting...',
                  sharable: false,
                  buttons: [{
                    type: 'web_url',
                    url: rewardURL,
                    title: 'Open Reward',
                    messenger_extensions: true,
                    webview_height_ratio: 'compact'
                  }]
                }
              }
            };

            // For the demo, enable inline rewards
            if (user.modality === 'VISUAL_INLINE' || user.modality === 'SOUND_INLINE' || user.modality === 'MP3_INLINE') {
              replyContent.attachment.payload.buttons = [{
                type: 'postback',
                title: 'Reveal Reward',
                payload: 'PICKED_' + user.modality + '_REWARD'
              }];
              reply(sender, replyContent);
            } else if (user.modality === 'NONE') {
              reply(sender, {
                text: 'Thanks, I\'ll see you tomorrow'
              });
            } else {
                reply(sender, replyContent, {
                text: 'Enjoy your reward. I\'ll see you tomorrow!'
              });
            }
          });
        });
      } else if (message.quick_reply.payload === 'PICKED_MP3_INLINE_REWARD') {
        reply(sender, {
          attachment: {
            type: 'audio',
            payload: {
              url: 'https://infinite-falls-46264.herokuapp.com' + rewards.getAudioReward(false)
            }
          }
        }, {
          text: 'Enjoy the reward. I\'ll see you tomorrow!'
        });
      } else if (message.quick_reply.payload === 'PICKED_VISUAL_INLINE_REWARD') {

        reply(sender, {
          attachment: {
            type: 'image',
            payload: {
              url: rewards.getVisualReward()
            }
          }
        }, {
          text: 'Enjoy the reward. I\'ll see you tomorrow!'
        });

      } else if (message.quick_reply.payload === 'PICKED_SOUND_INLINE_REWARD') {
        const msg = {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'open_graph',
              elements: [{
                url: rewards.getAudioReward(true)
              }]
            }
          }
        };
        reply(sender, msg, {
          text: 'Enjoy the tunes. I\'ll see you tomorrow!'
        });
      } else if (message.quick_reply.payload === 'SURVEY1_A_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_A_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_A_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_A_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_A_STRONGLY_DISAGREE') {
        const s1a = message.quick_reply.payload.substring(10);
        user.survey1a = s1a;

        database.updateUser(user, () => {
          displaySurvey1b(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_B_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_B_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_B_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_B_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_B_STRONGLY_DISAGREE') {
        const s1c = message.quick_reply.payload.substring(10);
        user.survey1b = s1c;

        database.updateUser(user, () => {
          displaySurvey1c(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_C_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_C_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_C_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_C_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_C_STRONGLY_DISAGREE') {
        const s1c = message.quick_reply.payload.substring(10);
        user.survey1c = s1c;

        database.updateUser(user, () => {
          displaySurvey1d(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_D_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_D_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_D_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_D_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_D_STRONGLY_DISAGREE') {
        const s1d = message.quick_reply.payload.substring(10);
        user.survey1d = s1d;

        database.updateUser(user, () => {
          if (user.modality === 'NONE') {
            // Skip modality/reward questions
            displayAnyMoreFeedback(user, sender, reply);
          } else {
            displayModalityQuestion1a(sender, reply);
          }
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_A_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_STRONGLY_DISAGREE') {
        const dm1a = message.quick_reply.payload.substring(19);
        user.surveyModality1a = dm1a;

        database.updateUser(user, () => {
          displayModalityQuestion1b(sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_B_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_STRONGLY_DISAGREE') {
        const dm1b = message.quick_reply.payload.substring(19);
        user.surveyModality1b = dm1b;

        database.updateUser(user, () => {
          displayModalityQuestion1c(sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_C_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_STRONGLY_DISAGREE') {
        const s1mc = message.quick_reply.payload.substring(19);
        user.surveyModality1c = s1mc;

        database.updateUser(user, () => {
          displayModalityQuestion1d(sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_D_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_STRONGLY_DISAGREE') {
        const s1md = message.quick_reply.payload.substring(19);
        user.surveyModality1d = s1md;

        database.updateUser(user, () => {
          displayAnyMoreFeedback(user, sender, reply);
        });
      } else if (message.quick_reply.payload === 'PICKED_YES_MORE_FEEDBACK') {
        displayTakeFeedback(user, sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_NO_MORE_FEEDBACK') {
        displayEndOfBotPeriod(user, sender, reply);
      } else if (message.quick_reply.payload === 'SURVEY2_A_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_A_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_A_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_A_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_A_STRONGLY_DISAGREE') {
        user.survey2a = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2b(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_B_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_B_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_B_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_B_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_B_STRONGLY_DISAGREE') {
        user.survey2b = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2c(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_C_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_C_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_C_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_C_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_C_STRONGLY_DISAGREE') {
        user.survey2c = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2d(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_D_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_D_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_D_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_D_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_D_STRONGLY_DISAGREE') {
        user.survey2d = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2e(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_E_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_E_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_E_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_E_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_E_STRONGLY_DISAGREE') {
        user.survey2e = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2f(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_F_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_F_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_F_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_F_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_F_STRONGLY_DISAGREE') {
        user.survey2f = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2g(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_G_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_G_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_G_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_G_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_G_STRONGLY_DISAGREE') {
        user.survey2g = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2h(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_H_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_H_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_H_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_H_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_H_STRONGLY_DISAGREE') {
        user.survey2h = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2i(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_I_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_I_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_I_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_I_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_I_STRONGLY_DISAGREE') {
        user.survey2i = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2j(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_J_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_J_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_J_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_J_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_J_STRONGLY_DISAGREE') {
        user.survey2j = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2k(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_K_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_K_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_K_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_K_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_K_STRONGLY_DISAGREE') {
        user.survey2k = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displaySurvey2l(user.habit, user.habitContext, sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY2_L_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_L_AGREE' ||
          message.quick_reply.payload === 'SURVEY2_L_NEITHER' ||
          message.quick_reply.payload === 'SURVEY2_L_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY2_L_STRONGLY_DISAGREE') {
        user.survey2l = message.quick_reply.payload.substring(10);

        database.updateUser(user, () => {
          displayFinalFinalMessage(user, sender, reply);
        });
      }
    }
  });
};

function getNextReminderTime(reminderTime) {
  const timePeriod = reminderTime.split('_')[0];

  if (String(reminderTime).includes('MORNING')) {
    return timePeriod + '_' + 'AFTERNOON';
  } else if (String(reminderTime).includes('AFTERNOON')) {
    return timePeriod + '_' + 'EVENING';
  }
  // Can't snooze if evening
  return null;
}

// Unused
// function getDifferenceInTimes(baseTime, extendedTime) {
//   if (baseTime === 'MORNING' && extendedTime === 'MORNING') {
//     return 0;
//   } else if (baseTime === 'MORNING' && extendedTime === 'AFTERNOON') {
//     return 1;
//   } else if (baseTime === 'MORNING' && extendedTime === 'EVENING') {
//     return 2;
//   } else if (baseTime === 'MORNING' && extendedTime === 'NIGHT') {
//     return 3;

//   } else if (baseTime === 'AFTERNOON' && extendedTime === 'AFTERNOON') {
//     return 0;
//   } else if (baseTime === 'AFTERNOON' && extendedTime === 'EVENING') {
//     return 1;
//   } else if (baseTime === 'AFTERNOON' && extendedTime === 'NIGHT') {
//     return 2;

//   } else if (baseTime === 'EVENING' && extendedTime === 'EVENING') {
//     return 0;
//   } else if (baseTime === 'EVENING' && extendedTime === 'NIGHT') {
//     return 1;
//   } else {
//     return 0;
//   }
// }

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/**
 * Returns:
 * VISUAL
 * SOUND
 * VISUAL_AND_SOUND
* NONE
 * Based on the number of currently assigned users.
 *
 */
function autoAssignModality(callback) {
  database.getAllModalities(modalities => {
    const lowest = {
      amount: 999999999,
      mode: ''
    };

    for (const mode in modalities) {
      if (modalities[mode] < lowest.amount) {
        lowest.amount = modalities[mode];
        lowest.mode = mode;
      }
    }
    callback(lowest.mode);
  });
}

module.exports = {
  read,
  convertToFriendlyName,
  createQuickReply,
  createQRItem
};
