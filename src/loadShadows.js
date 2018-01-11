const _ = require('lodash');
const fetchFileList = require('./utils/fetchFileList.js');
const fetchFiles = require('./utils/fetchFiles.js');

/**
 * @return {Promise} shadow tiddlers
 */
module.exports = function loadShadowTiddlers(rootFolder) {
  const loadFileList = fetchFileList.bind(null, rootFolder);
  const convertToTiddler = fetchFiles.bind(null, rootFolder);

  return new Promise(loadFileList)
    .then(filterShadow)
    .then(convertToTiddler);
};

function filterShadow(filenames) {
  return filenames.filter((name) => _.startsWith(name, '$'));
}
