import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { RabbitMQ } from './RabbitMQ.js';

export const SenseursPassifs = new Mongo.Collection('mgdomaines_appareils_SenseursPassifs');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('noeuds', function noeudsPublication() {
    return SenseursPassifs.find({'_mg-libelle': 'noeud.individuel'});
  });
  Meteor.publish('senseurs', function senseursPublication() {
    return SenseursPassifs.find({'_mg-libelle': 'senseur.individuel'});
  });
}

Meteor.methods({
  'SenseursPassifs.location.update'(senseur, texte_location) {
    check(senseur._id, Mongo.ObjectID);
    check(texte_location, String);

    let tempsLecture = Math.trunc((new Date).getTime()/1000);

    let message = {};
    let infoTransaction = {};
    infoTransaction['source-systeme'] = 'coupdoeil@dev2.maple.mdugre.info';
    infoTransaction['uuid-transaction'] = "";
    infoTransaction['estampille'] = tempsLecture;
    infoTransaction['signature_contenu'] = "";
    infoTransaction['domaine'] = "mgdomaines.appareils.SenseursPassifs.manuel";

    let chargeUtile = {
      'filtre': {
        '_mg-libelle': 'senseur.individuel',
        'noeud': senseur.noeud,
        'senseur': senseur.senseur
      },
      'set': {
        'location': texte_location
      }
    };
    message['charge-utile'] = chargeUtile;
    message['info-transaction'] = infoTransaction;

    // Trigger pour propager le changement de nom via un workflow.
    routingKey = 'mg-sansnom.transaction.nouvelle';
    routingKey = 'test';
    RabbitMQ.transmettreTransaction(routingKey, message);
  },
});
