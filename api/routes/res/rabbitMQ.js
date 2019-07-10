var amqplib = require('amqplib');
var os = require('os');
var fs = require('fs');
uuidv4 = require('uuid/v4');

class RabbitMQWrapper {

  constructor() {
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
  }

  connect(url) {
    this.url = url;
    this._connect();
  }

  _connect() {

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
      options['credentials'] = amqplib.credentials.external();

      amqplib.connect(this.url, options)
        .then( conn => {
          console.debug("Connexion a RabbitMQ reussie");
          this.connection = conn;

          conn.createChannel()
            .then( (ch) => {
              this.channel = ch;
              console.log("Channel ouvert");
              this.ecouter();
            })
            .catch(err => {
              console.error("Erreur ouverture channel");
              console.error(err);
            })

        })
        .catch(err => {
          this.connection = null;
          console.error("Erreur connexion RabbitMQ");
          console.error(err);
        })
        .then( () => {
          console.log("Connexion et channel prets!");
        });

    }

  }

  ecouter() {

    // Creer Q pour ecouter
    this.channel.assertQueue('', {
      durable: false,
      exclusive: true,
    })
    .then( (q) => {
      console.log("Queue cree"),
      console.log(q);
      this.reply_q = q;

      this.channel.bindQueue(q.queue, 'millegrilles.noeuds', 'test.routing');

      this.channel.consume(
        q.queue,
        (msg) => {
          let correlationId = msg.properties.correlationId;
          let messageContent = decodeURIComponent(escape(msg.content));
          let routingKey = msg.fields.routingKey;
          // console.log("Message: ");
          // console.log(msg);
          console.log("Routing key: " + routingKey);
          console.log("Message: " + messageContent);
          console.log("CorrelationId: " + correlationId);

          let callback = this.pendingResponses[correlationId];
          if(callback) {
            callback(msg);
          }
        },
        {noAck: true}
      );

    })
    .catch( err => {
      console.error("Erreur creation Q pour ecouter");
      console.error(err);
    })

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

  transmettreRequete(routingKey, message) {

    let correlation = uuidv4();
    message['correlation'] = correlation;
    let jsonMessage = JSON.stringify(message);
    // console.log("Message a transmettre: " + routingKey + " = " + jsonMessage);

    // Setup variables pour timeout, callback
    let timeout, fonction_callback;

    let promise = new Promise((resolve, reject) => {

      var processed = false;
      const pendingResponses = this.pendingResponses;
      fonction_callback = function(msg, err) {
        // Cleanup du callback
        delete pendingResponses[correlation];
        clearTimeout(timeout);

        if(msg && !err) {
          resolve(msg);
        } else {
          reject(err);
        }
      };

      // Exporter la fonction de callback dans l'objet RabbitMQ.
      // Permet de faire la correlation lorsqu'on recoit la reponse.
      pendingResponses[correlation] = fonction_callback;

      // Faire la publication
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
          delete this.pendingResponses[correlation];
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
  }

}

const rabbitMQ_singleton = new RabbitMQWrapper();

module.exports = {
  'RabbitMQWrapper': RabbitMQWrapper,
  'singleton': rabbitMQ_singleton
};
