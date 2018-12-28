import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Principale } from '../../api//millegrilles_domaines_Principale.js'

import './menu_gauche.html';

Template.App_3colonnes_gauche.onCreated(function noeudsOnCreated() {
  Meteor.subscribe('principale_configurations');
});

Template.App_3colonnes_gauche.helpers({
  configuration() {
    return Principale.findOne({
      '_mg-libelle': 'configuration'
    });
  },
});

Template.App_3colonnes_gauche_domaines.helpers({
  configuration() {
    return Principale.findOne({
      '_mg-libelle': 'configuration'
    });
  },
  liste_domaines(domaines) {
    let resultats = [];
    for (let nom_domaine in domaines) {
      domaine = {
        'nom_domaine': nom_domaine,
        'parametres': domaines[nom_domaine]
      };
      resultats.push(domaine);
    }

    // Trier par rang
    resultats.sort(function(a,b) {
      let ranga = a.parametres.rang, rangb = b.parametres.rang;
      if(ranga === rangb) return 0;
      if(ranga === undefined) return -1;
      return ranga - rangb;
    });

    return resultats;
  },
});

Template.App_3colonnes_gauche_domaines.events({
  'click SPAN.SenseursPassifs'() {
    console.log("SenseursPassifs");
    FlowRouter.go('Noeuds.show');
  },
  'click SPAN.WebPoll'() {
    console.log("WebPoll");
  },
  'click SPAN.Notifications'() {
    console.log("Notifications");
    FlowRouter.go('Notifications.show');
  },
  'click SPAN.Principale'() {
    console.log("Principale");
    FlowRouter.go('App.principal');
  },
});
