import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
 
export const SenseursPassifs = new Mongo.Collection('mgdomaines_appareils_SenseursPassifs');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('noeuds', function noeudsPublication() {
    return SenseursPassifs.find({'_mg-libelle': 'noeud.individuel'});
  });
}
