import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { Notifications } from '../../api/millegrilles_domaines_Notifications.js';

import './notifications.html'

Template.Notifications_show_page.onCreated(function bodyOnCreated() {
  Meteor.subscribe('notifications_regles_simples');
});

Template.Notification_liste.helpers({
  notifications_regles_simples() {
    return Notifications.find({'_mg-libelle': 'regle_simple'});
  },
});

Template.Notification_ligne.helpers({
});
