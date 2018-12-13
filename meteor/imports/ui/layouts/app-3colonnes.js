/* Ecran a 3 colonnes */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './navbar.js';
import './menu_gauche.js';

import './app-3colonnes.html';

Template.App_3colonnes.rendered = function() {
  $('body').addClass('w3-theme-l5');
};
