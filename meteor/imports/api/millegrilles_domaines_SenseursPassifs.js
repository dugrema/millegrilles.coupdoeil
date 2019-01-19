import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { RabbitMQ } from './RabbitMQ.js';

export const SenseursPassifs = new Mongo.Collection('millegrilles.domaines.SenseursPassifs');

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
    check(senseur.noeud, String);
    check(senseur.senseur, Number);
    check(texte_location, String);

    let domaine = "millegrilles.domaines.SenseursPassifs.modificationManuelle";

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

    RabbitMQ.transmettreTransactionFormattee(chargeUtile, domaine);
  },
});
