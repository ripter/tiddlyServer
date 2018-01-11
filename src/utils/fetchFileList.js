const fs = require('fs');
/**
 * Promise starter to fetch a list of .json files
 * @param  {String} rootFolder
 * @param  {Function} resolve
 * @param  {Function} reject
 * @return {Promise}
 */
module.exports = function fetchFileList(rootFolder, resolve, reject) {
  fs.readdir(rootFolder, (err, files) => {
    if (err) { return reject(err); }
    // filter to just JSON files
    const filteredFiles = files.filter((filename) => {
      return filename.endsWith('.json');
    });
    return resolve(filteredFiles);
  });
}
