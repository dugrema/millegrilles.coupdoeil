var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');
var grosFichiersRouter = require('./routes/grosFichiers');
var sessionManagement = require('./routes/res/sessionManagement.js');

var app = express();
var multer_fn = multer({dest: "/tmp/uploadStaging"}).array('multiInputFilename');

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

function authentication(req, res, next) {
  let url = req.url;

  if(url.startsWith('/grosFichiers')) {
    // Pour le transfert de fichiers, il faut fournir un token de connexion
    let authtoken = req.headers.authtoken;
    // console.debug("AUTH: Recu token " + authtoken);
    if(sessionManagement.consommerToken(authtoken)) {
      // console.debug("Token consomme: " + authtoken + ", accepte.");
      next();
    } else {
      // console.error("Token invalide pour transfert fichier" + authToken);
      res.sendStatus(403);
    }
  } else {
    // URL n'est pas protege
    next();
  }

  return;
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(authentication);  // Utilise pour transfert de fichiers
app.use(multer_fn);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/grosFichiers', grosFichiersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
