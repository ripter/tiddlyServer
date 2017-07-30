const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const saveTiddler = require('./src/saveTiddler.js');


const app = express();
const skinnyTiddlers = [];
let globalRevision = 1;

// Setup static file server for the index.html
app.use(express.static(path.join(__dirname, 'public')));
// The page will send us JSON back.
app.use(bodyParser.json());

// Handshake
app.get('/status', function(req, res) {
  res.json({"space":{"recipe":"default"},"tiddlywiki_version":"5.1.14"});
});

//  Route for Skinny Tiddlers
app.get('/recipes/:recipe/tiddlers.json', function(req, res) {
  res.json(skinnyTiddlers);
});

app.get('/recipes/:recipe/tiddlers/:title', function(req, res) {
  console.log('GET: /recipes/:recipe/tiddlers/:title');
  console.log('\treq.params', req.params);
  res.json({});
});

// Save Tiddler to disk
app.put('/recipes/:recipe/tiddlers/:title', function(req, res) {
  const { title, recipe } = req.params;
  const tiddler = req.body;
  let { revision } = tiddler;

  // console.log('PUT: /recipes/:recipe/tiddlers/:title');
  // console.log('\treq.params', req.params);
  // console.log('\treq.body', req.body);

  // Update the revision
  // The wiki uses title + revision to know if it should re-load the tiddler.
  if (revision) {
    revision = parseInt(revision, 10) + 1;
    tiddler.revision = revision;
  }
  // remove this tiddler from the list so we can add the new one.
  _.remove(skinnyTiddlers, (t) => { return t.title === title });
  // Save the tiddler and save the skinny
  skinnyTiddlers.push(saveTiddler(tiddler));

  // Set the Etag and return success
  res.set('Etag', `"${recipe}/${encodeURIComponent(title)}/${revision}:"`);
  res.sendStatus(200);
});

// Delete Tiddler from disk
app.delete('/bags/:bag/tiddlers/:title', function(req, res) {
  // console.log('DELETE: /bags/:bag/tiddlers/:title');
  // console.log('\treq.params', req.params);
  // console.log('\treq.body', req.body);
  res.sendStatus(204);
});

// Options we allow
app.options('/', function(req, res) {
  res.set('Allow', 'OPTIONS, GET, PUT, DELETE');
  res.sendStatus(200);
});

app.listen(3000, function () {
  console.log('listening on port 3000!');
});
