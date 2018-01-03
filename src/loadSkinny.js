const fs = require('fs');
const path = require('path');
const loadTiddler = require('./loadTiddler.js');

/**
 * @return {Promise} skinnyTiddlers
 */
module.exports = function loadSkinnyTiddlers(rootFolder) {
  const loadFileList = getFileList.bind(null, rootFolder);
  const convertToTiddler = loadFiles.bind(null, rootFolder);

  return new Promise(loadFileList).then(convertToTiddler);
};


function getFileList(rootFolder, resolve, reject) {
  fs.readdir(rootFolder, (err, files) => {
    if (err) { return reject(err); }
    // filter to just JSON files
    const filteredFiles = files.filter((filename) => {
      return filename.endsWith('.json');
    });
    return resolve(filteredFiles);
  });
}

function loadFiles(rootFolder, filenames) {
  let promiseFiles = filenames.map((filename) => {
    return loadTiddler(path.join(rootFolder, filename));
  });
  return Promise.all(promiseFiles);
}
