/* Ecran a 3 colonnes */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './app-3colonnes.html';

Template.App_3colonnes.rendered = function() {
  $('body').addClass('w3-theme-l5');
};
