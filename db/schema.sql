
DROP DATABASE IF EXISTS mydb;
CREATE DATABASE mydb;

\c mydb;

CREATE TABLE users (
  fbid VARCHAR PRIMARY KEY,
  email VARCHAR,
  modality VARCHAR,
  seenBefore BOOLEAN,
  reminderTime VARCHAR,
  habit VARCHAR,
  snoozedReminderTime VARCHAR,
  snoozesToday INT,
  totalNumberOfSnoozes INT,
  totalNumberOfFailedSnoozes INT,
  streak INT,
  age VARCHAR,
  expectingAge BOOLEAN,
  hasUsedHabitAppsBefore BOOLEAN,
  expectingPreviousHabits BOOLEAN,
  previousHabits VARCHAR,
  hasUsedHabitAppsBeforeWorked BOOLEAN,
  habitCategory VARCHAR,
  expectingHabitContext BOOLEAN,
  habitContext VARCHAR,
  interview BOOLEAN,
  expectingContactDetails BOOLEAN,
  gender VARCHAR,
  expectingMoreFeedback BOOLEAN,
  survey1a VARCHAR,
  survey1b VARCHAR,
  survey1c VARCHAR,
  survey1d VARCHAR,
  surveyModality1a VARCHAR,
  surveyModality1b VARCHAR,
  surveyModality1c VARCHAR,
  surveyModality1d VARCHAR,
  moreFeedback VARCHAR,
  finished BOOLEAN
);

CREATE TABLE habits (
  fbid VARCHAR references users(fbid),
  fullDay VARCHAR,
  day VARCHAR,
  completed BOOLEAN,
  reminderTime VARCHAR,
  numberOfSnoozes INT,
  currentModality VARCHAR,
  currentHabit VARCHAR,
  currentStreak INT
);

CREATE TABLE globals (
  remainingDays INT,
  studyActive BOOLEAN
);
