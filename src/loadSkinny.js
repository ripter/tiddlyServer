const fetchFileList = require('./utils/fetchFileList.js');
const fetchFiles = require('./utils/fetchFiles.js');

/**
 * @return {Promise} skinnyTiddlers
 */
module.exports = function loadSkinnyTiddlers(rootFolder) {
  const loadFileList = fetchFileList.bind(null, rootFolder);
  const convertToTiddler = fetchFiles.bind(null, rootFolder);

  return new Promise(loadFileList).then(convertToTiddler);
};
