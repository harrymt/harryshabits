'use strict';

const router = require('express').Router();
const rewards = require('../generate-reward');

router.get('/visual', (req, res, next) => {
  res.render('rewards/visual', {
    url: rewards.getVisualReward()
  });
});

router.get('/sound', (req, res, next) => {
  res.render('rewards/sound', {
    url: rewards.getAudioReward(false)
  });
});

router.get('/vibration', (req, res, next) => {
  res.render('rewards/vibration');
});

module.exports = router;
