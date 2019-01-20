import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
//import { d3 } from 'meteor/d3';

import { SenseursPassifs } from '../../api/millegrilles_domaines_SenseursPassifs.js';

import { GraphiqueCharte2D } from '../graph/chart.js';
import { menuCourant, MenuSenseursPassifs } from '../layouts/menuHelpers.js';

import './SenseursPassifs_Senseur.html'

Template.Senseur_show_page.onCreated(function bodyOnCreated() {
  Meteor.subscribe('senseurs');
});

Template.Senseur_show_page.helpers({
  senseur() {
    var noeud = FlowRouter.getParam('noeud');
    var no_senseur = parseInt(FlowRouter.getParam('senseur'));
    var senseurdocs = SenseursPassifs.findOne({
      'noeud': noeud,
      'senseur': no_senseur,
      '_mg-libelle': 'senseur.individuel'
    });

    return senseurdocs;
  },
});

Template.Senseur_show_page.onRendered(function preparerMenu() {
  var menuSenseurs = MenuSenseursPassifs.clone();
  let parametres = {
    noeud: FlowRouter.getParam('noeud'),
    senseur: FlowRouter.getParam('senseur')
  };

  menuSenseurs.setParent('SenseursPassifs.show');
  menuSenseurs.ajouterMenuItem('SenseursPassifs.Noeud.show', 'fa-sliders', 'Noeud', 2, parametres);
  menuSenseurs.ajouterMenuItem('SenseursPassifs.Senseur.show', 'fa-sliders', 'Senseur', 3, parametres);
  menuSenseurs.ajouterMenuItem('SenseursPassifs.Senseur.Historique.show', 'fa-sliders', 'Historique', 3, parametres);
  menuSenseurs.ajouterMenuItem('SenseursPassifs.Senseur.Parametres.show', 'fa-sliders', 'Paramètres', 3, parametres);
  menuCourant.set(menuSenseurs);
});

Template.senseurDetailUnique.events({
  'change .location'(bouton) {
    Meteor.call('SenseursPassifs.location.update', this, bouton.currentTarget.value);
  },
});

Template.senseur_actuel.helpers({
  temperature_existe(){
    return !isNaN(this.temperature);
  },
  tendance_existe(){
    return this.pression_tendance !== null;
  },
  humidite_existe(){
    return !isNaN(this.humidite);
  },
  pression_existe(){
    return !isNaN(this.pression);
  },
  batterie_existe(){
    return !isNaN(this.millivolt);
  },
  temps_lecture_formatte(){
    return moment(this.temps_lecture).format("MMM-DD HH:mm:ss");
  },
  tendance_formattee(){
    var pression = this.pression_tendance;

    if(pression !== null) {
      if(pression === '+') return "Hausse";
      if(pression === '-') return "Baisse";
      if(pression === '=') return "Stable";
    }

    return "N/A";
  }
});

Template.senseur_historique_horaire.helpers({
  periode_short() {
    var periode = this['periode'];
    return periode.toISOString().split('T')[1].split('.')[0];
  },
  periode_tzlocal() {
    var periode = moment(this['periode']);
    return periode.format('HH:mm');
  },
  temperature_moyenne() {
    return (Math.round(this['temperature-moyenne'] * 10) / 10).toFixed(1);
  },
  humidite_moyenne() {
    var humidite = this['humidite-moyenne'];
    if(humidite > 0) {
      return Math.round(humidite);
    }
    return false;
  },
  pression_moyenne() {
    var pression = this['pression-moyenne'];
    if(pression > 0) {
      return (Math.round(pression * 10) / 10).toFixed(1);
    }
    return false;
  },
  donnees_changees(donnees) {
    const graphiqueHoraireObj = Template.instance().graphiqueHoraireObj;
    //graphiqueHoraireObj.appliquerDonnees(donnees);
  },
});

Template.senseur_historique_horaire.onCreated( function() {
  const graphiqueHoraireObj = new GraphiqueCharte2D();
  this.graphiqueHoraireObj = graphiqueHoraireObj;
  graphiqueHoraireObj.idDiv = "#graphique_horaire";
  graphiqueHoraireObj.nomVariableOrdonnee1 = "temperature-moyenne";
  graphiqueHoraireObj.preparer_graphique();
});

Template.senseur_historique_horaire.onRendered( function() {
  // Attacher l'element SVG pour le graphique 24 heures
  const graphiqueHoraireObj = this.graphiqueHoraireObj;
  graphiqueHoraireObj.attacher_svg();
});

Template.senseur_historique_quotidien.helpers({
  periode_jour() {
    var periode = this['periode'];
    return periode.toISOString().split('T')[0];
  },
  temperature_minimum() {
    var temperature = this['temperature-minimum'];
    return temperature
  },
  temperature_maximum() {
    var temperature = this['temperature-maximum'];
    return temperature
  },
  humidite_minimum() {
    var humidite = this['humidite-minimum'];
    return humidite
  },
  humidite_maximum() {
    var humidite = this['humidite-maximum'];
    return humidite
  },
  pression_minimum() {
    var pression = this['pression-minimum'];
    return pression
  },
  pression_maximum() {
    var pression = this['pression-maximum'];
    return pression
  },
  donnees_changees(donnees) {
    const graphiqueQuotidienTemperatureObj = Template.instance().graphiqueQuotidienTemperatureObj,
          graphiqueQuotidienHumiditeObj = Template.instance().graphiqueQuotidienHumiditeObj,
          graphiqueQuotidienPressionObj = Template.instance().graphiqueQuotidienPressionObj;

    graphiqueQuotidienTemperatureObj.appliquerDonnees(donnees);
    graphiqueQuotidienHumiditeObj.appliquerDonnees(donnees);
    graphiqueQuotidienPressionObj.appliquerDonnees(donnees);
  },
});

Template.senseur_historique_quotidien.onCreated( function() {
  const graphiqueQuotidienTemperatureObj = new GraphiqueCharte2D();
  this.graphiqueQuotidienTemperatureObj = graphiqueQuotidienTemperatureObj;
  graphiqueQuotidienTemperatureObj.idDiv = "#graphique_quotidien_temperature";
  graphiqueQuotidienTemperatureObj.nomVariableOrdonnee1 = "temperature-maximum";
  graphiqueQuotidienTemperatureObj.nomVariableOrdonnee2 = "temperature-minimum";
  graphiqueQuotidienTemperatureObj.preparer_graphique();

  const graphiqueQuotidienHumiditeObj = new GraphiqueCharte2D();
  this.graphiqueQuotidienHumiditeObj = graphiqueQuotidienHumiditeObj;
  graphiqueQuotidienHumiditeObj.idDiv = "#graphique_quotidien_humidite";
  graphiqueQuotidienHumiditeObj.nomVariableOrdonnee1 = "humidite-maximum";
  graphiqueQuotidienHumiditeObj.nomVariableOrdonnee2 = "humidite-minimum";
  graphiqueQuotidienHumiditeObj.preparer_graphique();

  const graphiqueQuotidienPressionObj = new GraphiqueCharte2D();
  this.graphiqueQuotidienPressionObj = graphiqueQuotidienPressionObj;
  graphiqueQuotidienPressionObj.idDiv = "#graphique_quotidien_pression";
  graphiqueQuotidienPressionObj.nomVariableOrdonnee1 = "pression-maximum";
  graphiqueQuotidienPressionObj.nomVariableOrdonnee2 = "pression-minimum";
  graphiqueQuotidienPressionObj.preparer_graphique();

});

Template.senseur_historique_quotidien.onRendered( function() {
  // Attacher l'element SVG pour le graphique 31 jours
  const graphiqueQuotidienTemperatureObj = this.graphiqueQuotidienTemperatureObj,
        graphiqueQuotidienHumiditeObj = Template.instance().graphiqueQuotidienHumiditeObj,
        graphiqueQuotidienPressionObj = Template.instance().graphiqueQuotidienPressionObj;
  graphiqueQuotidienTemperatureObj.attacher_svg();
  graphiqueQuotidienHumiditeObj.attacher_svg();
  graphiqueQuotidienPressionObj.attacher_svg();
});

Template.senseur_liens.events({
  'click button.Noeuds'() {
    FlowRouter.go('Noeuds.show');
  },
});
