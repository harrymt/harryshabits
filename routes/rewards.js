"use strict";


// /**
//  * Choose a random audio reward and wrap it up into an object ready to send.
//  */
// function getAudioReward() {
//   const audioRewards = [
//     'https://open.spotify.com/track/2olVm1lHicpveMAo4AUDRB', // Power of love
//     'https://open.spotify.com/track/3fthfkkvy9av3q3uAGVf7U', // Shake it off
//     'https://open.spotify.com/track/6Nf1bklus7o9fpKto13nDc', // OK GO, this shall not pass
//     'https://open.spotify.com/track/6Lphpr9Z6H282Sguw0dUWa' // Ahh Freak out
//   ];

//   // Choose a random reward
//   const chosenReward = Math.floor((Math.random() * (audioRewards.length - 1)) + 1);

//   return {
//     attachment: {
//       type: 'template',
//       payload: {
//         template_type: 'open_graph',
//         elements: [{
//           url: audioRewards[chosenReward]
//         }]
//       }
//     }
//   };
// }

// //         buttons: [{
// //           type: 'web_url',
// //           url: audioRewards[chosenReward],
// //           title: 'View Track'
// //         }]

// /**
//  * Wrap a random gif up in an object.
//  */
// function getVisualReward() {
//   const visualRewards = [
//     'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', // Boy at computer, thumbs up
//     'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif', // Gameshow host celebrating
//     'https://media.giphy.com/media/oGO1MPNUVbbk4/giphy.gif', // Small boy thumbs up
//     'https://media.giphy.com/media/uudzUtVcsLAoo/giphy.gif' // Baseballer fist success
//   ];

//   // Choose a random reward
//   const chosenReward = Math.floor((Math.random() * (visualRewards.length - 1)) + 1);

//   return {
//     attachment: {
//       type: 'image',
//       payload: {
//         url: visualRewards[chosenReward]
//       }
//     }
//   };
// }


var router = require('express').Router();
router.get('/:modality', function(req, res, next) {
  if (req.params.modality === 'visual' || req.params.modality === 'sound' || req.params.modality === 'vibration') {
    // TODO get the content of the reward, then just render the template here
    // res.render('pages/rewards/:modality', { url: '<reward url>'});
    res.send('<h1>Here is your ' +  req.params.modality + ' reward!</h1>');

  } else {
    res.send('<h1>Invalid reward</h1>');
  }
});

module.exports = router;