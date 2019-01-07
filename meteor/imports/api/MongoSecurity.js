// Ce module permet de charger des certificats avec Mongo.setConnectionsOptions()
// Caveat / bug connu: https://github.com/meteor/meteor/issues/7455
import { Mongo } from 'meteor/mongo';

if (Meteor.isServer) {
  var fs = require('fs');
  let mongo_CA = process.env.MG_MONGO_CAFILE,
      mongo_CERT = process.env.MG_MONGO_CERTFILE,
      mongo_KEY = process.env.MG_MONGO_KEYFILE;

  options = {}
  if( mongo_CA !== undefined ) {
    options['sslValidate'] = true;
    options['sslCA'] = fs.readFileSync(mongo_CA);
  }

  if( mongo_CERT !== undefined && mongo_KEY !== undefined ) {
    console.log("Loading mongo ssl certs");
    options['sslCert'] = fs.readFileSync(mongo_CERT);
    options['sslKey'] = fs.readFileSync(mongo_KEY);
  } else if ( mongo_CERT !== mongo_KEY ) {
    console.error("Il faut fournir a la fois MG_MONGO_KEYFILE et MG_MONGO_CERTFILE");
  }

  Mongo.setConnectionOptions(options);
}
