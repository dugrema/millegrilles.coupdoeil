import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Principale } from '../../api/millegrilles_domaines_Principale.js'

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
  alertes() {
    return Principale.findOne({
      '_mg-libelle': 'alertes'
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

Template.App_3colonnes_gauche.events({
  'click SPAN.alert-close'() {
    Meteor.call('Principale.alerte.close', this);
  },
});

Template.App_3colonnes_gauche_domaines.events({
  'click SPAN.SenseursPassifs'() {
    FlowRouter.go('Noeuds.show');
  },
  'click SPAN.WebPoll'() {
    console.warn("WebPoll pas implemente");
  },
  'click SPAN.Notifications'() {
    FlowRouter.go('Notifications.show');
  },
  'click SPAN.Principale'() {
    FlowRouter.go('App.principal');
  },
});

Template.App_3colonnes_gauche_menu_domaine.events({
  'click button.bouton-menu-gauche'(bouton) {
    let data = bouton.currentTarget.firstChild.data;
    let regexp_route = /route="(.+)"/g;
    let matcher = regexp_route.exec(data);
    let route = matcher[1];
    FlowRouter.go(route);
  },
});
