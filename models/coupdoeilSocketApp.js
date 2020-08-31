var fs = require('fs');
const debug = require('debug')('millegrilles:coupdoeil:coupdoeilSocketApp')

class WebSocketApp {

  constructor(fctRabbitMQParIdmg) {
    this.fctRabbitMQParIdmg = fctRabbitMQParIdmg
  }

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

      socket.on('disconnect', ()=>{
        this.disconnectedHandler(socket);
      });

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
        debug("Enregistrer evenements sur idmg: %s", idmg);
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

  // Enregistre tous les evenements transmis par le front-end coupdoeil.
  registerEvents(rabbitMQ, socket) {
    debug("Register events")

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

    let params = {nowait}
    if(enveloppe.exchange) params.exchange = enveloppe.exchange

    rabbitMQ.transmettreCommande(routingKey, commande, params)
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

module.exports = {WebSocketApp};
