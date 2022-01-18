const debug = require('debug')('millegrilles:coupdoeil:amqpdao')
const fs = require('fs/promises')
// const {MilleGrillesPKI, MilleGrillesAmqpDAO} = require('@dugrema/millegrilles.common')
const {MilleGrillesPKI, MilleGrillesAmqpDAO} = require('@dugrema/millegrilles.nodejs')

async function init() {

  // Preparer certificats
  const certPem = await fs.readFile(process.env.MG_MQ_CERTFILE)
  const keyPem = await fs.readFile(process.env.MG_MQ_KEYFILE)
  const certMillegrillePem = await fs.readFile(process.env.MG_MQ_CAFILE)

  // Charger certificats, PKI
  const certPems = {
    millegrille: certMillegrillePem.toString('utf-8'),
    cert: certPem.toString('utf-8'),
    key: keyPem.toString('utf-8'),
  }

  // Charger PKI
  const instPki = new MilleGrillesPKI()
  await instPki.initialiserPkiPEMS(certPems)

  // Connecter a MilleGrilles avec AMQP DAO
  const amqpdao = new MilleGrillesAmqpDAO(instPki)
  const mqConnectionUrl = process.env.MG_MQ_URL;
  await amqpdao.connect(mqConnectionUrl)

  // Middleware, injecte l'instance
  const middleware = (req, res, next) => {
    req.amqpdao = amqpdao
    next()
  }

  return {middleware, amqpdao}
}

module.exports = {init}
