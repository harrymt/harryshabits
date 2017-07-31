
'use strict';
const sass = require('node-sass');
const fs = require('fs');

const sassFolder = './public/sass/';
const cssFolder = './public/css/';
const sassExtension = '.scss';

/**
 * Process scss file to css file.
 */
const srcToDist = (src, dist) => {
  const result = sass.render({
    file: sassFolder + src + sassExtension,
    outFile: cssFolder + dist + '.css',
    outputStyle: 'compressed',
    sourceMap: true
  }, function(err, result) {
    if(!err) {
      // No errors during the compilation, write this result on the disk
      fs.writeFile(cssFolder + dist + '.css', result.css, function(error) {
        if(error) {
          console.log('Failed to write scss:');
          console.log(error.message);
        }
      });
    } else {
      console.log('Failed to compile scss:');
      console.log(err.message);
    }

  });
};

module.exports = {
  srcToDist
};
