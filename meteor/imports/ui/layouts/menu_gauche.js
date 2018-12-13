import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './menu_gauche.html';

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
});
