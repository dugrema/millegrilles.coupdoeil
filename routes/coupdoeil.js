const debug = require('debug')('coupdoeil:route')
const express = require('express')
const logger = require('morgan')
const path = require('path')
const socketio = require('socket.io')

const {WebSocketApp} = require('../models/websocketsapp')
const {SessionManagement} = require('../models/sessionManagement')

var _idmg = null
var _modeHebergement = false

// Demarrer gestion de sessions websockets
var _sessionManagement = null

const _info = {
  modeHebergement: false,
};

function initialiser(fctRabbitMQParIdmg, opts) {
  if(!opts) opts = {}

  if(opts.idmg) {
    // Pour mode sans hebergement, on conserve le IDMG de reference local
    _info.idmg = opts.idmg
  } else {
    // Pas d'IDMG de reference, on est en mode hebergement
    _info.modeHebergement = true
  }

  // Session management, utilise par /info.json et Socket.IO
  _sessionManagement = new SessionManagement(fctRabbitMQParIdmg);
  _sessionManagement.start();

  const routeCoupdoeil = express()

  // Aucune fonctionnalite n'est disponible via REST, tout est sur socket.io
  routeCoupdoeil.get('/info.json', routeInfo)

  // Lien vers code React de CoupDoeil
  ajouterStaticRoute(routeCoupdoeil)

  // catch 404 and forward to error handler
  routeCoupdoeil.use(function(req, res, next) {
    throw {status: 404}
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
    res.end()
  });

  return routeCoupdoeil

}

function ajouterStaticRoute(route) {
  var folderStatic =
    process.env.MG_COUPDOEIL_STATIC_RES ||
    path.join(__dirname, 'static', 'coupdoeil')

  route.use(express.static(folderStatic))
}

function initSocketIo(server, opts) {
  if(!opts) opts = {}

  // Demarrer application qui s'occupe de Socket.IO pour Coup D'Oeil
  const webSocketApp = new WebSocketApp(_sessionManagement);

  const path = opts.pathSocketio || '/coupdoeil/socket.io'
  const socketIo = socketio(server, {path});

  socketIo.on('connection', (socket) => {
    debug("server:Connexion socket.IO id = %s, remoteAddress = %s", socket.id, socket.conn.remoteAddress);
    webSocketApp.addSocket(socket);
  });

}

function routeInfo(req, res, next) {

  const reponse = JSON.stringify(_info);
  res.setHeader('Content-Type', 'application/json');
  res.end(reponse);

};

module.exports = {initialiser, initSocketIo};
