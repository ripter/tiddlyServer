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
const loadShadows = require('./src/loadShadows.js');
const loadTiddler = require('./src/loadTiddler.js');
const loadFile = require('./src/loadFile.js');

const FAILURE_REDIRECT = '/error.html';
const LOGIN_REDIRECT = '/login.html';
const rootFolder = path.normalize(path.join(__dirname, '_tiddlers'));
const app = express();

// special security file
const authUsers = require('./authUsers.js');

// secure headers with helmet middleware
app.use(helmet());
// Setup static file server for the index.html
app.use(express.static(path.join(__dirname, 'public')));
// Setup server side rendering
app.set('view engine', 'ejs');
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
passport.use(new LocalStrategy(authUsers));
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

app.get('/', function(req, res) {
  // Logged out users
  if (!req.user) {
    return res.render('default', {
      systemTiddlers: [],
    });
  }
  // Logged in users
  const { user } = req;
  const pathToRoot = path.join(rootFolder, user.root);
  return loadShadows(pathToRoot)
    .then((shadowTiddlers) => {
      if (shadowTiddlers.length === 0) {
        shadowTiddlers = [];
      }

      return res.render('default', {
        user,
        systemTiddlers: shadowTiddlers,
      });
    })
    .catch((err) => {
      console.log('Oops error', err);
    });
    return res.sendStatus(500);
});

//
// Authentication Routes
//
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: FAILURE_REDIRECT,
}));

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

//
// Tiddly Wiki Routes
//

// TiddlyWiki Handshake
app.get('/status', function(req, res) {
  if (!req.user) { return res.sendStatus(401); }
  const { user } = req;

  // console.log('GET /status', user);
  return res.json({
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
  if (!req.user) { return res.sendStatus(401); }
  const { recipe } = req.params;
  const pathToRoot = path.join(rootFolder, recipe);
  // console.log(`GET /recipes/${recipe}/tiddlers.json`, pathToRoot);

  return loadSkinny(pathToRoot)
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

/**
 * Load a tiddler by title
 */
app.get('/recipes/:recipe/tiddlers/:title', function(req, res) {
  if (!req.user) { return res.redirect(LOGIN_REDIRECT); }
  const { title, recipe } = req.params;
  const pathToFile = path.join(rootFolder, recipe, getFilename(title));
  // console.log(`GET: /recipe/${recipe}/tiddlers/${title}`);

  return loadTiddler(pathToFile)
    .then((tiddler) => {
      res.json(tiddler);
    })
    .catch((err) => {
      console.log('Oops error', err);
      res.sendStatus(500);
    });
});

/**
 * Save a tiddler by title
 */
app.put('/recipes/:recipe/tiddlers/:title', function(req, res) {
  if (!req.user) { return res.sendStatus(401); }
  const { title, recipe } = req.params;
  const tiddler = req.body;
  const pathToFile = path.join(rootFolder, recipe, getFilename(title));
  // console.log(`PUT: /recipe/${recipe}/tiddlers/${title}`);

  // Save the tiddler and save the skinny
  return saveTiddler(pathToFile, tiddler)
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
  if (!req.user) { return res.redirect(LOGIN_REDIRECT); }
  const { title, bag } = req.params;
  const { user } = req;
  const pathToFile = path.join(rootFolder, user.root, getFilename(title));
  console.log(`DELETE: /bags/${bag}/tiddlers/${title}`);

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

// User's personal index page
// Serve their version of the index.html file
// app.get('/w', function(req, res) {
//   if (!req.user) { return res.redirect(LOGIN_REDIRECT); }
//   const { user } = req;
//   const pathToIndex = path.join(rootFolder, user.root, 'index.html');
//
//   // load from disk
//   return new Promise(loadFile(pathToIndex))
//     .then((data) => {
//       res.send(data);
//     })
//     .catch((err) => {
//       console.log('Oops', err);
//       res.sendStatus(500);
//     });
// });


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
