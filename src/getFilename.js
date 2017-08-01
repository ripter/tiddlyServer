const _ = require('lodash');

/**
 * Returns the filename for the tiddler
 * @param  {Object} tiddler
 * @return {String}
 */
module.exports = function getFilename(tiddlerTitle) {
  let title = _.snakeCase(tiddlerTitle);

  // snake case will remove the $, add it back
  if (_.startsWith(tiddlerTitle, '$')) {
    title = '$_' + title;
  }

  return `${title}.json`;
};
