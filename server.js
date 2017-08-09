const path = require('path');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const _ = require('lodash');
const commandLineArgs = require('command-line-args');

const getFilename = require('./src/getFilename.js');
const saveTiddler = require('./src/saveTiddler.js');
const deleteTiddler = require('./src/deleteTiddler.js');
const loadSkinny = require('./src/loadSkinny.js');
const loadTiddler = require('./src/loadTiddler.js');


const rootFolder = path.normalize(path.join(__dirname, '_tiddlers'));
const app = express();
let skinnyTiddlers = [];

// secure headers with helmet middleware
app.use(helmet());
// Setup static file server for the index.html
app.use(express.static(path.join(__dirname, 'public')));
// The page will send us JSON back.
app.use(bodyParser.json());

// Handshake
app.get('/status', function(req, res) {
  res.json({'space':{'recipe':'default'},'tiddlywiki_version':'5.1.14'});
});

//  Route for Skinny Tiddlers
// The skinny tiddlers is like a manifest. If the title and revision don't match
// the version on the page, it will make a call to re-load the tiddler data.
app.get('/recipes/:recipe/tiddlers.json', function(req, res) {
  if (skinnyTiddlers.length > 0) {
    return res.json(skinnyTiddlers);
  }
  return res.json([]);
});

app.get('/recipes/:recipe/tiddlers/:title', function(req, res) {
  console.log('GET: /recipes/:recipe/tiddlers/:title');
  console.log('\treq.params', req.params);
  const { title } = req.params;
  const pathToFile = path.join(rootFolder, getFilename(title));
  loadTiddler(pathToFile)
    .then((tiddler) => {
      res.json(tiddler);
    })
    .catch((err) => {
      console.log('Oops error', err);
      res.sendStatus(500);
    });
});

// Save Tiddler to disk
app.put('/recipes/:recipe/tiddlers/:title', function(req, res) {
  const { title, recipe } = req.params;
  const tiddler = req.body;
  const pathToFile = path.join(rootFolder, getFilename(title));

  // remove this tiddler from the list so we can add the new one.
  _.remove(skinnyTiddlers, (t) => { return t.title === title; });
  // Save the tiddler and save the skinny
  saveTiddler(pathToFile, tiddler)
    .then((skinny) => {
      const { revision } = skinny;
      // save the updated skinny
      skinnyTiddlers.push(skinny);
      // Set the Etag and return success
      res.set('Etag', `"${recipe}/${encodeURIComponent(title)}/${revision}:"`);
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log('Oops error', err);
      res.sendStatus(500);
    });
});

// Delete Tiddler from disk
app.delete('/bags/:bag/tiddlers/:title', function(req, res) {
  const { title } = req.params;
  const pathToFile = path.join(rootFolder, getFilename(title));
  let tiddler = _.remove(skinnyTiddlers, (t) => { return t.title === title; });

  if (tiddler.length === 0) {
    // could not find the named tiddler
    return res.sendStatus(404);
  }

  // unwrap from the array.
  tiddler = tiddler[0];

  return deleteTiddler(pathToFile)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log('Oops error', err);
      res.sendStatus(500);
    });
});

// Options we allow
app.options('/', function(req, res) {
  res.set('Allow', 'OPTIONS, GET, PUT, DELETE');
  res.sendStatus(200);
});


// Read the Command Line Options
const options = commandLineArgs([
  {name: 'port', type: Number, defaultValue: 3000},
]);
console.log('options', options);


// load from disk
loadSkinny(rootFolder).then((list) => {
  skinnyTiddlers = list;

  app.listen(options.port, function () {
    console.log(`listening on port ${options.port}!`);
  });
}).catch((err) => {
  console.log('Oops', err);
});
