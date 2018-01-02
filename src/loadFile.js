const fs = require('fs');

/**
 * Loads the file at path via promise then signature
 * @param  {String} pathToFile path to a single file.
 * @return {Function} thenable function that resolves with the file data.
 */
function loadFile(pathToFile) {
  return function loadFileThenable(resolve, reject) {
    fs.readFile(pathToFile, 'utf8', (err, data) => {
      if (err) { return reject(err); }
      try {
        return resolve(data);
      }
      catch(e) {
        return reject(e);
      }
    });
  };
}

module.exports = loadFile;
