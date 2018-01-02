const path = require('path');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const _ = require('lodash');
const commandLineArgs = require('command-line-args');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

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


// app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Add authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log('LocalStrategy', username, password)
    return done(null, {name: username});
  }
));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  console.log('serializeUser', user);
  cb(null, user.name);
});

passport.deserializeUser(function(id, cb) {
  console.log('deserializeUser', id);
  cb(null, {name: id});
});

// app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());



// Options we allow
app.options('/', function(req, res) {
  res.set('Allow', 'OPTIONS, GET, PUT, DELETE');
  res.sendStatus(200);
});

app.post('/login',
passport.authenticate('local', { failureRedirect: '/error.html' }),
function(req, res) {
  const { user } = req;
  console.log('POST /login', user);
  res.json(user);
});

//
// Tiddly Wiki Routes
//

// TiddlyWiki Handshake
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



//
// Main
//

// Read the Command Line Options
const options = commandLineArgs([
  {name: 'port', type: Number, defaultValue: 3000},
]);

// load from disk
// load the skinny from the root folder and start the server
loadSkinny(rootFolder).then((list) => {
  // Save the fresh list so the endpoints can use them.
  skinnyTiddlers = list;
  // Start the server with the fresh skinny list
  app.listen(options.port, function () {
    console.log(`listening on port ${options.port}!`);
  });
}).catch((err) => {
  console.log('Oops', err);
});
