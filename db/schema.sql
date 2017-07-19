DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS globals;

CREATE TABLE users (
  "fbid" VARCHAR PRIMARY KEY,
  "email" VARCHAR,
  "modality" VARCHAR,
  "seenBefore" BOOLEAN,
  "reminderTime" VARCHAR,
  "habit" VARCHAR,
  "snoozedReminderTime" VARCHAR,
  "snoozesToday" INT,
  "totalNumberOfSnoozes" INT,
  "totalNumberOfFailedSnoozes" INT,
  "streak" INT,
  "age" VARCHAR,
  "expectingAge" BOOLEAN,
  "hasUsedHabitAppsBefore" BOOLEAN,
  "expectingPreviousHabits" BOOLEAN,
  "previousHabits" VARCHAR,
  "hasUsedHabitAppsBeforeWorked" BOOLEAN,
  "habitCategory" VARCHAR,
  "expectingHabitContext" BOOLEAN,
  "habitContext" VARCHAR,
  "interview" BOOLEAN,
  "expectingContactDetails" BOOLEAN,
  "gender" VARCHAR,
  "expectingMoreFeedback" BOOLEAN,
  "survey1a" VARCHAR,
  "survey1b" VARCHAR,
  "survey1c" VARCHAR,
  "survey1d" VARCHAR,
  "surveyModality1a" VARCHAR,
  "surveyModality1b" VARCHAR,
  "surveyModality1c" VARCHAR,
  "surveyModality1d" VARCHAR,
  "moreFeedback" VARCHAR,
  "finished" BOOLEAN
);

INSERT INTO users (
  "fbid",
  "email",
  "modality",
  "seenBefore",
  "reminderTime",
  "habit",
  "snoozedReminderTime",
  "totalNumberOfSnoozes",
  "totalNumberOfFailedSnoozes",
  "streak",
  "age",
  "habitContext",
  "finished"
) VALUES (123, 'Robot@me.com', 'VISUAL', true, 'EARLY_MORNING', 'STRETCH', 'EARLY_MORNING', 0, 0, 0, '23', 'Tracking some time', false);


CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  "fbid" VARCHAR,
  "fullDay" VARCHAR,
  "day" VARCHAR,
  "completed" BOOLEAN,
  "reminderTime" VARCHAR,
  "numberOfSnoozes" INT,
  "currentModality" VARCHAR,
  "currentHabit" VARCHAR,
  "currentStreak" INT
);


INSERT INTO habits (
  "fbid",
  "fullDay",
  "day",
  "completed",
  "reminderTime",
  "numberOfSnoozes",
  "currentModality",
  "currentHabit",
  "currentStreak") VALUES (
  123,
  'Sat, 15 Jul 2017 08:48:10 GMT',
  '15 Jul 2017',
  true,
  'EARLY_MORNING',
  0,
  'VISUAL',
  'PLANK',
  0);

CREATE TABLE globals (
  id SERIAL PRIMARY KEY,
  "remainingDays" INT,
  "studyActive" BOOLEAN
);

INSERT INTO globals ("remainingDays", "studyActive") VALUES (21, true);
