/* jslint node: false */
'use strict';
// TODO dont know if the jslint node: false is working

window.onload = function () {

  // Get objects
  const btn = document.getElementsByClassName('btn')[0];
  const reward = document.getElementsByClassName('container')[0];

  // Show content when users click the button
  btn.addEventListener('click', function() {
    btn.style.display = 'none';
    reward.style.display = 'block';
  });

};
