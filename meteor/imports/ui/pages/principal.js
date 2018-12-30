import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Principale } from '../../api/millegrilles_domaines_Principale.js';
import { Rapports } from '../../api/millegrilles_domaines_Rapports.js';
import { MenuGauche } from '../layouts/menuHelpers.js';

import './principal.html';

Template.Principal_show_page.onCreated(function noeudsOnCreated() {
  Meteor.subscribe('principale_configurations');
  Meteor.subscribe('rapports_meteo');
});

Template.Principal_colonne_milieu.onRendered(function preparerMenu() {
  let menu = new MenuGauche($('.menu-domaine-gauche'));
  menu.ajouterMenu('menu-parametres', 'fa-globe', 'Paramètres');
  menu.appliquer();
});

Template.Principal_colonne_milieu.helpers({
  rapport_previsions() {
    return Rapports.findOne({
      '_mg-libelle': 'meteo_envcanada'
    });
  },
});
