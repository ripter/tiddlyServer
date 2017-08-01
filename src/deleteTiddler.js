const fs = require('fs');

module.exports = function deleteTiddler(pathToFile) {
  return new Promise((resolve, reject) => {
    fs.unlink(pathToFile, (err) => {
      if (err) { return reject(err); }
      resolve(tiddler);
    });
  });
}
