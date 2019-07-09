var Amqplib = require('amqplib');

class RabbitMQWrapper {

  constructor() {
    this.url = null;
    this.connection = null;
    this.channel = null;

    this.reconnectTimeout = null; // Timer de reconnexion - null si inactif

    // this.uuidv4 = require('uuid/v4');
    // this.os = require('os');

    // this.nomMilleGrille = this._trouverNomMilleGrille()
    // this.setHostname();
  }

  connect(url) {
    this.url = url;
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

      Amqplib.connect(this.url, options)
        .then( conn => {
          console.debug("Connexion a RabbitMQ reussie");
          this.connection = conn;
          this.ouvrirChannel();
        })
        .catch(err => {
          this.connection = null;
          console.error("Erreur connexion RabbitMQ");
          console.error(err);
        });

    }

  }

  ouvrirChannel() {
    this.connection.createChannel()
      .then( (ch) => {
        this.channel = ch;
        console.log("Channel ouvert");
        console.log(ch);

        this.ecouter();
      })
      .catch( (err) => {
        this.channel = null;
        console.log("Erreur ouverture channel!");
        console.error(err);
      })
  }

  ecouter() {
    this.channel.consume(
      'erreurs_processus',
      (msg) => {
        console.log("Message: ");
        console.log(msg);

        console.log("Routing key: " + msg.fields.routingKey);
        console.log("Message: " + decodeURIComponent(escape(msg.content)));
      },
      {noAck: true}
    );
  }

  // Utiliser cette methode pour simplifier le formattage d'une transaction.
  // Il faut fournir le contenu de la transaction et le domaine (routing)
  transmettreTransactionFormattee(message, domaine) {
    let messageFormatte = message;  // Meme objet si ca cause pas de problemes

    //let infoTransaction = this._formatterInfoTransaction(domaine);
    let infoTransaction = {'entete': 'information inutile!'};
    messageFormatte['en-tete'] = infoTransaction;

    // Signer le message
    // this._signerMessage(messageFormatte);

    let routingKey = 'transaction.nouvelle';
    this._transmettreTransaction(routingKey, messageFormatte);
  }

  // Methode qui permet de transmettre une transaction au backend RabbitMQ
  // Les metadonnees sont ajoutees automatiquement
  _transmettreTransaction(routingKey, message) {
    let jsonMessage = JSON.stringify(message);

    // Le code doit uniquement etre execute sur le serveur
    console.log("Message: routing=" + routingKey + " message=" + jsonMessage);
    try {
      console.log("Message a transmettre: " + routingKey + " = " + jsonMessage);
      this.channel.publish(
        'millegrilles.noeuds',
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

const rabbitMQ_singleton = new RabbitMQWrapper();

module.exports = {
  'RabbitMQWrapper': RabbitMQWrapper,
  'singleton': rabbitMQ_singleton
};
