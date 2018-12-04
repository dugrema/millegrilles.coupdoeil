import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
//import { d3 } from 'meteor/d3';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';
import { Circles } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import { GraphiqueCharte2D } from '../graph/chart.js';
import './senseur.html'

Template.Senseur_show_page.onCreated(function bodyOnCreated() {
  Meteor.subscribe('senseurs');
});

Template.Senseur_show_page.helpers({
  senseur() {
    var noeud = FlowRouter.getParam('noeud');
    var no_senseur = parseInt(FlowRouter.getParam('senseur'));
//    console.log('Noeud ' + noeud + ' senseur ' + no_senseur);
    var senseurdocs = SenseursPassifs.findOne({
      'noeud': noeud,
      'senseur': no_senseur,
      '_mg-libelle': 'senseur.individuel'
    });

    return senseurdocs;
  },
});

Template.senseur_actuel.helpers({
  tendance_existe(){
    return this.pression_tendance !== null;
  },
  humidite_existe(){
    return this.humidite > 0;
  },
  pression_existe(){
    return this.pression > 0;
  },
  batterie_existe(){
    return this.millivolt > 0;
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
    return periode.format('hh:mm');
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
  donnees_changees() {
    if(Template.instance() !== undefined) {
      var donnees = Template.instance().data;
      if(donnees !== undefined) {
        const graphiqueHoraireObj = Template.instance().graphiqueHoraireObj;
        graphiqueHoraireObj.appliquerDonnees(donnees['moyennes_dernier_jour']);
      }
    }
  },
});

Template.senseur_historique_horaire.onCreated(() => {
  const graphiqueHoraireObj = new GraphiqueCharte2D();
  Template.instance().graphiqueHoraireObj = graphiqueHoraireObj;
  graphiqueHoraireObj.idDiv = "#graphique_horaire";
  graphiqueHoraireObj.nomVariableOrdonnee1 = "temperature-moyenne";
  graphiqueHoraireObj.preparer_graphique();
});

Template.senseur_historique_horaire.onRendered(() => {
  const graphiqueHoraireObj = Template.instance().graphiqueHoraireObj;
  graphiqueHoraireObj.attacher_svg();

  if(Template.instance() !== undefined) {
    var donnees = Template.instance().data;
    if(donnees !== undefined) {
      if(donnees['moyennes_dernier_jour'] !== undefined) {
        graphiqueHoraireObj.appliquerDonnees(donnees['moyennes_dernier_jour']);
      }
    }
  }
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
  donnees_changees() {
    if(Template.instance() !== undefined) {
      var donnees = Template.instance().data;
      if(donnees !== undefined) {
        const graphiqueQuotidienObj = Template.instance().graphiqueQuotidienObj;
        graphiqueQuotidienObj.appliquerDonnees(donnees['extremes_dernier_mois']);
      }
    }
  },
});

Template.senseur_historique_quotidien.onCreated(() => {
  let graphiqueQuotidienObj = new GraphiqueCharte2D();
  Template.instance().graphiqueQuotidienObj = graphiqueQuotidienObj;
  graphiqueQuotidienObj.idDiv = "#graphique_quotidien";
  graphiqueQuotidienObj.nomVariableOrdonnee1 = "temperature-maximum";
  graphiqueQuotidienObj.preparer_graphique();
});

Template.senseur_historique_quotidien.onRendered(() => {
  const graphiqueQuotidienObj = Template.instance().graphiqueQuotidienObj;
  graphiqueQuotidienObj.attacher_svg();

  if(Template.instance() !== undefined) {
    var donnees = Template.instance().data;
    if(donnees !== undefined) {
      if(donnees['extremes_dernier_mois'] !== undefined) {
        graphiqueQuotidienObj.appliquerDonnees(donnees['extremes_dernier_mois']);
      }
    }
  }
});
