const path = require('path');
const _ = require('lodash');

/**
 * Returns the filename for the tiddler
 * @param  {Object} tiddler
 * @return {String}
 */
module.exports = function getFilename(tiddler) {
  let title = _.snakeCase(tiddler.title);

  // snake case will remove the $, add it back
  if (_.startsWith(tiddler.title, '$')) {
    title = '$_' + title;
  }

  return path.normalize(path.join(__dirname, '../', '_tiddlers', `${title}.json`));
}
