const fs = require('fs');
const path = require('path');

module.exports = function loadTiddler(pathToFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(pathToFile, 'utf8', (err, data) => {
      if (err) { return reject(err); }
      try {
        resolve(JSON.parse(data));
      }
      catch(e) {
        reject(e);
      }
    });
  });
}
