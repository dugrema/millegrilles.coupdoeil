import { Meteor } from 'meteor/meteor';

class RabbitMQWrapper {
  constructor() {
    this.amqp = require('amqplib');
    this.connection = null;
    this.channel = null;
    this.exchange = null;

    this.uuidv4 = require('uuid/v4');
    this.os = require('os');
    this.dns = require('dns');
  }

  connect(connection) {
    var fs = require('fs');
    var sscert = fs.readFileSync('/home/mathieu/git/MilleGrilles.coupdoeil/cert/dev2.cer');

    if(this.connection === null) {
      var open = this.amqp.connect(connection, {ca: [sscert]});
      open.then(function (conn) {
        RabbitMQ.setConnection(conn);
        RabbitMQ.ouvrirChannel();
      });
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
  }

  setChannel(channel) {
    // console.log("Channel ouvert");
    this.channel = channel;
  }

  genererUUID() {
    return this.uuidv4();
  }

  getHostname() {
    let hostname = this.os.hostname();
    return hostname;
  }

  transmettreTransaction(routingKey, message) {
    // console.log("Nouvelle transaction:");
    let jsonMessage = JSON.stringify(message);
    // console.log(jsonMessage);

    if (Meteor.isServer) {
      // Le code doit uniquement etre execute sur le serveur
      this.channel.publish(
        'millegrilles.evenements',
        routingKey,
         new Buffer(jsonMessage)
      );
    }
  }

  log_error(e) {
    console.error(e);
  }
}

// Creer une instance de RabbitMQ
export const RabbitMQ = new RabbitMQWrapper();

if (Meteor.isServer) {
  // Connecter RabbitMQ sur le serveur uniquement
  let mq_host = process.env.MG_MQ_HOST,
      mq_port = process.env.MG_MQ_PORT,
      mq_user = process.env.MG_MQ_USER,
      mq_password = process.env.MG_MQ_PASSWORD;
  RabbitMQ.connect(
    'amqps://'+mq_user+':'+mq_password+'@'+mq_host+':'+mq_port
  );
}
