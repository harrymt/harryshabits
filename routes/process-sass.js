
'use strict';
const fs = require('fs');
const sass = require('node-sass');

const sassFolder = './public/sass/';
const cssFolder = './public/css/';
const sassExtension = '.scss';

/**
 * Utility function to write a file with error handling.
 */
const writeFile = (destination, file) => {
  fs.writeFile(destination, file, error => {
    if (error) {
      console.log('Failed to write scss:');
      console.log(error.message);
    }
  });
};

/**
 * Process scss file to css file.
 */
const srcToDist = (src, dist) => {
  sass.render({
    file: sassFolder + src + sassExtension,
    outFile: cssFolder + dist + '.css',
    outputStyle: 'compressed',
    sourceMap: true
  }, (err, result) => {
    if (err) {
      console.log('Failed to compile scss:');
      console.log(err.message);
    } else {
      // No errors during the compilation, write this result on the disk
      writeFile(cssFolder + dist + '.css', result.css);
    }
  });
};

module.exports = {
  srcToDist
};
