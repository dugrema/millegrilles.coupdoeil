import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const SenseursPassifs = new Mongo.Collection('mgdomaines_appareils_SenseursPassifs');

export const Circles = new Mongo.Collection('circles');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('noeuds', function noeudsPublication() {
    return SenseursPassifs.find({'_mg-libelle': 'noeud.individuel'});
  });
  Meteor.publish('senseurs', function senseursPublication() {
    return SenseursPassifs.find({'_mg-libelle': 'senseur.individuel'});
  });

//  Meteor.startup(function () {
//    if (Circles.find().count() === 0) {
//      Circles.insert({data: [5, 8, 11, 14, 17, 20]});
//    }
//  });

/*  Meteor.setInterval(function () {
    var newData = _.shuffle(Circles.findOne().data);
    Circles.update({}, {data: newData});
  }, 2000); */
}
