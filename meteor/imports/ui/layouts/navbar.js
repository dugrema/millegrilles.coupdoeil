import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Notifications } from '../../api/millegrilles_domaines_Notifications.js';
import { SenseursPassifs } from '../../api/millegrilles_domaines_SenseursPassifs.js';

import './navbar.html';

Template.App_navbar.onCreated(function bodyOnCreated() {
  Meteor.subscribe('notifications_regles_simples');
});

Template.App_navbar.helpers({
  compte_notifications() {
    return Notifications.find({
      '_mg-libelle': 'regle_simple',
      'etat_notification': {'$in': ['active']}
    }).count();
  },
  notifications_regles_simples() {
    return Notifications.find({
      '_mg-libelle': 'regle_simple',
      'etat_notification': {'$in': ['active']}
    });
  },
  charger_senseur(source) {
    // return [{"senseur": "Ah!", "source_id": source._id}];
    let document_senseur = SenseursPassifs.findOne({
      '_id': new Meteor.Collection.ObjectID(source._id)
    });
    return document_senseur;
  },
  unite_variable(element) {
    if(element === 'temperature') return '°C';
    if(element === 'humidite') return '%';
    if(element === 'pression') return ' kPa';
    if(element === 'millivolt') return ' mV';
  },
  compte_notification_gt0(nb_notifications) {
    return nb_notifications > 0;
  }
});

Template.App_navbar.events({
  'click button.Notifications'() {
    FlowRouter.go('Notifications.show');
  },
  'click A.Notification'(senseur) {
    console.log("Notification " + this.source._id);
  },
  'click A.Principal'() {
    FlowRouter.go('App.principal');
  },
});
