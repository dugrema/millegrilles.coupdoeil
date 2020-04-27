const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const {RabbitMQWrapper} = require('./routes/res/rabbitMQ')
const {APIRouteurInitialiser} = require('./routes/api'); // apiRouter = require('./routes/api');
const {initialiserGrosFichiers} = require('./routes/grosFichiers'); // grosFichiersRouter = require('./routes/grosFichiers');
const {PKIUtils} = require('./routes/res/pki');
const {SessionManagement} = require('./routes/res/sessionManagement');

function initialiserApp() {
  const app = express();

  // Connexion a RabbitMQ
  // amqps://mq:5673/[idmg]
  const rabbitMQ = new RabbitMQWrapper();
  const mqConnectionUrl = process.env.MG_MQ_URL;
  rabbitMQ.connect(mqConnectionUrl);

  // Config de base, paths statiques
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));

  // Charger certificats, PKI
  const certs = {
    millegrille: process.env.MG_MQ_CAFILE,
    certFile: process.env.MG_MQ_CERTFILE,
    keyFile: process.env.MG_MQ_KEYFILE,
  };
  const pki = new PKIUtils(certs);

  // Demarrer gestion de sessions websockets
  const sessionManagement = new SessionManagement(rabbitMQ);
  sessionManagement.start();

  // API principal
  const routeurApi = APIRouteurInitialiser(rabbitMQ, sessionManagement, pki);

  // GrosFichiers
  const optsGrosFichiers = {
    stagingFolder: process.env.MG_STAGING_FOLDER || "/tmp/coupdoeilStaging",
    serveurConsignation: process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers',
  }
  const routeurGrosFichiers = initialiserGrosFichiers(rabbitMQ, sessionManagement, pki, app, optsGrosFichiers);

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
