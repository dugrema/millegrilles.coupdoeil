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
    this.new_sockets = {};
    this.authenticated_sockets = {};
    setInterval(()=>{
      this.clean();
    }, 60000);
  }

  clean() {
    for(var socket_id in this.new_sockets) {
      let socket_obj = this.new_sockets[socket_id];
      if(!socket_obj.disconnected) {
        console.debug("On deconnecte un socket expire: " + socket_obj.id);
        socket_obj.disconnect();
      } else {
        console.debug("Nettoyage vieux socket deja deconnecte: " + socket_obj.id);
      }
      delete this.new_sockets[socket_id];
    }

    for(var socket_id in this.authenticated_sockets) {
      let socket_obj = this.authenticated_sockets[socket_id];
      if(socket_obj.disconnected) {
        console.debug("Nettoyage vieux socket authentifie deja deconnecte: " + socket_obj.id);
        delete this.authenticated_sockets[socket_id];
      }
    }
  }

  addSocket(socket) {
    // Ajoute un socket d'une nouvelle connexion
    // console.debug("Nouveau socket!");
    this.new_sockets[socket.id] = socket;

    sessionManagement.addSocketConnection(socket)
    .then(()=>{
      this.saveAuthenticated(socket);
      this.registerEvents(socket);
    }).catch(err=>{
      console.error("Erreur traitement socket " + socket.id + ", on le ferme.");
      socket.disconnect();
      delete this.new_sockets[socket.id];
    });  // Attache evements auth
  }

  saveAuthenticated(socket) {
    this.authenticated_sockets[socket.id] = socket;
    delete this.new_sockets[socket.id];
    console.debug("Moved socket " + socket.id + " from new_sockets to authenticated_sockets");
  }

  registerEvents(socket) {
    // Enregistre tous les evenements transmis par le front-end coupdoeil.
    // registerDocument: Enregistrer nouvelle routingKey pour le socket
    // unregisterDocument: Retirer routingKey pour socket
    // requete: Executer une requete

    socket.on('registerDocument', message => {
      rabbitMQ.rabbitMQ_singleton.routingKeyManager
        .addRoutingKeyForSocket(socket, message);
    });

    socket.on('unregisterDocument', message => {
      rabbitMQ.rabbitMQ_singleton.routingKeyManager
        .removeRoutingKeyForSocket(socket, message);
    });

    socket.on('requete', (enveloppe, cb) => {
      console.log("Envelope de requete recue");
      console.log(enveloppe);
      let routingKey = enveloppe.routingKey;
      let requete = enveloppe.requete;

      rabbitMQ.singleton
        .transmettreRequete(routingKey, requete)
      .then( reponse => {
        let messageContent = decodeURIComponent(escape(reponse.content));
        let json_message = JSON.parse(messageContent);
        cb(json_message.resultats); // On transmet juste les resultats
      })
      .catch( err => {
        console.error("Erreur requete");
        console.error(err);
        cb(); // Callback sans valeurs
      });
    });

  }

}

const websocketapp = new WebSocketApp();
module.exports = websocketapp;
