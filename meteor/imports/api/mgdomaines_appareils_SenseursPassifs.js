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
    check(senseur.noeud, String);
    check(senseur.senseur, Number);
    check(texte_location, String);

    let infoTransaction = {
      'domaine': "mgdomaines.appareils.SenseursPassifs.modificationManuelle"
    };

    let nomMilleGrille = 'sansnom';

    if(Meteor.server) {
      // Ces valeurs n'ont de sens que sur le serveur.
      let tempsLecture = Math.trunc((new Date).getTime()/1000);

      infoTransaction['source-systeme'] = 'coupdoeil@' + RabbitMQ.getHostname();
      infoTransaction['signature_contenu'] = "";
      infoTransaction['uuid-transaction'] = RabbitMQ.genererUUID();
      infoTransaction['estampille'] = tempsLecture;

      // Trigger pour propager le changement de nom via un workflow.
      if(process.env.MG_NOM_MILLEGRILLE !== undefined) {
        nomMilleGrille = process.env.MG_NOM_MILLEGRILLE;
      } else {
        console.warn("Nom de la millegrille non defini, defaut sansnom");
      }

    }

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

    // Preparer la structure du message
    let message = {};
    message['charge-utile'] = chargeUtile;
    message['info-transaction'] = infoTransaction;

    // console.log(message);

    routingKey = nomMilleGrille + '.transaction.nouvelle';
    //routingKey = 'test';
    RabbitMQ.transmettreTransaction(routingKey, message);
  },
});
