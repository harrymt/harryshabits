'use strict';

const router = require('express').Router();
const rewards = require('../generate-reward');

/**
 * Router to generate a random visual reward then display it.
 */
router.get('/visual', (req, res, next) => {
  res.render('rewards/visual', {
    url: rewards.getVisualReward()
  });
});

/**
 * Router to generate a random audio then display it.
 */
router.get('/sound', (req, res, next) => {
  res.render('rewards/sound', {
    url: rewards.getAudioReward(false)
  });
});

/**
 * Router to generate the same visual-audio random reward then display it.
 */
router.get('/visual_and_sound', (req, res, next) => {
  const r = rewards.getVisualAudioReward();
  res.render('rewards/visual_and_sound', {
    img_url: r.gif,
    audio_url: r.audio
  });
});

module.exports = router;
