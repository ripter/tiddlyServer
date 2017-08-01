const fs = require('fs');
const updateRevision = require('./updateRevision.js');

module.exports = function saveTiddler(pathToFile, tiddler) {
  // Update the revision.
  tiddler = updateRevision(tiddler);

  // Write to disk as JSON file
  return new Promise((resolve, reject) => {
    fs.writeFile(pathToFile, JSON.stringify(tiddler), (err) => {
      if (err) { return reject(err); }
      return resolve(tiddler);
    });
  });
};
