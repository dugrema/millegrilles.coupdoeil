const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const {APIRouteurInitialiser} = require('./routes/api'); // apiRouter = require('./routes/api');
const {initialiserGrosFichiers} = require('./routes/grosFichiers'); // grosFichiersRouter = require('./routes/grosFichiers');

function initialiserApp(sessionManagement) {
  const app = express();

  // Config de base, paths statiques
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));

  // API principal
  const routeurApi = APIRouteurInitialiser(sessionManagement);

  // GrosFichiers
  const optsGrosFichiers = {
    stagingFolder: process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging",
    serveurConsignation: process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers',
  }
  const routeurGrosFichiers = initialiserGrosFichiers(sessionManagement);

  app.use('/api', routeurApi);
  app.use('/grosFichiers', routeurGrosFichiers);

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
