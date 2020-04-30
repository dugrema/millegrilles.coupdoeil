const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const {initialiserGrosFichiers} = require('./routes/grosFichiers'); // grosFichiersRouter = require('./routes/grosFichiers');
const {initialiserInfo} = require('./routes/info');

function initialiserApp(sessionManagement, opts) {
  if(!opts) opts = {};

  const app = express();

  // Config de base, paths statiques
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));

  // GrosFichiers
  const optsGrosFichiers = {
    stagingFolder: process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging",
    serveurConsignation: process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers',
  }
  const routeurGrosFichiers = initialiserGrosFichiers(sessionManagement);
  app.use('/grosFichiers', routeurGrosFichiers);

  // Configuration
  const routeurInfo = initialiserInfo(sessionManagement, opts);
  app.use('/config', routeurInfo);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.error("Error handler");
    console.error(err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
}

module.exports = {initialiserApp};
