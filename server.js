const path = require('path');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const commandLineArgs = require('command-line-args');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const getFilename = require('./src/getFilename.js');
const saveTiddler = require('./src/saveTiddler.js');
const deleteTiddler = require('./src/deleteTiddler.js');
const loadSkinny = require('./src/loadSkinny.js');
const loadTiddler = require('./src/loadTiddler.js');
const loadFile = require('./src/loadFile.js');

const FAILURE_REDIRECT = '/error.html';
const LOGIN_REDIRECT = '/login.html';
const rootFolder = path.normalize(path.join(__dirname, '_tiddlers'));
const app = express();

// secure headers with helmet middleware
app.use(helmet());
// Setup static file server for the index.html
app.use(express.static(path.join(__dirname, 'public')));
// The page will send us JSON back.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: (new Date).getTime().toString(36) + Math.round(Math.random() * 1000000).toString(32),
  resave: false,
  saveUninitialized: false,
}));

//
// Add authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    const user = [
      {name: 'rose', root:'r1'},
      {name: 'chris', root:'cr'},
    ].find(item => item.name === username);

    //TODO: Create new user the first time they log in.
    //TODO: create the user's directory/index.html if it does not exist
    if (user) {
      // found the user
      return done(null, user);
    }
    // could not find the user
    return done(null, false);
  }
));
passport.serializeUser(function(user, cb) {
  // console.log('SERIALIZE', JSON.stringify(user));
  cb(null, JSON.stringify(user));
});
passport.deserializeUser(function(id, cb) {
  // console.log('DESERIALIZE', JSON.parse(id));
  cb(null, JSON.parse(id));
});
app.use(passport.initialize());
app.use(passport.session());


//
// Routes
//

// Options we allow
app.options('/', function(req, res) {
  res.set('Allow', 'OPTIONS, GET, PUT, DELETE');
  res.sendStatus(200);
});

//
// Authentication Routes
//
app.post('/login', passport.authenticate('local', {
  successRedirect: '/w',
  failureRedirect: FAILURE_REDIRECT,
}));

//
// Tiddly Wiki Routes
//

// TiddlyWiki Handshake
app.get('/status', function(req, res) {
  const { user } = req;

  console.log('GET /status', user);
  res.json({
    'tiddlywiki_version': '5.1.14',
    username: user.name,
    space: {
      recipe: user.root,
    },
  });
});

//  Route for Skinny Tiddlers
// The skinny tiddlers is like a manifest. If the title and revision don't match
// the version on the page, it will make a call to re-load the tiddler data.
app.get('/recipes/:recipe/tiddlers.json', function(req, res) {
  const { recipe } = req.params;
  const pathToRoot = path.join(rootFolder, recipe);
  console.log(`GET /recipes/${recipe}/tiddlers.json`, pathToRoot);

  loadSkinny(pathToRoot)
    .then((skinnyTiddlers) => {
      if (skinnyTiddlers.length > 0) {
        return res.json(skinnyTiddlers);
      }
      return res.json([]);
    })
    .catch((err) => {
      console.log('Oops error', err);
      res.sendStatus(500);
    });
});

app.get('/recipes/:recipe/tiddlers/:title', function(req, res) {
  const { title, recipe } = req.params;
  const pathToFile = path.join(rootFolder, recipe, getFilename(title));

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
  const pathToFile = path.join(rootFolder, recipe, getFilename(title));

  // Save the tiddler and save the skinny
  saveTiddler(pathToFile, tiddler)
    .then((skinny) => {
      const { revision } = skinny;
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
  const { title, bag } = req.params;
  const pathToFile = path.join(rootFolder, bag, getFilename(title));

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
// User Routes
//

// User's index page
// Serve their version of the index.html file
app.get('/w', function(req, res) {
  if (!req.user) { return res.redirect(LOGIN_REDIRECT); }
  const { user } = req;
  const pathToIndex = path.join(rootFolder, user.root, 'index.html');

  // load from disk
  return new Promise(loadFile(pathToIndex))
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      console.log('Oops', err);
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

// Start the server with the fresh skinny list
app.listen(options.port, function () {
  console.log(`listening on port ${options.port}!`);
});
