const fs = require('fs');
const getFilename = require('./getFilename.js');
const updateRevision = require('./updateRevision.js');

module.exports = function saveTiddler(tiddler) {
  const filename = getFilename(tiddler);

  // Update the revision.
  tiddler = updateRevision(tiddler);

  // Write to disk as JSON file
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(tiddler), (err) => {
      if (err) { return reject(err); }
      resolve(tiddler);
    });
  });
}
