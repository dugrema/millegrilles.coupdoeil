const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const {initialiserInfo} = require('./routes/info')
const {initialiserGrosFichiers} = require('./routes/grosFichiers')

function initialiserApp(sessionManagement, opts) {
  if(!opts) opts = {}
  const app = express()

  // Logging requetes http
  initLogging(app)

  app.use('/coupdoeil', initCoupdoeil(sessionManagement, opts))

  return app;
}

function initLogging(app) {
  const loggingType = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
  app.use(logger(loggingType));  // logging
}

function initCoupdoeil(sessionManagement, opts) {
  const routeCoupdoeil = express()

  // Path /grosfichiers
  routeCoupdoeil.use('/grosFichiers', initGrosFichiers(routeCoupdoeil, sessionManagement))

  // Path /config
  routeCoupdoeil.use('/config', initRouteurInfo(routeCoupdoeil, sessionManagement, opts))

  // Config de base, paths statiques
  routeCoupdoeil.use(express.static(path.join(__dirname, 'public')));

  // catch 404 and forward to error handler
  routeCoupdoeil.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  routeCoupdoeil.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.error("Error handler");
    console.error(err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return routeCoupdoeil
}

function initGrosFichiers(app, sessionManagement) {
  const optsGrosFichiers = {
    stagingFolder: process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging",
    serveurConsignation: process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers',
  }
  const routeurGrosFichiers = initialiserGrosFichiers(sessionManagement);
  return routeurGrosFichiers
}

function initRouteurInfo(app, sessionManagement, opts) {
  const routeurInfo = initialiserInfo(sessionManagement, opts)
  return routeurInfo
}

module.exports = {initialiserApp};
