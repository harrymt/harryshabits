
'use strict';

const reminderTimes = {
  EARLY_MORNING: 7,
  MID_MORNING: 9,
  LATE_MORNING: 11,
  EARLY_AFTERNOON: 12,
  MID_AFTERNOON: 14,
  LATE_AFTERNOON: 16,
  EARLY_EVENING: 18,
  MID_EVENING: 20,
  LATE_EVENING: 21,
  NIGHT: 22,
  NEW_DAY: 23
};

const properties = () => {
  const p = [];
  const keys = Object.keys(reminderTimes);
  for (let i = 0; i < keys.length; i++) {
    p.push(reminderTimes[keys[i]]);
  }
  return p.sort((a, b) => (a - b));
};

const value = key => {
  const keys = Object.keys(reminderTimes);
  for (let i = 0; i < keys.length; i++) {
    if (reminderTimes[keys[i]] == key) {
      return keys[i];
    }
  }
  return null;
};

/**
 * Gets time in hour format. (hard coded to BST)
 */
const hour = () => {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + 1);
  return now.getUTCHours();
};

/**
 * Returns a valid hour (rounded up) or null
 */
const roundHourUp = hour => {
  if (hour >= 24) {
    return null; // Cant be bigger than 24
  }

  if (value(hour)) {
    return hour; // Already rounded
  }

  // Keep adding 1 to the hour, until we reach a new period
  for (let i = 1; hour < reminderTimes.NEW_DAY; i++) {
    hour++;
    if (value(hour)) {
      return hour;
    }
  }
  // Can't round hour for some reason
  return null;
};

/**
 * Gets the next period from now.
 */
const nextPeriodFromNow = () => {
  let t = hour();
  if (value(t) === null) {
    // Rounds up to the next period
    t = roundHourUp(t); // Always will be a vaild hour or null
    return value(t);
  }

  // Can't snooze if we reach these two
  if (t === reminderTimes.NEW_DAY || t === reminderTimes.NIGHT) {
    return null;
  }

  const theTimes = properties();
  for (let i = 0; i < theTimes.length; i++) {
    // If we found our time, choose the next one
    if (theTimes[i] === t) {
      if ((i + 1) < theTimes.length) {
        return value(theTimes[i + 1]);
      }

      return null;
    }
  }
  return null;
};

/**
 * Gets the time as string.
 */
const period = theHour => {
  if (!theHour) {
    theHour = hour();
  }

  return value(theHour);
};

/**
 * Get the next reminder time for snoozed reminders.
 * MORNING -> AFTERNOON -> EVENING -> MORNING
 */
const getNextReminderTime = reminderTime => {
  const timePeriod = reminderTime.split('_')[0];

  if (String(reminderTime).includes('MORNING')) {
    return timePeriod + '_AFTERNOON';
  } else if (String(reminderTime).includes('AFTERNOON')) {
    return timePeriod + '_EVENING';
  }

  return 'EARLY_MORNING'; // If its the night or eve then set to next day
};

module.exports = {
  hour,
  period,
  nextPeriodFromNow,
  reminderTimes,
  getNextReminderTime
};
