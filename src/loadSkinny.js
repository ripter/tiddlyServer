const fs = require('fs');
const path = require('path');
const rootFolder = path.normalize(path.join(__dirname, '../', '_tiddlers'));

/**
 * @return {Array} skinnyTiddlers
 */
module.exports = function loadSkinnyTiddlers() {
  return new Promise(getFileList).then((files) => {
    return loadFiles(files);
  });
}

function getFileList(resolve, reject) {
  fs.readdir(rootFolder, (err, files) => {
    if (err) { return reject(err); }
    resolve(files);
  });
}

function loadFiles(filenames) {
  let promiseFiles = filenames.map((filename) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(rootFolder, filename), 'utf8', (err, data) => {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  });

  return Promise.all(promiseFiles);
}
