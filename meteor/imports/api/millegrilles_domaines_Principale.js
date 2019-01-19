import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { RabbitMQ } from './RabbitMQ.js';

export const Principale = new Mongo.Collection('millegrilles.domaines.Principale');

if (Meteor.isServer) {

  // Publications
  Meteor.publish('principale_configurations', function () {
    return Principale.find({
      '_mg-libelle': {'$in': ['configuration', 'alertes']}
    });
  });
}

Meteor.methods({
  'Principale.alerte.close'(alerte) {
    check(alerte.ts, Number);

    let domaine = "millegrilles.domaines.Principale.fermerAlerte";

    // Utiliser le timestamp de l'alerte (en ms) pour l'effacer
    let chargeUtile = {
      "alerte": alerte
    };

    RabbitMQ.transmettreTransactionFormattee(chargeUtile, domaine);
  },
  'Principale.alerte.creer'(message) {
    check(message, String);

    let domaine = "millegrilles.domaines.Principale.creerAlerte";

    // Utiliser le timestamp de l'alerte (en ms) pour l'effacer
    let chargeUtile = {
      "message": message
    };

    RabbitMQ.transmettreTransactionFormattee(chargeUtile, domaine);
  },
});
