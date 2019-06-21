// Fichier API pour le domaine des Notifications de MilleGrilles

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { RabbitMQ } from './RabbitMQ.js';

export const Notifications = new Mongo.Collection('millegrilles.domaines.Notifications/documents');

if (Meteor.isServer) {

  // Notifications de type regles_simples
  Meteor.publish('notifications_regles_simples', function notificationsPublication() {
    return Notifications.find({'_mg-libelle': 'regle_simple'});
  });

}

Meteor.methods({
  'Notifications.actionUsager'(messageActionNotification) {
    domaine = 'millegrilles.domaines.Notifications.actionUsager';
    RabbitMQ.transmettreTransactionFormattee(messageActionNotification, domaine);
  },
})
