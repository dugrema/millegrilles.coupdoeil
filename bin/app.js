const debug = require('debug')('millegrilles:app')
const express = require('express')
const logger = require('morgan')
const {initialiser: initialiserCoupdoeil, initSocketIo} = require('../routes/coupdoeil')

async function initialiser(fctRabbitMQParIdmg, opts) {
  const app = express()

  initLogging(app)

  app.use(initialiserCoupdoeil(fctRabbitMQParIdmg, opts))

  debug("Application Coup D'Oeil initialisee")

  return app
}

function initLogging(app) {
  const loggingType = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
  app.use(logger(loggingType));  // logging
}

module.exports = {initialiser, initSocketIo}
