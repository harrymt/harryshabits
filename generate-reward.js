'use strict';

const audioSpotify = [
  'https://open.spotify.com/track/2olVm1lHicpveMAo4AUDRB', // Power of love
  'https://open.spotify.com/track/3fthfkkvy9av3q3uAGVf7U', // Shake it off
  'https://open.spotify.com/track/6Nf1bklus7o9fpKto13nDc', // OK GO, this shall not pass
  'https://open.spotify.com/track/6Lphpr9Z6H282Sguw0dUWa' // Ahh Freak out
];

const audioMP3 = [
  '/sound/hands-up.mp3',
  '/sound/snow.mp3',
  '/sound/thumbs-up.mp3',
  '/sound/we-are-the-campions.mp3'
];

const visualRewards = [
  'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', // Boy at computer, thumbs up
  'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', // Gameshow host celebrating
  'https://media.giphy.com/media/oGO1MPNUVbbk4/giphy.gif', // Small boy thumbs up
  'https://media.giphy.com/media/uudzUtVcsLAoo/giphy.gif' // Baseballer fist success
];

const audioVisualRewards = [
  'hands-up',
  'snow',
  'we-are-the-campions',
  'thumbs-up'
];

/**
 * Choose a random audio reward and wrap it up into an object ready to send.
 */
const getAudioReward = spotifyRewards => {
  if (spotifyRewards) {
    return getRandom(audioSpotify);
  }

  return getRandom(audioMP3);
};

/**
 * Wrap a random gif up in an object.
 */
const getVisualReward = online => {
  if (online) {
    return getRandom(visualRewards);
  }
  return '/gif/' + getRandom(audioVisualRewards) + '.gif';
};

/**
 * Get a combined audio visual reward
 */
const getVisualAudioReward = function () {
  const reward = getRandom(audioVisualRewards);
  const cdn = 'https://cdn.rawgit.com/harrymt/habit-reward-chatbot/master/public';
  return {
    audio: cdn + '/sound/' + reward + '.mp3',
    gif: cdn + '/gif/' + reward + '.gif'
  };
};

function getRandom(arr) {
  return arr[Math.floor((Math.random() * (arr.length)) + 1) - 1];
}

module.exports = {
  getVisualReward,
  getVisualAudioReward,
  getAudioReward
};
