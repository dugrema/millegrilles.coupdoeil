const debug = require('debug')('millegrilles:coupdoeil:route');
const express = require('express')

function initialiser(amqpdao, opts) {
  if(!opts) opts = {}
  const idmg = amqpdao.pki.idmg
  debug("IDMG: %s, AMQPDAO : %s", idmg, amqpdao !== undefined)

  const route = express.Router()
  route.use((req, res, next)=>{
    req.amqpdao = amqpdao
    next()
  })
  route.get('/info.json', routeInfo)
  route.get('/initSession', initSession)  
  ajouterStaticRoute(route)

  debug("Route /coupdoeil de CoupDoeil est initialisee")

  // function middleware(socket, next) {
  //   debug("Middleware grosfichiers socket.io, injection grosFichiersDao")
  //   socket.grosFichiersDao = grosFichiersDao
  //   next()
  // }

  // const socketio = {middleware, configurationEvenements}

  // Retourner dictionnaire avec route pour server.js
  return route

}

function initSession(req, res) {
  return res.sendStatus(200)
}

function ajouterStaticRoute(route) {
  // Route utilisee pour transmettre fichiers react de la messagerie en production
  var folderStatic =
    process.env.MG_STATIC_RES ||
    'static/coupdoeil'

  route.use(express.static(folderStatic))
  debug("Route %s pour coupdoeil initialisee", folderStatic)
}

function routeInfo(req, res, next) {
  debug(req.headers)
  const idmg = req.amqpdao.pki.idmg
  const nomUsager = req.headers['user-name']
  const userId = req.headers['user-id']
  const niveauSecurite = req.headers['user-securite']
  const host = req.headers.host

  const reponse = {idmg, nomUsager, userId, hostname: host, niveauSecurite}
  return res.send(reponse)
}


module.exports = {initialiser}
