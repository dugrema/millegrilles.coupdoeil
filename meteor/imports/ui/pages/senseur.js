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
  Template.instance().graphiqueHoraireObj = new GraphiqueCharte2D();
});

Template.senseur_historique_horaire.onRendered(() => {
  const graphiqueHoraireObj = Template.instance().graphiqueHoraireObj;
  graphiqueHoraireObj.attacher_svg();

  if(Template.instance() !== undefined) {
    var donnees = Template.instance().data;
    if(donnees !== undefined) {
      if(donnees['moyennes_dernier_jour'] !== undefined) {
        // console.log("senseur_historique_horaire.onRendered On a des donnees")
        //maj_graphique_horaire(graphiqueHoraire, donnees['moyennes_dernier_jour']);
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
    // console.log("Changement donnees senseur_historique_horaire");
    if(Template.instance() !== undefined) {
      var graphiqueQuotidien = Template.instance().graphiqueQuotidien;
      var donnees = Template.instance().data;
      if(graphiqueQuotidien !== undefined && donnees !== undefined) {
        if(graphiqueQuotidien.svg !== undefined && donnees['extremes_dernier_mois'] !== undefined) {
          // console.log("senseur_historique_horaire.donnees_changees On a des donnees")
          maj_graphique_quotidien(graphiqueQuotidien, donnees['extremes_dernier_mois']);
        }
      }
    }
  },
});

Template.senseur_historique_quotidien.onCreated(() => {
  // console.log("senseur_historique_horaire.onCreated");
  var graphique = new Object();
  Template.instance().graphiqueQuotidien = graphique;

  // Set the dimensions of the canvas / graph
  graphique.margin = {top: 30, right: 20, bottom: 30, left: 50};
  graphique.width = 600 - graphique.margin.left - graphique.margin.right;
  graphique.height = 270 - graphique.margin.top - graphique.margin.bottom;

  // Set the ranges
  graphique.x_range = d3.time.scale().range([0, graphique.width]);
  graphique.y_range = d3.scale.linear().range([graphique.height, 0]);

  // Define the axes
  graphique.xAxis = d3.svg.axis().scale(graphique.x_range).orient("bottom").ticks(5);
  graphique.yAxis = d3.svg.axis().scale(graphique.y_range).orient("left").ticks(5);

  // Define the line
  graphique.valueline = d3.svg.line()
      .x(function(d) { return graphique.x_range(d["periode"]); })
      .y(function(d) { return graphique.y_range(d["temperature-maximum"]); });

  // console.log("senseur_historique_horaire.onCreated done");

});

Template.senseur_historique_quotidien.onRendered(() => {
  // console.log("senseur_historique_horaire.onRendered");

  var graphique = Template.instance().graphiqueQuotidien;

  // Adds the svg canvas
  graphique.svg = d3.select("#graphique_quotidien")
      .append("svg")
      .attr("width", graphique.width + graphique.margin.left + graphique.margin.right)
      .attr("height", graphique.height + graphique.margin.top + graphique.margin.bottom)
      .append("g")
      .attr("transform",
            "translate(" + graphique.margin.left + "," + graphique.margin.top + ")");

  if(Template.instance() !== undefined) {
    var donnees = Template.instance().data;
    if(donnees !== undefined) {
      if(donnees['extremes_dernier_mois'] !== undefined) {
        // console.log("senseur_historique_horaire.onRendered On a des donnees")
        maj_graphique_quotidien(graphique, donnees['extremes_dernier_mois']);
      }
    }
  }

  // console.log("senseur_historique_horaire.onRendered done");
});

function maj_graphique_quotidien(graphique, donnees) {
  // Get the data
  if(donnees !== undefined && graphique !== undefined) {
    // console.log("senseur_historique_horaire.maj_graphique On a des donnees")

    // Scale the range of the data
    graphique.x_range.domain(
      d3.extent(donnees, function(d) { return d["periode"]; })
    );

    range_y_extremes = [
      {"temperature-maximum": -10}, // Mettre les extremes habituels
      {"temperature-maximum": 20}]  // de temperature
      .concat(donnees); // Ajouter donnees reeles pour allonger au besoin
    graphique.y_range.domain([
      d3.min(range_y_extremes, function(d) { return d["temperature-maximum"]; }),
      d3.max(range_y_extremes, function(d) { return d["temperature-maximum"]; })
    ]);

    // Add the valueline path.
    graphique.svg.append("path")
        .attr("class", "line")
        .attr("d", graphique.valueline(donnees));

    // Add the scatterplot
    graphique.svg.selectAll("dot")
        .data(donnees)
        .enter()
        .append("circle")
        .attr("r", 3.5)
        .attr("cx", function(d) { return graphique.x_range(d["periode"]); })
        .attr("cy", function(d) { return graphique.y_range(d["temperature-maximum"]); });

    // Add the X Axis
    graphique.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + graphique.height + ")")
        .call(graphique.xAxis);

    // Add the Y Axis
    graphique.svg.append("g")
        .attr("class", "y axis")
        .call(graphique.yAxis);
  } else {
    // if(donnees === undefined) console.log("senseur_historique_horaire.maj_graphique: Pas de donnees");
    // if(graphiqueHoraire === undefined) console.log("senseur_historique_horaire.maj_graphique: Pas de graphiqueHoraire");
  }
}
