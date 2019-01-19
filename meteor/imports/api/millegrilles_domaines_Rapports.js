import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Rapports = new Mongo.Collection('millegrilles.domaines.Rapports');

if (Meteor.isServer) {

  // Notifications de type regles_simples
  Meteor.publish('rapports_meteo', function () {
    return Rapports.find({'_mg-libelle': 'meteo_envcanada'});
  });

}
