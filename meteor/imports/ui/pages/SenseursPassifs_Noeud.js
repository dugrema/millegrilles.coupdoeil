import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import { menuCourant, MenuSenseursPassifs } from '../layouts/menuHelpers.js';

import './SenseursPassifs_Noeud.html'

Template.SenseurPassifs_Noeud.onCreated(function bodyOnCreated() {
  Meteor.subscribe('noeuds');
});

Template.SenseurPassifs_Noeud.onRendered(function preparerMenu() {
  var menuNoeud = MenuSenseursPassifs.clone();
  let parametres = {
    noeud: FlowRouter.getParam('noeud')
  };

  menuNoeud.setParent('SenseursPassifs.show');
  menuNoeud.ajouterMenuItem('SenseursPassifs.Noeud.show', 'fa-sliders', 'Noeud', 2, parametres);
  menuCourant.set(menuNoeud);
});
