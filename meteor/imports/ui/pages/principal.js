import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Principale } from '../../api/millegrilles_domaines_Principale.js';
import { Rapports } from '../../api/millegrilles_domaines_Rapports.js';
import { menuCourant, MenuPrincipale } from '../layouts/menuHelpers.js';

import './principal.html';

Template.Principal_show_page.onCreated(function noeudsOnCreated() {
  Meteor.subscribe('principale_configurations');
  Meteor.subscribe('rapports_meteo');
});

Template.Principal_colonne_milieu.onRendered(function preparerMenu() {
  menuCourant.set(MenuPrincipale);
});

Template.Principal_colonne_milieu.helpers({
  rapport_previsions() {
    return Rapports.findOne({
      '_mg-libelle': 'meteo_envcanada'
    });
  },
  rapport_est_prevision(prevision) {
    if(prevision === undefined) return false;
    if (prevision.indexOf('Observ') > -1) {
      return false;
    }
    return true;
  },
  rapport_est_avertissement(prevision) {
    if(prevision === undefined) return false;
    if (prevision.indexOf('No watches or warnings') > -1) {
      return false;
    }
    return true;
  }
});
