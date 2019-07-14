var rabbitMQ = require('./routes/res/rabbitMQ');
var fs = require('fs');
var sessionManagement = require('./routes/res/sessionManagement');

const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');

class WebSocketApp {

  constructor() {
    this.new_sockets = [];
    this.authenticated_sockets = Object();
    setInterval(()=>{
      this.clean();
    }, 60000);
  }

  clean() {
    for(var socket_id in this.new_sockets) {
      let socket_obj = this.new_sockets[socket_id]
      if(!socket_obj.disconnected) {
        console.debug("On deconnecte un socket expire: " + socket_obj.id);
        socket_obj.disconnect();
      } else {
        console.debug("Nettoyage vieux socket deja deconnecte: " + socket_obj.id);
      }
      delete this.new_sockets[socket_id];
    }
  }

  addSocket(socket) {
    // Ajoute un socket d'une nouvelle connexion
    console.debug("Nouveau socket!");
    this.new_sockets[socket.id] = socket;

    sessionManagement.addSocketConnection(socket)
    .then(()=>{
      console.log("!!! YEEEE AWWHHHH!!!!");
      this.saveAuthenticated(socket);
    }).catch(err=>{
      console.error("Erreur traitement socket " + socket.id + ", on le ferme.");
      socket.disconnect();
      delete this.new_sockets[socket.id];
    });  // Attache evements auth
  }

  saveAuthenticated(socket) {
    this.authenticated_sockets[socket.id] = socket;
    delete this.new_sockets[socket.id];
  }

}

const websocketapp = new WebSocketApp();
module.exports = websocketapp;
