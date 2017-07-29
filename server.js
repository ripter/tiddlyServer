const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

let globalRevision = 1;

// Setup static file server for the index.html
app.use(express.static(path.join(__dirname, 'public')));
// The page will send us JSON back.
app.use(bodyParser.json());

app.get('/status', function(req, res) {
  res.json({"space":{"recipe":"default"},"tiddlywiki_version":"5.1.14"});
});

app.get('/recipes/default/tiddlers.json', function(req, res) {
  res.json({});
});

app.put('/recipes/default/tiddlers/:title', function(req, res) {
  const title = encodeURIComponent(req.params.title);
  const revision = globalRevision++;
  console.log('PUT: /recipes/default/tiddlers/:title');
  console.log('\treq.params', req.params);
  console.log('\treq.body', req.body);
  res.set('Etag', `"default/${title}/${revision}:"`);
  res.sendStatus(200);
});

app.delete('/bags/:bag/tiddlers/:title', function(req, res) {
  console.log('DELETE: /bags/:bag/tiddlers/:title');
  console.log('\treq.params', req.params);
  console.log('\treq.body', req.body);
  res.sendStatus(204);
});

app.options('/', function(req, res) {
  console.log('OPTIONS');
  res.set('Allow', 'OPTIONS, GET, PUT, DELETE');
  res.sendStatus(200);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
