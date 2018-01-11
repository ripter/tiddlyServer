const path = require('path');
const loadTiddler = require('../loadTiddler.js');

module.exports = function fetchFiles(rootFolder, filenames) {
  let promiseFiles = filenames.map((filename) => {
    return loadTiddler(path.join(rootFolder, filename));
  });
  return Promise.all(promiseFiles);
}
