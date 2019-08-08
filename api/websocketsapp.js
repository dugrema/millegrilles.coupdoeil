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
      this.cleanNew();
    }, 5000);

    setInterval(()=>{
      this.cleanDisconnected();
    }, 60000);

    rabbitMQ.singleton.routingKeyManager.setWebSocketsManager(this); // Permet transmettre incoming msg
  }

  cleanNew() {
    // Nettoyage des sockets nouveaux connectes qui ne sont pas authentifies
    // Limite le temps permis pour authentifier
    let tempsCourant = (new Date()).getTime();
    for(var socket_id in this.new_sockets) {
      let socket_obj = this.new_sockets[socket_id];

      let socket = socket_obj.socket;
      if(socket_obj.expiration < tempsCourant){
        console.debug("On deconnecte un socket pas authentifie expire: " + socket_id);
        socket.disconnect();
      }

      if(socket.disconnected) {
        console.debug("Nettoyage socket pas authentifie: " + socket_id);
        delete this.new_sockets[socket_id];
      }
    }
  }

  cleanDisconnected() {
    // Housekeeping, normalement l'evenement disconnect du socket va
    // declencher la suppression du socket.
    for(var socket_id in this.authenticated_sockets) {
      let socket_obj = this.authenticated_sockets[socket_id];
      if(socket_obj.disconnected) {
        console.debug("Nettoyage vieux socket authentifie deja deconnecte: " + socket_obj.id);
        delete this.authenticated_sockets[socket_id];
      }
    }
  }

  disconnectedHandler(socket) {
    console.debug("Socket deconnecte " + socket.id);
    delete this.new_sockets[socket.id];
    delete this.authenticated_sockets[socket.id];
  }

  addSocket(socket) {

    // Ajoute un socket d'une nouvelle connexion
    // console.debug("Nouveau socket!");
    if(!socket.disconnected) {
      // S'assure que le socket n'a pas ete deconnecte avant d'ajouter
      // l'evenement de gestion du disconnect
      socket.on('disconnect', ()=>{
        this.disconnectedHandler(socket);
      });
      this.new_sockets[socket.id] = {
        socket: socket,
        expiration: (new Date()).getTime()+10000
      };

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

    socket.on('subscribe', message => {
      rabbitMQ.singleton.routingKeyManager
        .addRoutingKeysForSocket(socket, message);
    });

    socket.on('unsubscribe', message => {
      // console.debug("Message unsubscribe");
      // console.debug(message);
      rabbitMQ.singleton.routingKeyManager
        .removeRoutingKeysForSocket(socket, message);
    });

    socket.on('requete', (enveloppe, cb) => {
      // console.debug("Enveloppe de requete recue");
      // console.debug(enveloppe);
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

    socket.on('creerTokenTransfert', (message, cb) => {
      let token = sessionManagement.createTokenTransfert();
      cb(token); // Renvoit le token pour amorcer le transfert via PUT
    });

    socket.on('enregistrerDevice', (message)=> {
      // Declence l'ajout d'un nouveau device d'Authentification
      // Envoyer le challenge et utiliser callback pour recevoir la confirmation
      // Transmettre le challenge
      const challengeResponse = generateRegistrationChallenge({
          relyingParty: { name: 'coupdoeil' },
          user: { id: 'usager', name: 'usager' }
      });
      var challenge_conserve = challengeResponse.challenge;

      socket.emit('challengeEnregistrerDevice', challengeResponse, (reponse)=>{
        const { key, challenge } = parseRegisterRequest(reponse);

        console.log("Parsed: key, challenge de nouveau device");
        console.log(key);
        console.log(challenge);

        var empreinte = {
            'cle': key
        }

        // Noter que la transaction va echouer si l'empreinte a deja ete creee.
        rabbitMQ.singleton.transmettreTransactionFormattee(
            empreinte, 'millegrilles.domaines.Principale.ajouterToken')
          .then( msg => {
            console.log("Recu confirmation d'ajout de device'");
            console.log(msg);
          })
          .catch( err => {
            console.error("Erreur message");
            console.error(err);
          });
      });

    });

    // Expose l'appel aux transactions MQ.
    socket.on('transaction', (message, cb) => {
      let routingKey = message.routingKey;
      let transaction = message.transaction;
      rabbitMQ.singleton.transmettreTransactionFormattee(
        transaction, routingKey
      ).then(msg=>{
        cb(msg);
      }).catch(err =>{
        console.error("Erreur transmission transaction");
        console.error(err);
      })
    });

  }

}

const websocketapp = new WebSocketApp();
module.exports = websocketapp;
