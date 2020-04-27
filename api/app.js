var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Routes
var {APIRouteurInitialiser} = require('./routes/api'); // apiRouter = require('./routes/api');
var {InitialiserGrosFichiers} = require('./routes/grosFichiers'); // grosFichiersRouter = require('./routes/grosFichiers');
var {PKIUtils} = require('./routes/res/pki');

function InitialiserApp() {
  const app = express();

  // Config de base, paths statiques
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));

  // Charger certificats, PKI
  const certs = {
    millegrille: process.env.MG_MQ_CAFILE,
    certFile: process.env.MG_MQ_CERTFILE,
    keyFile: process.env.MG_MQ_KEYFILE,
  };
  const pki = PKIUtils({});

  // API principal
  const routeurApi = APIRouteurInitialiser(rabbitMQ, sessionManagement, pki);

  // GrosFichiers
  const optsGrosFichiers = {
    stagingFolder: process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging",
    serveurConsignation: process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers',
  }
  const routeurGrosFichiers = InitialiserGrosFichiers(rabbitMQ, sessionManagement, pki, optsGrosFichiers);

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
}

module.exports = {InitialiserApp};
