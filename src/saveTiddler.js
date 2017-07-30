const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = function saveTiddler(tiddler) {
  console.log('saveTiddler', tiddler);

  return new Promise((resolve, reject) => {
    let title = _.snakeCase(tiddler.title);
    // snake case will remove the $, add it back
    if (_.startsWith(tiddler.title, '$')) {
      title = '$_' + title;
    }
    const filename = path.normalize(path.join(__dirname, '../', '_tiddlers', `${title}.json`));

    fs.writeFile(filename, JSON.stringify(tiddler), (err) => {
      if (err) { return reject(err); }

      resolve(tiddler);
    });
  });
}
