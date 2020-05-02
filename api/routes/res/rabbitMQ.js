const amqplib = require('amqplib');
const os = require('os');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const forge = require('node-forge');

// const pki = require('./pki.js');


const routingKeyNouvelleTransaction = 'transaction.nouvelle';

class RabbitMQWrapper {

  constructor(pki) {
    this.pki = pki;

    this.url = null;
    this.connection = null;
    this.channel = null;
    this.reply_q = null;

    this.reconnectTimeout = null; // Timer de reconnexion - null si inactif

    // Correlation avec les reponses en attente.
    // Cle: uuid de CorrelationId
    // Valeur: callback
    this.pendingResponses = {};

    // this.nomMilleGrille = this._trouverNomMilleGrille()
    // this.setHostname();

    this.routingKeyManager = new RoutingKeyManager(this);
    this.routingKeyCertificat = null;

    this.certificatMaitreDesCles = null;
  }

  connect(url) {
    this.url = url + "/" + this.pki.idmg;
    return this._connect();
  }

  _connect() {

    // let mq_cacert = process.env.MG_MQ_CAFILE,
    //     mq_cert = process.env.MG_MQ_CERTFILE,
    //     mq_key = process.env.MG_MQ_KEYFILE;

    if(this.connection === null) {
      let options = {
        ca: this.pki.hoteCA,
        cert: this.pki.hotePEM,
        key: this.pki.cle,
      }
      // if(mq_cacert !== undefined) {
      //   var cacert = fs.readFileSync(mq_cacert);
      //   options['ca'] = [cacert];
      // }
      // if(mq_cert !== undefined) {
      //   var cert = fs.readFileSync(mq_cert);
      //   options['cert'] = cert;
      // }
      // if(mq_key !== undefined) {
      //   var key = fs.readFileSync(mq_key);
      //   options['key'] = key;
      // }
      options['credentials'] = amqplib.credentials.external();

      console.info("Connecter a RabbitMQ : %s", this.url);
      return amqplib.connect(this.url, options)
      .then( conn => {
        console.debug("Connexion a RabbitMQ reussie");
        this.connection = conn;

        conn.on('close', (reason)=>{
          console.warn("Fermeture connexion RabbitMQ");
          console.info(reason);
          this.scheduleReconnect();
        });

        return conn.createChannel();
      }).then( (ch) => {
        this.channel = ch;
        console.debug("Channel ouvert");
        return this.ecouter();
      }).then(()=>{
        console.debug("Connexion et channel prets");

        // Transmettre le certificat
        let fingerprint = this.transmettreCertificat();

        // Enregistrer routing key du certificat
        // Permet de repondre si un autre composant demande notre certificat
        this.routingKeyCertificat = 'pki.requete.' + fingerprint;
        console.debug("Enregistrer routing key: " + fingerprint)
        this.channel.bindQueue(this.reply_q.queue, 'millegrilles.noeuds', this.routingKeyCertificat);
        this.channel.bindQueue(this.reply_q.queue, 'millegrilles.noeuds', 'pki.certificat.#');

        // console.debug("Certificat transmis");
      }).catch(err => {
        this.connection = null;
        console.error("Erreur connexion RabbitMQ");
        console.error(err);
        this.scheduleReconnect();
      });

    }

  }

  scheduleReconnect() {
    // Met un timer pour se reconnecter
    const dureeAttente = 30;

    if(!this.reconnectTimeout) {
      var mq = this;
      this.reconnectTimeout = setTimeout(()=>{
        console.debug("Reconnexion en cours");
        mq.reconnectTimeout = null;
        mq._connect();
      }, dureeAttente*1000);

      console.info("Reconnexion a MQ dans " + dureeAttente + " secondes");

      var conn = this.connection, channel = this.channel;
      this.connection = null;
      this.channel = null;

      if(channel) {
        try {
          channel.close();
        } catch (err) {
          console.debug("Erreur fermeture channel");
          console.debug(err);
        }
      }

      if(this.connection) {
        try {
          conn.close();
        } catch (err) {
          console.info("Erreur fermeture connection");
          console.info(err);
        }
      }
    }
  }

  ecouter() {

    let promise = new Promise((resolve, reject) => {

      // Creer Q pour ecouter
      this.channel.assertQueue('', {
        durable: false,
        exclusive: true,
      })
      .then( (q) => {
        console.debug("Queue reponse globale cree"),
        // console.log(q);
        this.reply_q = q;

        this.channel.consume(
          q.queue,
          msg => {this.traiterMessage(msg)},
          {noAck: true}
        );

        resolve();
      })
      .catch( err => {
        console.error("Erreur creation Q pour ecouter");
        reject(err);
      })
    });

    return promise;

  }

  traiterMessage(msg) {
    // console.debug('1. Message recu');
    // console.debug(msg);
    let correlationId = msg.properties.correlationId;
    let replyQ = msg.properties.reply_q;
    let messageContent = msg.content.toString('utf-8');
    let routingKey = msg.fields.routingKey;
    let json_message = JSON.parse(messageContent);
    // console.debug("Traiter message, routing: {0}", routingKey);
    // console.debug(json_message);

    if(routingKey && routingKey.startsWith('pki.certificat.')) {
      // Sauvegarder le certificat localement pour usage futur
      this.pki.sauvegarderMessageCertificat(messageContent, json_message.fingerprint);
      return; // Ce message ne correspond pas au format standard
    } else if(routingKey && routingKey.startsWith('pki.requete.')) {
      // Transmettre le certificat
      let messageCertificat = this.pki.preparerMessageCertificat();
      let messageJSONStr = JSON.stringify(messageCertificat);
      // console.debug("Repondre demande certificat ")
      // console.debug(msg.properties);
      // console.debug(messageJSONStr);
      // this._repondre(messageJSONStr, replyQ, correlationId)
      this.transmettreCertificat()
      return; // Ce message ne correspond pas au format standard
    }

    // Valider le contenu du message - hachage et signature
    let hashTransactionCalcule = this.pki.hacherTransaction(json_message);
    let hashTransactionRecu = json_message['en-tete']['hachage-contenu'];
    if(hashTransactionCalcule !== hashTransactionRecu) {
      console.warn("Erreur hachage incorrect : " + hashTransactionCalcule + ", message dropped");
      return;
    }

    if(correlationId) {
      // Relayer le message
      let callback = this.pendingResponses[correlationId];
      if(callback) {
        // Verifier la signature du message
        this.pki.verifierSignatureMessage(json_message)
        .then(signatureValide=>{
          if(signatureValide) {
            // console.debug("Signature valide");
            callback(msg);
          } else {
            console.warn("Signature invalide, message dropped");
          }
        })
        .catch(err=>{
          if(err.inconnu) {
            // Message inconnu, on va verifier si c'est une reponse de
            // certificat.
            if(json_message.resultats && json_message.resultats.certificat_pem) {
              // On laisse le message passer, c'est un certificat
              // console.debug("Certificat recu");
              callback(msg);
            } else {
              // On tente de charger le certificat
              let fingerprint = json_message['en-tete'].certificat;
              console.warn("Certificat inconnu, on fait une demande : " + fingerprint);
              this.demanderCertificat(fingerprint)
              .then(reponse=>{

                // console.debug("Reponse demande certificat");
                // console.debug(reponse);

                // Sauvegarder le certificat et tenter de valider le message en attente
                this.pki.sauvegarderMessageCertificat(JSON.stringify(reponse.resultats))
                .then(()=>this.pki.verifierSignatureMessage(json_message))
                .then(signatureValide=>{
                  if(signatureValide) {
                    callback(msg);
                  } else {
                    console.warn("Signature invalide, message dropped");
                  }
                })
                .catch(err=>{
                  console.warn("Message non valide apres reception du certificat, message dropped");
                });

              })
              .catch(err=>{
                console.warn("Certificat non charge, message dropped");
                console.debug(err);
              })
            }

          } else {
            console.error("Erreur verification signature message, message dropped");
            console.error(err);
          }

        });

      }
    } else if(routingKey) {
      if(routingKey === this.routingKeyCertificat) {
        this.transmettreCertificat();
      } else {
        console.error("Message avec routing key recu sur Q API global: " + routingKey + ". Message rejete");
      }
    } else {
      console.debug("Recu message sans correlation Id ou routing key");
      console.warn(msg);
    }
  }

  transmettreCertificat() {
    let messageCertificat = this.pki.preparerMessageCertificat();
    let fingerprint = messageCertificat.fingerprint;
    let messageJSONStr = JSON.stringify(messageCertificat);
    this._publish(
      'pki.certificat.' + fingerprint, messageJSONStr
    );

    return fingerprint;
  }

  repondreCertificat(reply_q, correlationId) {

  }

  createChannel(socketResources) {
      return this.connection.createChannel()
      .then(channel=>{
        socketResources.mqChannel = channel;
        return channel.assertQueue('', {
          durable: false,
          exclusive: true,
        })
      })
      .then(q=>{
        // console.log("Queue reponse usager via websocket cree"),
        // console.log(q);
        socketResources.reply_q = q;

        // Activer la lecture de message et callback pour notre websocket
        socketResources.mqChannel.consume(
          q.queue,
          (msg) => {
            // console.log('2. Message recu');
            // console.log(msg.content.toString('utf-8'));
            let messageContent = msg.content.toString('utf-8');
            let json_message = JSON.parse(messageContent);
            let routingKey = msg.fields.routingKey;

            let socket = socketResources.socket;
            socket.emit('mq_message', {routingKey: routingKey, message: json_message});
          },
          {noAck: true}
        );
      });
  }

  // Utiliser cette methode pour simplifier le formattage d'une transaction.
  // Il faut fournir le contenu de la transaction et le domaine (routing)
  transmettreTransactionFormattee(message, domaine, opts) {
    // Fare un shallow copy du message
    let messageFormatte = {};
    Object.assign(messageFormatte, message);

    const infoTransaction = this._formatterInfoTransaction(domaine, opts);
    const correlation = infoTransaction['uuid-transaction'];
    messageFormatte['en-tete'] = infoTransaction;

    // Crypter le contenu au besoin
    let promise;
    if(messageFormatte['a_crypter']) {
      // Enlever element a_cypter de la transaction principale
      let contenuACrypter = messageFormatte['a_crypter'];
      delete messageFormatte['a_crypter'];
      let idDocumentCrypte = opts.idDocumentCrypte;
      promise = this._transmettreMessageCle(contenuACrypter, correlation, idDocumentCrypte)
      .then(contenuCrypte=>{
        messageFormatte['crypte'] = contenuCrypte;
        return messageFormatte;
      })
    } else {
      promise = new Promise((resolve, reject)=>{resolve(messageFormatte)});
    }

    // Utiliser la promise pour recuperer le contenu du message
    // Si le message contient un element 'a_crypter', il sera remplace
    // par crypte='... contenu base64 ...'.
    return promise.then(messageATransmettre=>{
      // Signer le message avec le certificat
      this._signerMessage(messageATransmettre);
      const jsonMessage = JSON.stringify(messageATransmettre);

      // Transmettre la nouvelle transaction. La promise permet de traiter
      // le message de reponse.
      return this._transmettre(routingKeyNouvelleTransaction, jsonMessage, correlation);
    })

  }

  _transmettreMessageCle(contenuACrypter, correlation, idDocumentCrypte) {
    let promise = this.demanderCertificatMaitreDesCles()
    .then(certificat=>this.pki.crypterContenu(certificat, contenuACrypter))
    .then(({contenuCrypte, encryptedSecretKey, iv})=>{
      // Transmettre transaction pour la cle
      // Le ma
      const routingKeyCle = 'millegrilles.domaines.MaitreDesCles.nouvelleCle.document';
      let infoTransactionCle = this._formatterInfoTransaction(routingKeyCle, {version: 5});
      let transactionCle = {
        'en-tete': infoTransactionCle,
        fingerprint: 'abcd',
        cle: encryptedSecretKey,
        iv: iv,
        domaine: idDocumentCrypte.domaine,
        'uuid-transaction': correlation,
      };

      // Copier les cles du document dans la transaction
      // domaine: transmis dans idDocumentCrypte, e.g. "millegrilles.domaines.Parametres",
      // uuid-transaction: param correlation
      // identificateurs_document: {
      //     "_mg-libelle": ConstantesParametres.LIBVAL_EMAIL_SMTP
      // },
      let id_document = {};
      for(let key in idDocumentCrypte) {
        let value = idDocumentCrypte[key];
        if(key !== 'domaine') {  // Domaine copie en dehors de l'identificateur, V5 transaction
          id_document[key] = value;
        }
      }
      transactionCle['identificateurs_document'] = id_document

      // Signer le message avec le certificat
      this._signerMessage(transactionCle);
      const jsonMessageCle = JSON.stringify(transactionCle);

      // Transmettre la nouvelle transaction. La promise permet de traiter
      // le message de reponse.
      let correlationCle = infoTransactionCle['uuid-transaction'];

      return this._transmettre(routingKeyNouvelleTransaction, jsonMessageCle, correlationCle)
      .then(()=>{
        return contenuCrypte;
      });
    });

    return promise;
  }

  _formatterInfoTransaction(domaine, opts) {
    // Ces valeurs n'ont de sens que sur le serveur.
    // Calculer secondes UTC (getTime retourne millisecondes locales)
    // console.debug("Formatter info transaction opts");
    // console.debug(opts);
    let version = 6;
    var uuidTransaction;
    if(opts) {
      version = opts.version || version;
      uuidTransaction = opts.uuidTransaction || uuidv4();
    } else {
      uuidTransaction = uuidv4();
    }

    let dateUTC = (new Date().getTime()/1000) + new Date().getTimezoneOffset()*60;
    let tempsLecture = Math.trunc(dateUTC);
    let sourceSystem = 'coupdoeil/' + 'dev2.maple.mdugre.info' + "@" + this.pki.getCommonName();
    let infoTransaction = {
      'domaine': domaine,
      // 'source-systeme': sourceSystem,
      'idmg': this.idmg,
      'uuid-transaction': uuidTransaction,
      'estampille': tempsLecture,
      'certificat': this.pki.getFingerprint(),
      'hachage-contenu': '',  // Doit etre calcule a partir du contenu
      'version': version
    };

    return infoTransaction;
  }

  _signerMessage(message) {
    // Produire le hachage du contenu avant de signer - le hash doit
    // etre inclus dans l'entete pour faire partie de la signature.
    let hachage = this.pki.hacherTransaction(message);
    message['en-tete']['hachage-contenu'] = hachage;

    // Signer la transaction. Ajoute l'information du certificat dans l'entete.
    let signature = this.pki.signerTransaction(message);
    message['_signature'] = signature;
  }

  // Methode qui permet de transmettre une transaction au backend RabbitMQ
  // Les metadonnees sont ajoutees automatiquement
  _transmettreTransaction(routingKey, message) {
    let jsonMessage = JSON.stringify(message);

    // Le code doit uniquement etre execute sur le serveur
    // console.log("Message: routing=" + routingKey + " message=" + jsonMessage);
    try {
      // console.log("Message a transmettre: " + routingKey + " = " + jsonMessage);
      this.channel.publish(
        'millegrilles.noeuds',
        routingKey,
         new Buffer(jsonMessage),
         {
           correlationId: message['correlation'],
           replyTo: this.reply_q.queue,
         },
         function(err, ok) {
           console.error("Erreur MQ Callback");
           console.error(err);
         }
      );
    }
    catch (e) {
      console.error("Erreur MQ");
      console.error(e);
      this.reconnect(); // Tenter de se reconnecter
    }
  }

  transmettreRequete(routingKey, message) {

    const infoTransaction = this._formatterInfoTransaction(routingKey);

    message['en-tete'] = infoTransaction;
    this._signerMessage(message);

    const correlation = infoTransaction['uuid-transaction'];
    const jsonMessage = JSON.stringify(message);

    // Transmettre requete - la promise permet de traiter la reponse
    const promise = this._transmettre(routingKey, jsonMessage, correlation);
    return promise;
  }

  transmettreCommande(routingKey, message, opts) {
    if(!opts) opts = {};

    const infoTransaction = this._formatterInfoTransaction(routingKey);

    message['en-tete'] = infoTransaction;
    this._signerMessage(message);

    var correlation = null;
    if(!opts.nowait) {
      correlation = infoTransaction['uuid-transaction'];
    }

    const jsonMessage = JSON.stringify(message);

    // Transmettre requete - la promise permet de traiter la reponse
    const promise = this._transmettre(routingKey, jsonMessage, correlation);
    return promise;
  }

  _transmettre(routingKey, jsonMessage, correlationId) {
    // Setup variables pour timeout, callback
    let timeout, fonction_callback;

    let promise = new Promise((resolve, reject) => {

      var processed = false;
      const pendingResponses = this.pendingResponses;
      fonction_callback = function(msg, err) {
        // Cleanup du callback
        delete pendingResponses[correlationId];
        clearTimeout(timeout);

        if(msg && !err) {
          resolve(msg);
        } else {
          reject(err);
        }
      };

      let properties = {
        replyTo: this.reply_q.queue
      }
      if(correlationId) {
        // Exporter la fonction de callback dans l'objet RabbitMQ.
        // Permet de faire la correlation lorsqu'on recoit la reponse.
        pendingResponses[correlationId] = fonction_callback;
        properties.correlationId = correlationId;
      } else {
        resolve();
      }

      // Faire la publication
      this.channel.publish(
        'millegrilles.noeuds',
        routingKey,
        Buffer.from(jsonMessage),
        properties,
        function(err, ok) {
          console.error("_transmettre: Erreur MQ Callback");
          console.error(err);
          delete pendingResponses[correlationId];
          reject(err);
        }
      );

    });

    // Lancer un timer pour permettre d'eviter qu'une requete ne soit
    // jamais nettoyee ou repondue.
    timeout = setTimeout(
      () => {fonction_callback(null, {'err': 'mq.timeout'})},
      15000
    );

    return promise;
  };

  _publish(routingKey, jsonMessage, channel) {
    if(!channel) {
      channel = this.channel; // Channel global par defaut
    }

    // Faire la publication
    this.channel.publish(
      'millegrilles.noeuds',
      routingKey,
      Buffer.from(jsonMessage),
      (err, ok) => {
        console.error("_publish: Erreur MQ Callback");
        console.error(err);
        if(correlationId) {
          delete pendingResponses[correlationId];
        }
      }
    );
  }

  _repondre(jsonMessage, replyQ, correlationId) {
    if(!channel) {
      channel = this.channel; // Channel global par defaut
    }

    let properties = {
      correlationId
    }

    // Faire la publication
    this.channel.publish(
      '', // Echange par defaut
      replyQ,
      Buffer.from(jsonMessage),
      properties,
      (err, ok) => {
        console.error("_repondre: Erreur MQ Callback");
        console.error(err);
      }
    );
  }

  // Retourne un document en fonction d'un domaine
  get_document(domaine, filtre) {
    // Verifier que la MilleGrille n'a pas deja d'empreinte usager
    let requete = {
      "requetes": [
        {
          "filtre": filtre
        }
      ]
    }
    let promise = this.transmettreRequete(
      'requete.' + domaine,
      requete
    )
    .then((msg) => {
      let messageContent = decodeURIComponent(escape(msg.content));
      let json_message = JSON.parse(messageContent);
      // console.log("JSON Message!\n\n\n");
      // console.log(json_message);
      let document_recu = json_message['resultats'][0][0];
      // console.log("Resultats!\n\n\n");
      // console.log(document_recu);
      return(document_recu);
    })

    return promise;
  }

  demanderCertificatMaitreDesCles() {
    if(this.certificatMaitreDesCles) {
      return new Promise((resolve, reject) => {
        resolve(this.certificatMaitreDesCles);
      });
    } else {
      let objet_crypto = this;
      // console.debug("Demander certificat MaitreDesCles");
      var requete = {}
      var routingKey = 'requete.millegrilles.domaines.MaitreDesCles.certMaitreDesCles';
      return this.transmettreRequete(routingKey, requete)
      .then(reponse=>{
        let messageContent = decodeURIComponent(escape(reponse.content));
        let json_message = JSON.parse(messageContent);
        // console.debug("Reponse cert maitre des cles");
        // console.debug(messageContent);
        objet_crypto.certificatMaitreDesCles = forge.pki.certificateFromPem(json_message.certificat);
        return objet_crypto.certificatMaitreDesCles;
      })
    }
  }

  demanderCertificat(fingerprint) {
    var requete = {fingerprint}
    var routingKey = 'requete.millegrilles.domaines.Pki.certificat';
    return this.transmettreRequete(routingKey, requete)
    .then(reponse=>{
      if(reponse.content) {
        let messageContent = decodeURIComponent(escape(reponse.content));
        let json_message = JSON.parse(messageContent);
        return json_message;
      } else {
        return reponse;
      }
    })
  }

}

class RoutingKeyManager {

  constructor(mq) {

    // Lien vers RabbitMQ, donne acces au channel, Q et routing keys
    this.mq = mq;
    this.websocketsManager = null;

    // Dictionnaire de routing keys
    //   cle: string (routing key sur RabbitMQ)
    //   valeur: dict de socket ids / socket
    // this.registeredRoutingKeysForSockets = {};
  }

  setWebSocketsManager(manager) {
    this.websocketsManager = manager;
    // console.log("WebSocketsManager");
    // console.log(this.websocketsManager);
  }

  addRoutingKeysForSocket(socket, routingKeys, channel, reply_q) {
    const socketId = socket.id;
    // console.debug("Ajouter routingKeys au socket " + socketId);
    // console.debug(routingKeys);

    for(var routingKey_idx in routingKeys) {
      let routingKeyName = routingKeys[routingKey_idx];
      // Ajouter la routing key
      channel.bindQueue(reply_q.queue, 'millegrilles.noeuds', routingKeyName);

      // var socket_dict = this.registeredRoutingKeysForSockets[routingKeyName];
      // if(!socket_dict) {
      //   socket_dict = {};
      //   this.registeredRoutingKeysForSockets[routingKeyName] = socket_dict;
      // }
      // socket_dict[socketId] = {'registered': (new Date()).getTime()};
    }
  }

  removeRoutingKeysForSocket(socket, routingKeys, channel, reply_q) {
    // console.debug("Enlever routingKeys du socket " + socket.id);
    // console.debug(routingKeys);

    for(var routingKey_idx in routingKeys) {
      let routingKeyName = routingKeys[routingKey_idx];
      // Retirer la routing key
      channel.unbindQueue(reply_q.queue, 'millegrilles.noeuds', routingKeyName);
    }
  }

  // emitMessage(routingKey, message) {
  //   // Transmet un message aux subscribers appropries
  //   var dictSockets = this.registeredRoutingKeysForSockets[routingKey];
  //   if(dictSockets) {
  //     // let messageContent = decodeURIComponent(escape(message.content));
  //     let json_message = JSON.parse(message);
  //
  //     let cleanupSockets = [];
  //     for(var socketId in dictSockets) {
  //       let socket = this.websocketsManager.authenticated_sockets[socketId];
  //       if(socket) {
  //         // console.debug("Transmission message " + routingKey + " vers " + socket.id);
  //         socket.emit('mq_message', {routingKey: routingKey, message: json_message});
  //       } else {
  //         console.warn("Message not sent to socket " + socketId + ", socket gone.");
  //         cleanupSockets.push(socketId);
  //       }
  //     }
  //
  //     for(var socketId in cleanupSockets) {
  //       delete dictSockets[cleanupSockets[socketId]];
  //     }
  //   }
  // }

  clean() {
    // Verifier chaque routing key pour voir s'il reste au moins un
    // socket actif.

    // Enlever la routing key qui n'est plus utile.

  }

}

// const rabbitMQ_singleton = new RabbitMQWrapper();

function decoderMessage(message) {
  let messageContent = message.content.toString('utf-8');
  let jsonMessage = JSON.parse(messageContent);
  return jsonMessage;
}

module.exports = {RabbitMQWrapper, decoderMessage};
