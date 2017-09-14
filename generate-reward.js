'use strict';

/**
 * Serve resources from a CDN rather than the same host, to reduce strain
 * on the heroku.
 */
const cdn = 'https://cdn.rawgit.com/harrymt/harryshabits/e7fea8e6/public';

/**
 * Visual rewards.
 */
const visualRewards = [
  'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', // Boy at computer, thumbs up
  'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', // Gameshow host celebrating
  'https://media.giphy.com/media/oGO1MPNUVbbk4/giphy.gif', // Small boy thumbs up
  'https://media.giphy.com/media/uudzUtVcsLAoo/giphy.gif' // Baseballer fist success
];

/**
 * Auditory rewards.
 */
const audioMP3 = [
  '/sound/hands-up.mp3',
  '/sound/snow.mp3',
  '/sound/thumbs-up.mp3',
  '/sound/base-ball.mp3',
  '/sound/we-are-the-campions.mp3'
];


/**
 * Inline auditory rewards.
 */
const audioSpotify = [
  'https://open.spotify.com/track/2olVm1lHicpveMAo4AUDRB', // Power of love
  'https://open.spotify.com/track/3fthfkkvy9av3q3uAGVf7U', // Shake it off
  'https://open.spotify.com/track/6Nf1bklus7o9fpKto13nDc', // OK GO, this shall not pass
  'https://open.spotify.com/track/6Lphpr9Z6H282Sguw0dUWa' // Ahh Freak out
];

/**
 * Visual-Auditory rewards.
 */
const audioVisualRewards = [
  'hands-up',
  'snow',
  'we-are-the-campions',
  'thumbs-up',
  'base-ball'
];

/**
 * Wrap a random visualm reward, wrapped up in an object.
 */
const getVisualReward = (online) => {
  if (online) {
    return getRandom(visualRewards);
  }
  return cdn + '/gif/' + getRandom(audioVisualRewards) + '.gif';
};


/**
 * Choose a random auditory reward and wrap it up into an object ready to send.
 */
const getAudioReward = (spotifyRewards) => {
  if (spotifyRewards) {
    return getRandom(audioSpotify);
  }

  return cdn + getRandom(audioMP3);
};

/**
 * Get a visual-auditory reward.
 */
const getVisualAudioReward = () => {
  const reward = getRandom(audioVisualRewards);
  return {
    audio: cdn + '/sound/' + reward + '.mp3',
    gif: cdn + '/gif/' + reward + '.gif'
  };
};

/**
 * Get a random number that is within the bounds of the array (arr).
 */
function getRandom(arr) {
  return arr[Math.floor((Math.random() * (arr.length)) + 1) - 1];
}

module.exports = {
  getVisualReward,
  getVisualAudioReward,
  getAudioReward
};
