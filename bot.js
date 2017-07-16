'use strict';

const snoozeAmountReminderTrigger = 5;

const fitbit = require('./connectors/fitbit');
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
  // Remove some stuff so we arent over the 640 character limit
  delete usr.fitbit_user_id;
  delete usr.fitbit_access_token;
  delete usr.fitbit_tracker_id;
  delete usr.fitbit_refresh_token;

  if (debug) {
    reply(sender,
      {
        text: JSON.stringify(usr)
      },
      {
        text: '\nTimes are ' + JSON.stringify(Time.reminderTimes)
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

function displayAbout(sender, reply) {

  database.getGlobals(globals => {
    reply(sender,
      {
        text: 'Information about the trial.'
      },
      {
        text: 'TODO'
      }
    );
  });
}

function displayHelp(sender, reply) {
  database.getGlobals(globals => {
    let firstMsg = 'There are ' + globals.remainingDays + ' days remaining in the trial.';
    if (globals.remainingDays === 0) {
      firstMsg = 'This is the last day of the trail.';
    }
    if (globals.remainingDays < 0) {
      firstMsg = 'The trail has ended.';
    }
    reply(sender,
      {
        text: 'Sorry, I don\'t know how to respond to that. This is everything I have...'
      },
      {
        text: firstMsg
      },
      createQuickReply(
       'Here are the list of commands you can message me.',
        [
          'About',
          'Settings',
          'Help'
        ]
      )
    );
  });
}

function displayGetStarted(sender, reply) {
  reply(sender,
    {
      text: 'Welcome to Harry\'s Habits! I am a chatbot designed to help you form a new healthy habit during a 30-day trial.'
    },
    {
      text: 'The trial looks at forming new habits and has been approved by the University of Bristol ethics committee (ref id: 54701).'
    },
    {
      text: 'If you would like to quit at any time, press the Manage button at the top of the screen, then Manage Messages to block all communication.'
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
      text: 'Okay, what new daily habit would you like to complete?',
      quick_replies: [
        createQRItem('Physical Habit', 'PICKED_HABIT_CATEGORY_PHYSICAL'),
        createQRItem('Relaxing Habit', 'PICKED_HABIT_CATEGORY_RELAXATION')
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
        createQRItem('Plank', 'PICKED_HABIT_PLANK')
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
        createQRItem('Meditation', 'PICKED_HABIT_MEDITATION')
      ]
    }
  );
}

function displayReminderTime(habit, sender, reply) {
  reply(sender,
    {
      text: 'That\'s a good one! I will check your progress every day.'
    },
    createQuickReply(
      'What time would you like me to check on you?',
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

function displayExistingRoutine(time, user, sender, reply) {

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

  let message = 'Habits are better formed when part of an existing routine. For example ';
  for (let i = 0; i < existingRoutines.length; i++) {
    if ((i + 1) === existingRoutines.length) {
      message += 'or ' + existingRoutines[i] + '. ';
    } else {
      message += existingRoutines[i] + ', ';
    }
  }

  message += 'Think of 1 existing routine you want to use?';

  user.expectingHabitContext = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: message
      }
    );
  });
}

function displayWhatPhone(sender, reply) {
  reply(sender,
    {
      text: 'One last thing, what phone do you have?',
      quick_replies: [
        createQRItem('iPhone', 'PICKED_PHONE_IPHONE'),
        createQRItem('Android', 'PICKED_PHONE_ANDROID'),
        createQRItem('Don\'t know', 'PICKED_PHONE_DONTKNOW'),
        createQRItem('Other', 'PICKED_PHONE_OTHER')
      ]
    }
  );
}

function displayInterview(sender, reply) {
  reply(sender,
    {
      text: 'At the end of the 30-day trail, I\'d like to interview you to see how you got on. Would you be available for this?',
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
      text: 'All set up! I will remind you about your ' + convertToFriendlyName(habit) + ' tomorrow around ' + convertToFriendlyName(time) + '!'
    },
    {
      text: 'Catch you tomorrow!'
    }
  );
}

function displaySurvey1b(habit, context, sender, reply) {
  reply(sender,
    {
      text: habit + ' after ' + context + ' is something I do without having to consciously remember.',
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
      text: habit + ' after ' + context + ' is something I do without thinking.',
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
      text: habit + ' after ' + context + ' is something I start doing before I realise I\'m doing it.',
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
      text: 'I found my rewards annoying.',
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

function displayModalityQuestion1b(sender, reply) {
  reply(sender,
    {
      text: 'I enjoyed my rewards.',
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
      text: 'The rewards helped.',
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

function displayModalityQuestion1d(sender, reply) {
  reply(sender,
    {
      text: 'I looked forward to my rewards.',
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
  user.expectingMoreFeedback = true;
  database.updateUser(user, () => {
    reply(sender,
      {
        text: 'Thank you! Message me anymore feedback you have now:'
      }
    );
  });
}

function displayEndOfBotPeriod(user, sender, reply) {
  const msgA = 'Thank you for your time! You will be unable to use me to track habits anymore.';
  const msgB = 'If you have any further questions about the study, please contact me at hm16679@my.bristol.ac.uk.';
  let msgB1 = '';
  const msgC = 'Goodbye!';
  const msgD = '👋';

  if (user.interview) {
    msgB1 = ' I will contact you in about a week to see how you\'re getting on with your habit.';
  }

  reply(sender,
    {
      text: msgA
    },
    {
      text: msgB + msgB1
    },
    {
      text: msgC
    },
    {
      text: msgD
    }
  );
}

const read = function (sender, message, reply) {
  // Let's find the user object
  database.find(sender, user => {
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

        // Save user information to datastore
        database.updateUser(user, () => {
          displayWhatPhone(sender, reply);
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
      } else if (message.text && message.text.toLowerCase() === 'settings') {
        displaySettings(user, sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'help')) {
        displayHelp(sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'about')) {
        displayAbout(sender, reply);
      } else if (message.text && (message.text.toLowerCase() === 'harrymt')) {
        displaySettings(user, sender, reply, true);
      } else {
        if (firstTime) {
          displayGetStarted(sender, reply);
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
          displayHelp(sender, reply);
          // }
        }
      }
    } else {
      if (message.quick_reply.payload === 'GET_STARTED_PAYLOAD') {
        displayGetStarted(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_ABOUT') {
        displayAbout(sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_SETTINGS') {
        displaySettings(user, sender, reply);
      } else if (message.quick_reply.payload === 'PICKED_HELP') {
        displayHelp(sender, reply);
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
              'Vibration'
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
          displayExistingRoutine(user.reminderTime, user, sender, reply);
        });

      } else if (message.quick_reply.payload === 'PICKED_PHONE_IPHONE' ||
        message.quick_reply.payload === 'PICKED_PHONE_ANDROID' ||
        message.quick_reply.payload === 'PICKED_PHONE_DONTKNOW' ||
        message.quick_reply.payload === 'PICKED_PHONE_OTHER') {

        user.hasAndroid = (message.quick_reply.payload === 'PICKED_PHONE_ANDROID');
        user.phone = message.quick_reply.payload.split('_').pop();

        // Auto assign users a modality.
        autoAssignModality(user.hasAndroid, mode => {
          user.modality = mode;

          database.updateUser(user, () => {
            displayInterview(sender, reply);
          });
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
                  text: 'Your ' + convertToFriendlyName(user.modality) + ' is waiting...',
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
            } else if (user.modality === 'VIBRATION') {
              console.log('Modality is vibration...');
              console.log(JSON.stringify(user));
              fitbit.sendVibration(user.fitbit_user_id, user.fitbit_tracker_id, user.fitbit_access_token, err => {
                if (err) {
                  console.log('Failed to send vibration reward to user:');
                  console.log(JSON.stringify(user));
                  console.log(err);
                  // TODO remove this reply
                  reply(sender, {
                    text: JSON.stringify(err)
                  });
                } else {
                  console.log('Vibration reward sent.');
                  reply(sender, replyContent, {
                    text: 'Enjoy your reward. I\'ll see you tomorrow!'
                  });
                }
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
          displayModalityQuestion1a(sender, reply);
        });
       } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_A_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_A_STRONGLY_DISAGREE') {
        const dm1a = message.quick_reply.payload.substring(10);
        user.surveyModality1a = dm1a;

        database.updateUser(user, () => {
          displayModalityQuestion1b(sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_B_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_B_STRONGLY_DISAGREE') {
        const dm1b = message.quick_reply.payload.substring(10);
        user.surveyModality1b = dm1b;

        database.updateUser(user, () => {
          displayModalityQuestion1c(sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_C_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_C_STRONGLY_DISAGREE') {
        const s1mc = message.quick_reply.payload.substring(10);
        user.surveyModality1c = s1mc;

        database.updateUser(user, () => {
          displayModalityQuestion1d(sender, reply);
        });
      } else if (message.quick_reply.payload === 'SURVEY1_MODALITY_D_STRONGLY_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_AGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_NEITHER' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_DISAGREE' ||
          message.quick_reply.payload === 'SURVEY1_MODALITY_D_STRONGLY_DISAGREE') {
        const s1md = message.quick_reply.payload.substring(10);
        user.surveyModality1d = s1md;

        database.updateUser(user, () => {
          displayAnyMoreFeedback(user, sender, reply);
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
 * VIBRATION
 * VISUAL_AND_SOUND
 * VISUAL_AND_SOUND_AND_VIBRATION
 * Based on the number of currently assigned users.
 *
 */
function autoAssignModality(vibration, callback) {
  database.getAllModalities(modalities => {
    if (vibration) {
      if (getRandomInt(0, 10) === 0) {
        // 1 in 10 chance of automatically removing vibration and picking something else
        delete modalities.VIBRATION;
        delete modalities.VISUAL_AND_SOUND_AND_VIBRATION;
      }
    } else {
      delete modalities.VIBRATION;
      delete modalities.VISUAL_AND_SOUND_AND_VIBRATION;
    }

    console.log(modalities);
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
    console.log(lowest);
    callback(lowest.mode);
  });
}

module.exports = {
  read,
  convertToFriendlyName,
  createQuickReply,
  createQRItem
};
