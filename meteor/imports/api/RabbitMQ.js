import { Meteor } from 'meteor/meteor';

class RabbitMQWrapper {
  constructor() {
    this.amqp = require('amqplib');
    this.connection = null;
    this.channel = null;
    this.exchange = null;
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
    console.log("Connexion RabbitMQ etablie");
    this.connection = connection;
  }

  setChannel(channel) {
    console.log("Channel ouvert");
    this.channel = channel;
  }

  transmettreTransaction(routingKey, message) {
    console.log("Nouvelle transaction:");
    let jsonMessage = JSON.stringify(message);
    console.log(jsonMessage);

    this.channel.publish(
      'millegrilles.evenements',
      routingKey,
       new Buffer(jsonMessage)
    );
  }

  log_error(e) {
    console.error(e);
  }
}

export const RabbitMQ = new RabbitMQWrapper();

if (Meteor.isServer) {
  RabbitMQ.connect(
    'amqps://coupdoeil:gLOUj3xLAj82@dev2.maple.mdugre.info:5671'
  );
}
