import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import { menuCourant, MenuSenseursPassifs } from '../layouts/menuHelpers.js';

import './SenseursPassifs_Senseur_Parametres.html'

Template.SenseurPassifs_Senseur_Parametres.onCreated(function bodyOnCreated() {
  Meteor.subscribe('senseurs');
});

Template.SenseurPassifs_Senseur_Parametres.onRendered(function preparerMenu() {
  var menuSenseurs = MenuSenseursPassifs.clone();
  let parametres = {
    noeud: FlowRouter.getParam('noeud'),
    senseur: FlowRouter.getParam('senseur')
  };

  menuSenseurs.setParent('SenseursPassifs.show');
  menuSenseurs.ajouterMenuItem('SenseursPassifs.Noeud.show', 'fa-sliders', 'Noeud', 2, parametres);
  menuSenseurs.ajouterMenuItem('SenseursPassifs.Senseur.show', 'fa-sliders', 'Senseur', 3, parametres);
  menuSenseurs.ajouterMenuItem('SenseursPassifs.SenseurHistorique.show', 'fa-sliders', 'Historique', 3, parametres);
  menuSenseurs.ajouterMenuItem('SenseursPassifs.SenseurParametres.show', 'fa-sliders', 'Paramètres', 3, parametres);
  menuCourant.set(menuSenseurs);
});
