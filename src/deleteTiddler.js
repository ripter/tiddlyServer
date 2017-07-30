const fs = require('fs');
const getFilename = require('./getFilename.js');

module.exports = function deleteTiddler(tiddler) {
  const filename = getFilename(tiddler);

  return new Promise((resolve, reject) => {
    fs.unlink(filename, (err) => {
      if (err) { return reject(err); }
      resolve(tiddler);
    });
  });
}
