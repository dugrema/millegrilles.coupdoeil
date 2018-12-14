import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

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
  'SenseursPassifs.location.update'(id_senseur, texte_location) {
    check(id_senseur, Mongo.ObjectID);
    check(texte_location, String);

    SenseursPassifs.update(id_senseur, {$set: { location: texte_location } });

    // Trigger pour propager le changement de nom via un workflow.

  },
});
