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
    return Notifications.find({
      '_mg-libelle': 'regle_simple',
      'etat_notification': {'$in': ['active']}
    });
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

Template.Notification_liste.events({
  'click DIV.boutonsNotifications button.Vue'() {
    messageActionNotification = {
      'id_notification': this._id._str,
      'action': 'vue'
    };
    Meteor.call('Notifications.actionUsager', messageActionNotification);
  },
  'click DIV.boutonsNotifications button.Rappeler'() {
    messageActionNotification = {
      'id_notification': this._id._str,
      'action': 'rappel'
    };
    Meteor.call('Notifications.actionUsager', messageActionNotification);
  },
  'click DIV.boutonsNotifications button.Surveiller'() {
    messageActionNotification = {
      'id_notification': this._id._str,
      'action': 'surveille'
    };
    Meteor.call('Notifications.actionUsager', messageActionNotification);
  },
});
