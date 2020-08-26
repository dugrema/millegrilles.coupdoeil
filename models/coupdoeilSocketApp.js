var fs = require('fs');
// var {SocketIoUpload} = require('../routes/res/SocketioUpload');
const debug = require('debug')('millegrilles:coupdoeil:coupdoeilSocketApp')

// var sessionManagement = require('./routes/res/sessionManagement');
// var pki = require('./routes/res/pki');
// var rabbitMQ = require('./routes/res/rabbitMQ');

// const {
//     generateRegistrationChallenge,
//     parseRegisterRequest,
//     generateLoginChallenge,
//     parseLoginRequest,
//     verifyAuthenticatorAssertion,
// } = require('@webauthn/server');
//
// class WebSocketResources {
//   // Classe utilisee pour conserver les references vers les ressources privees
//   // d'une connexion websocket (e.g. channel MQ, reply_Q).
//
//   constructor(socket) {
//     this.socket = socket;
//
//     this.mqChannel = null;
//     this.reply_q = null;
//     this.expiration = (new Date()).getTime()+120000; // 2 minutes pour socket connect
//   }
//
//   close() {
//     if(this.mqChannel) {
//       try {
//         if(this.reply_q) {
//           // console.debug("Delete reply Q pour socket " + this.socket.id);
//           this.mqChannel.deleteQueue(this.reply_q.queue).catch(err=>{});
//         }
//       } finally {
//         // console.debug("Fermeture channel MQ pour socket " + this.socket.id);
//         this.mqChannel.close().catch(err=>{});
//       }
//
//     }
//   }
//
// }

class WebSocketApp {

  constructor(fctRabbitMQParIdmg) {
    this.fctRabbitMQParIdmg = fctRabbitMQParIdmg
    // this.rabbitMQ = rabbitMQ;
    // this.pki = pki;
    // this.sessionManagement = sessionManagement;

    // this.new_sockets = false;
    // this.authenticated_sockets = false;

    // setInterval(()=>{
    //   this.cleanNew();
    // }, 5000);
    //
    // setInterval(()=>{
    //   this.cleanDisconnected();
    // }, 60000);

    // this.rabbitMQ.routingKeyManager.setWebSocketsManager(this); // Permet transmettre incoming msg
  }

  // cleanNew() {
  //   // Nettoyage des sockets nouveaux connectes qui ne sont pas authentifies
  //   // Limite le temps permis pour authentifier
  //   let tempsCourant = (new Date()).getTime();
  //   for(var socket_id in this.new_sockets) {
  //     let socketResources = this.new_sockets[socket_id];
  //
  //     let socket = socketResources.socket;
  //     if(socketResources.expiration < tempsCourant){
  //       // console.debug("On deconnecte un socket pas authentifie expire: " + socket_id);
  //       socket.disconnect();
  //     }
  //
  //     if(socket.disconnected) {
  //       // console.debug("Nettoyage socket pas authentifie: " + socket_id);
  //       socketResources.close();
  //       delete this.new_sockets[socket_id];
  //     }
  //   }
  // }
  //
  // cleanDisconnected() {
  //   // Housekeeping, normalement l'evenement disconnect du socket va
  //   // declencher la suppression du socket.
  //   for(var socket_id in this.authenticated_sockets) {
  //     let socketResources = this.authenticated_sockets[socket_id];
  //     if(socketResources.socket.disconnected) {
  //       socketResources.close();
  //       delete this.authenticated_sockets[socket_id];
  //     }
  //   }
  // }

  disconnectedHandler(socket) {
    // console.debug("Socket deconnecte " + socket.id);

    if(socket.mqChannel) {
      try {
        if(socket.reply_q) {
          console.debug("Delete reply Q pour socket %s", socket.id);
          socket.mqChannel.deleteQueue(socket.reply_q.queue).catch(err=>{});
        }
      } finally {
        console.debug("Fermeture channel MQ pour socket %s", socket.id);
        socket.mqChannel.close().catch(err=>{});
      }

    }

    // let socketResources = this.new_sockets[socket.id] || this.authenticated_sockets[socket.id];
    // if(socketResources) {
    //   socketResources.close();
    // }
    //
    // delete this.new_sockets[socket.id];
    // delete this.authenticated_sockets[socket.id];
  }

  // Methode utiliser pour ajouter une nouvelle connexion a partir de Socket.IO (listener)
  // L'authentification securitaire de l'usager est la premier action de addSocket.
  addSocket(socket) {
    debug("Socket connecte")
    debug(socket.request.headers)

    const estProprietaire = socket.request.headers['est-proprietaire'] || process.env.DEV
    const idmgClient = socket.request.headers['idmg'] || process.env.IDMG

    // Ajoute un socket d'une nouvelle connexion
    // console.debug("Nouveau socket!");
    if(!estProprietaire) {
      console.error("Usager n'est pas proprietaire de la millegrille sur socket " + socket.id + ", on le ferme.");
      socket.disconnect();
      delete this.new_sockets[socket.id];
    } else if(!socket.disconnected) {
      // let socketResources = new WebSocketResources(socket);

      // socket.mqChannel = null;
      // socket.reply_q = null;

      // S'assure que le socket n'a pas ete deconnecte avant d'ajouter
      // l'evenement de gestion du disconnect
      socket.on('disconnect', ()=>{
        this.disconnectedHandler(socket);
      });
      // this.new_sockets[socket.id] = socketResources;

      // Ouvrir Channel MQ
      // console.debug("Debut de l'authentification");
      var rabbitMQ_local = null;
      return this.addSocketConnection(socket)
      .then(rabbitMQ=>{
        if(!rabbitMQ) {
          throw new Error("Idmg inconnu");
        }
        rabbitMQ_local = rabbitMQ;

        const idmg = rabbitMQ.pki.idmg;
        debug("Authentification est completee, idmg: %s", idmg);

        return rabbitMQ.createChannel(socket);
      })
      .then(()=>{
        // this.saveAuthenticated(socketResources);
        this.registerEvents(rabbitMQ_local, socket);
      }).catch(err=>{
        console.error("Erreur traitement socket " + socket.id + ", on le ferme.");
        console.error(err);
        // socketResources.close();
        socket.disconnect();
        // delete this.new_sockets[socket.id];
      });  // Attache evements auth
    }

  }

  // saveAuthenticated(socketResources) {
  //   let socket = socketResources.socket;
  //   this.authenticated_sockets[socket.id] = socketResources;
  //   delete this.new_sockets[socket.id];
  //   // console.debug("Moved socket " + socket.id + " from new_sockets to authenticated_sockets");
  // }

  registerEvents(rabbitMQ, socket) {
    debug("Register events")
    // Enregistre tous les evenements transmis par le front-end coupdoeil.
    // registerDocument: Enregistrer nouvelle routingKey pour le socket
    // unregisterDocument: Retirer routingKey pour socket
    // requete: Executer une requete
    // let channel = socket.mqChannel;
    // let reply_q = socket.reply_q;

    let channel = rabbitMQ.channel
    const reply_q = rabbitMQ.reply_q

    const listeners = []

    // Enregistrer evenements upload
    // new SocketIoUpload(rabbitMQ, rabbitMQ.pki).enregistrer(socket);
    listeners.push({eventName: 'subscribe', callback: message => {
      const {routingKeys, niveauSecurite} = message
      debug("Subscribe %O", message)
      rabbitMQ.routingKeyManager
        .addRoutingKeysForSocket(socket, routingKeys, niveauSecurite, channel, reply_q);
    }})
    listeners.push({eventName: 'unsubscribe', callback: message => {
      // console.debug("Message unsubscribe");
      // console.debug(message);
      debug("Unsubscribe %O", message)
      const {routingKeys, niveauSecurite} = message
      rabbitMQ.routingKeyManager
        .removeRoutingKeysForSocket(socket, message, niveauSecurite, channel, reply_q);
    }})
    listeners.push({eventName: 'requete', callback: (enveloppe, cb) => {
      // console.debug("Enveloppe de requete recue");
      // console.debug(enveloppe);
      const domaineAction = enveloppe.domaineAction;
      const requete = enveloppe.requete;
      const opts = enveloppe.opts || {};

      rabbitMQ.transmettreRequete(domaineAction, requete)
      .then( reponse => {
        cb(reponse.resultats || reponse)
      })
      .catch( err => {
        console.error("Erreur requete");
        console.error(err);
        cb(); // Callback sans valeurs
      });
    }})
    listeners.push({eventName: 'requeteMultiDomaines', callback: (enveloppe, cb) => {
      // console.debug("Enveloppe de requete recue");
      // console.debug(enveloppe);
      const domaineAction = enveloppe.domaineAction;
      const requete = enveloppe.requete;
      const opts = enveloppe.opts || {};

      rabbitMQ.transmettreRequeteMultiDomaines(domaineAction, requete)
      .then( reponse => {
        cb(reponse.resultats || reponse)
      })
      .catch( err => {
        console.error("Erreur requete multi-domaines");
        console.error(err);
        cb(); // Callback sans valeurs
      });
    }})
    listeners.push({eventName: 'transaction', callback: (message, cb) => {
      this.traiterTransaction(rabbitMQ, message, cb)
    }})
    listeners.push({eventName: 'commande', callback: (message, cb) => {
      this.traiterCommande(rabbitMQ, message, cb)
    }})
    listeners.push({eventName: 'ajouterMotdepasse', callback: params => {
      debug("Ajouter mot de passe")
    }})

    for(let idx in listeners) {
      const listener = listeners[idx]
      socket.listenersProprietaires.push(listener)
    }

  }

  traiterTransaction(rabbitMQ, message, cb) {
    // console.log("Message");
    // console.log(message);
    let routingKey = message.routingKey;
    let transaction = message.transaction;
    let opts = message.opts;
    rabbitMQ.transmettreTransactionFormattee(
      transaction, routingKey, opts
    ).then(messageReponse=>{
      cb(messageReponse);
    }).catch(err =>{
      console.error("Erreur transmission transaction");
      console.error(err);
      cb({'err': err.toString()});
    })
  }

  traiterCommande(rabbitMQ, enveloppe, cb) {
    // console.debug("Enveloppe de commande recue");
    // console.debug(enveloppe);
    let routingKey = enveloppe.routingKey;
    let commande = enveloppe.commande;
    let nowait = !cb;

    rabbitMQ.transmettreCommande(routingKey, commande, {nowait})
      .then( reponse => {
        if(reponse) {
          if(cb) {
            cb(reponse.resultats || reponse); // On transmet juste les resultats
          }
        } else {
          if(!nowait) {
            console.error("Erreur reception reponse commande " + routingKey);
          }
        }
      })
      .catch( err => {
        console.error("Erreur commande");
        console.error(err);
        if(cb) {
          cb(); // Callback sans valeurs
        }
      });
  }

  extraireClePubliqueMaitredescles(rabbitMQ) {
    return rabbitMQ.demanderCertificatMaitreDesCles()
    .then(certificat=>{
      // console.debug("Certificat maitredescles");
      // console.debug(certificat);

      const infoCertificat = rabbitMQ.pki.extraireClePubliqueFingerprint(certificat);

      // console.debug(infoCertificat);

      // Enlever le wrapping pour faciliter l'usage pour le navigateur
      return infoCertificat;
    })
  }


  // Ajoute un socket et attend l'evenement d'authentification
  addSocketConnection(socket) {

    // Authentification privee
    // Doit s'assurer que la connexion est pour le bon IDMG
    // et que c'est le proprietaire
    const estProprietaire = socket.request.headers['est-proprietaire'] || process.env.DEV
    const idmgClient = socket.request.headers['idmg-compte'] || socket.request.headers['idmg'] || process.env.IDMG
    debug("Request headers socket WSS :\n%O", socket.request.headers)
    const rabbitMQ = this.fctRabbitMQParIdmg(idmgClient);

    return new Promise(async (resolve, reject)=>{
      const params = {
        idMillegrille: idmgClient
      }

      if(!estProprietaire) {
        debug("Usager n'est pas proprietaire")
        socket.emit('erreur.login', {'erreur': 'erreur pas proprietaire'});
        return reject(new Error("Usager n'est pas proprietaire de la millegrille sur socket " + socket.id))
      } else if(!rabbitMQ) {
        // La MilleGrille est inconnue
        debug("MilleGrille non initialisee")
        socket.emit('erreur.login', {'erreur': 'erreur init rabbitmq'});
        return reject(new Error("L'identificateur MilleGrille '" + idmgClient + "' n'est pas connu"))
      } else {
        debug("Connexion Socket.IO prete")
        socket.emit("pret", {login: true})
        return resolve(rabbitMQ)
      }
    })

  }

}

//const websocketapp = new WebSocketApp();


module.exports = {WebSocketApp};
