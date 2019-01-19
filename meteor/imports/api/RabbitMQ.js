import { Meteor } from 'meteor/meteor';
import { pki } from './pki.js'

class RabbitMQWrapper {
  constructor() {
    this.amqp = require('amqplib');
    this.params = null;
    this.connection = null;
    this.channel = null;

    this.reconnectTimeout = null; // Timer de reconnexion - null si inactif

    this.uuidv4 = require('uuid/v4');
    this.os = require('os');

    if(Meteor.isServer) {
      this.nomMilleGrille = this._trouverNomMilleGrille()
      this.setHostname();
    } else {
      this.nomMilleGrille = "NA";
      this.hostname = "NA";
    }
  }

  connect(connection) {
    this.params = connection;
    this._connect();
  }

  _connect() {
    var fs = require('fs');

    let mq_cacert = process.env.MG_MQ_CAFILE,
        mq_cert = process.env.MG_MQ_CERTFILE,
        mq_key = process.env.MG_MQ_KEYFILE;

    if(this.connection === null) {
      let options = {}
      if(mq_cacert !== undefined) {
        var cacert = fs.readFileSync(mq_cacert);
        options['ca'] = [cacert];
      }
      if(mq_cert !== undefined) {
        var cert = fs.readFileSync(mq_cert);
        options['cert'] = cert;
      }
      if(mq_key !== undefined) {
        var key = fs.readFileSync(mq_key);
        options['key'] = key;
      }

      var open = this.amqp.connect(this.params, options);
      open.then(function (conn) {
        RabbitMQ.setConnection(conn);
        RabbitMQ.ouvrirChannel();
      });

    }

    this.reconnectTimeout = null;
  }

  reconnect() {
    RabbitMQ.closeConnection();

    if(this.reconnectTimeout === null) {
      this.reconnectTimeout = setTimeout(function() {
          console.log("Reconnecting to RabbitMQ");
          RabbitMQ._connect();
        },
        5000
      );
    }
  }

  ouvrirChannel() {
    let openchannel = this.connection.createChannel();
    openchannel.then(function (ch) {
      RabbitMQ.setChannel(ch);
    });
  }

  setConnection(connection) {
    // console.log("Connexion RabbitMQ etablie");
    this.connection = connection;

    this.connection.on("error", function(err) {
      console.error("Erreur connexion MQ");
      console.error(err);
      RabbitMQ.reconnect();
    });

    this.connection.on("close", function() {
      console.error("RabbitMQ connection closed. Reconnecting.");
      RabbitMQ.reconnect();
    });
  }

  closeConnection() {
    let connection = this.connection;
    let channel = this.channel;
    this.connection = null;
    this.channel = null;

    try {
      channel.close();
    } catch (e) {
      console.warn("Erreur fermeture channel RabbitMQ");
    }

    try {
      connection.close();
    } catch (e) {
      console.warn("Erreur fermeture connexion RabbitMQ");
    }
  }

  setChannel(channel) {
    console.log("Channel RabbitMQ ouvert");
    this.channel = channel;
  }

  genererUUID() {
    return this.uuidv4();
  }

  getHostname() {
    return this.hostname;
  }

  setHostname() {
    const fqdn = require('node-fqdn');
    this.hostname = fqdn();
    console.log("FQDN: " + this.hostname);
  }

  // Methode qui permet de transmettre une transaction au backend RabbitMQ
  // Les metadonnees sont ajoutees automatiquement
  _transmettreTransaction(routingKey, message) {
    // console.log("Nouvelle transaction:");
    let jsonMessage = JSON.stringify(message);
    // console.log(jsonMessage);

    if (Meteor.isServer) {
      // Le code doit uniquement etre execute sur le serveur
      // console.log("Message: routing=" + routingKey + " message=" + jsonMessage);
      try {
        console.log("Message a transmettre: " + routingKey + " = " + jsonMessage);
        this.channel.publish(
          'millegrilles.evenements',
          routingKey,
           new Buffer(jsonMessage),
           {},
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
  }

  // Utiliser cette methode pour simplifier le formattage d'une transaction.
  // Il faut fournir le contenu de la transaction et le domaine (routing)
  transmettreTransactionFormattee(message, domaine) {
    let messageFormatte = message;  // Meme objet si ca cause pas de problemes

    if(Meteor.isServer) {
      let infoTransaction = this._formatterInfoTransaction(domaine);
      messageFormatte['en-tete'] = infoTransaction;
    }

    // Signer le message
    this._signerMessage(messageFormatte);

    let routingKey = 'transaction.nouvelle';
    this._transmettreTransaction(routingKey, messageFormatte);
  }

  log_error(e) {
    console.error(e);
  }

  _signerMessage(message) {
    // Produire le hachage du contenu avant de signer - le hash doit
    // etre inclus dans l'entete pour faire partie de la signature.
    let hachage = pki.hacherTransaction(message);
    message['en-tete']['hachage-contenu'] = hachage;

    // Signer la transaction. Ajoute l'information du certificat dans l'entete.
    let signature = pki.signerTransaction(message);
    message['_signature'] = signature;
  }

  _trouverNomMilleGrille() {
    let nomMilleGrille = 'sansnom';
    if(Meteor.isServer) {
      if(process.env.MG_NOM_MILLEGRILLE !== undefined) {
        nomMilleGrille = process.env.MG_NOM_MILLEGRILLE;
      } else {
        console.warn("Nom de la millegrille non defini, defaut sansnom");
      }
    }
    return nomMilleGrille;
  }

  _formatterInfoTransaction(domaine) {
    // Ces valeurs n'ont de sens que sur le serveur.
    // Calculer secondes UTC (getTime retourne millisecondes locales)
    let dateUTC = (new Date().getTime()/1000) + new Date().getTimezoneOffset()*60;
    let tempsLecture = Math.trunc(dateUTC);
    let infoTransaction = {
      'domaine': domaine,
      'source-systeme': 'coupdoeil@' + RabbitMQ.getHostname(),
      'uuid-transaction': RabbitMQ.genererUUID(),
      'estampille': tempsLecture,
      'certificat': pki.getFingerprint(),
      'hachage-contenu': '',  // Doit etre calcule a partir du contenu
      'version': 4
    };

    return infoTransaction;
  }
}

// Creer une instance de RabbitMQ
export const RabbitMQ = new RabbitMQWrapper();
import { Mongo } from 'meteor/mongo';

if (Meteor.isServer) {
  // Connecter RabbitMQ sur le serveur uniquement
  let mq_host = process.env.MG_MQ_HOST,
      mq_port = process.env.MG_MQ_PORT,
      mq_user = process.env.MG_MQ_USER,
      mq_password = process.env.MG_MQ_PASSWORD,
      mq_protocol = process.env.MG_MQ_PROTOCOL;

  if(mq_protocol === undefined) {
    mq_protocol = 'amqps';
  }

  let mqConnectionUrl =
    mq_protocol + '://' +
    mq_user + ':' + mq_password + '@' +
    mq_host + ':' + mq_port +
    '/' + RabbitMQ.nomMilleGrille;

  console.log("URL Connexion " + mqConnectionUrl)

  RabbitMQ.connect(mqConnectionUrl);
}
