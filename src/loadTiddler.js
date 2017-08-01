const fs = require('fs');

module.exports = function loadTiddler(pathToFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(pathToFile, 'utf8', (err, data) => {
      if (err) { return reject(err); }
      try {
        return resolve(JSON.parse(data));
      }
      catch(e) {
        return reject(e);
      }
    });
  });
};
