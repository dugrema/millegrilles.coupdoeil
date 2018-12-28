import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Principale = new Mongo.Collection('millegrilles_domaines_Principale');

if (Meteor.isServer) {

  // Notifications de type regles_simples
  Meteor.publish('principale_configurations', function () {
    return Principale.find({'_mg-libelle': 'configuration'});
  });

}
