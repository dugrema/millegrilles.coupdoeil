var Amqplib = require('amqplib');

class RabbitMQWrapper {

  constructor() {
    this.params = null;
    this.connection = null;
    this.channel = null;

    this.reconnectTimeout = null; // Timer de reconnexion - null si inactif

    // this.uuidv4 = require('uuid/v4');
    // this.os = require('os');

    // this.nomMilleGrille = this._trouverNomMilleGrille()
    // this.setHostname();
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

      var open = this.amqp.connect(this.params, options);
      // open.then(function (conn) {
      //   RabbitMQ.setConnection(conn);
      //   RabbitMQ.ouvrirChannel();
      // });

    }

  }

}

var rabbitMQ = RabbitMQWrapper;

module.exports = rabbitMQ;
