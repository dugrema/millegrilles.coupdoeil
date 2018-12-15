import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { Notifications } from '../../api/millegrilles_domaines_Notifications.js';
import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import './notifications.html'

Template.Notifications_show_page.onCreated(function bodyOnCreated() {
  Meteor.subscribe('notifications_regles_simples');
  Meteor.subscribe('senseurs');
});

Template.Notification_liste.helpers({
  notifications_regles_simples() {
    return Notifications.find({'_mg-libelle': 'regle_simple'});
  },
});

Template.mgdomaines_appareils_SenseursPassifs.helpers({
  charger_senseur(source) {
    // return [{"senseur": "Ah!", "source_id": source._id}];
    let document_senseur = SenseursPassifs.findOne({
      '_id': new Meteor.Collection.ObjectID(source._id)
    });
    return document_senseur;
  },
  nom_variable() {
    let template_variable = this.source._collection + '_' + this.valeurs.element;
    return template_variable;
  }
})
