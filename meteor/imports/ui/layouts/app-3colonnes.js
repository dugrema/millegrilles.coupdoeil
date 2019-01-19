/* Ecran a 3 colonnes */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Principale } from '../../api/millegrilles_domaines_Principale.js'
import './navbar.js';
import './menu_gauche.js';

import './app-3colonnes.html';

Template.App_3colonnes.rendered = function() {
  $('body').addClass('w3-theme-l5');
};

Template.App_3colonnes_footer.helpers({
  configuration() {
    return Principale.findOne({
      '_mg-libelle': 'configuration'
    });
  },
});
