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
        RabbitMQ.ouvrir_exchange()
      });
    }
  }

  setConnection(connection) {
    console.log("Connexion RabbitMQ etablie");
    this.connection = connection;
  }

  ouvrir_exchange() {
    this.channel = this.connection.createChannel();
  }

  transmettre_transaction(message) {
    console.log("Nouvelle transaction:");
    console.log(message);
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
