// const debug = require('debug')('millegrilles:coupdoeil:route')
// const express = require('express')
// const logger = require('morgan')
// const path = require('path')
// const socketio = require('socket.io')
//
// const {configurationEvenements} = require('../models/coupdoeilSocketApp')
// const {initialiserBackupRoute} = require('../models/backupProcess')
// // const {SessionManagement} = require('millegrilles.common/lib/sessionManagement')
//
// var _idmg = null
// var _modeHebergement = false
//
// // Demarrer gestion de sessions websockets
// // var _sessionManagement = null
//
// // Application de gestion des evenements de Socket.IO
// var _webSocketApp = null
//
// const _info = {
//   modeHebergement: false,
// };
//
// function initialiser(fctRabbitMQParIdmg, opts) {
//   if(!opts) opts = {}
//
//   if(opts.idmg) {
//     // Pour mode sans hebergement, on conserve le IDMG de reference local
//     _info.idmg = opts.idmg
//   } else {
//     // Pas d'IDMG de reference, on est en mode hebergement
//     _info.modeHebergement = true
//   }
//
//   // Session management, utilise par /info.json et Socket.IO
//   // _sessionManagement = new SessionManagement(fctRabbitMQParIdmg);
//   // _sessionManagement.start();
//
//   // Demarrer application qui s'occupe de Socket.IO pour Coup D'Oeil
//   // _webSocketApp = new WebSocketApp(fctRabbitMQParIdmg);
//
//   const routeCoupdoeil = express()
//
//   // Aucune fonctionnalite n'est disponible via REST, tout est sur socket.io
//   routeCoupdoeil.get('/info.json', routeInfo)
//
//   // Lien vers code React de CoupDoeil
//   ajouterStaticRoute(routeCoupdoeil)
//
//   const backupRoute = initialiserBackupRoute()
//   routeCoupdoeil.use('/backup', backupRoute)
//
//   // catch 404 and forward to error handler
//   routeCoupdoeil.use(function(req, res, next) {
//     res.status(404);
//     res.end()
//   });
//
//   // error handler
//   routeCoupdoeil.use(function(err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//     console.error(" ************** Unhandled error begin ************** ");
//     console.error(err);
//     console.error(" ************** Unhandled error end   ************** ");
//
//     res.status(err.status || 500);
//     res.end()
//   });
//
//   // Ajouter parametres pour Socket.IO
//   // const socketio = {addSocket}
//
//   const socketio = {configurationEvenements}
//
//   return {route: routeCoupdoeil, socketio}
// }
//
// function ajouterStaticRoute(route) {
//   var folderStatic =
//     process.env.MG_COUPDOEIL_STATIC_RES ||
//     'static/coupdoeil'
//
//   debug("Folder static pour coupdoeil : %s", folderStatic)
//
//   route.use(express.static(folderStatic))
// }
//
// // Fonction qui permet d'activer Socket.IO pour l'application
// async function addSocket(socket) {
//   debug("Coupdoeil addSocket id %s", socket.id)
//   return await _webSocketApp.addSocket(socket);
// }
//
// function routeInfo(req, res, next) {
//
//   const reponse = JSON.stringify(_info);
//   res.setHeader('Content-Type', 'application/json');
//   res.end(reponse);
//
// };
//
// module.exports = {initialiser};


const debug = require('debug')('millegrilles:coupdoeil:route');
const express = require('express')

// const { configurationEvenements } = require('../models/appSocketIo')
// const { GrosFichiersDao } = require('../models/grosFichiersDao')

function initialiser(amqpdao, opts) {
  if(!opts) opts = {}
  const idmg = amqpdao.pki.idmg
  // const amqpdao = fctRabbitMQParIdmg(idmg)

  // const grosFichiersDao = new GrosFichiersDao(amqpdao)

  debug("IDMG: %s, AMQPDAO : %s", idmg, amqpdao !== undefined)

  const route = express.Router()
  route.get('/info.json', routeInfo)
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
  const idmgCompte = req.headers['idmg-compte']
  const nomUsager = req.headers['user-prive']
  const host = req.headers.host

  const reponse = {idmgCompte, nomUsager, hostname: host}
  return res.send(reponse)
}

module.exports = {initialiser}
