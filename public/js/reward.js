/* jslint node: false */
'use strict';
// TODO dont know if the jslint node: false is working

/**
 * JS could show the reward with a basic on click handler,
 * but if users have slow network then their initial press on
 * the button won't do anything.
 * This is fixed by adding an onclick handler if users havent already
 * clicked on the button, otherwise if they have, then we play the
 * reward.
 */
window.onload = function () {

  // Get objects
  const btn = document.getElementById('reward-btn');
  if (btn.checked) {
    playSound();
  } else {
    // Show content when users click the button
    btn.addEventListener('click', () => {
      playSound();
    });
  }
};

function playSound() {
  // Sound modality
  const sound = document.getElementById('reward-audio');
  if (sound !== null) {
    sound.play();
  }
}
