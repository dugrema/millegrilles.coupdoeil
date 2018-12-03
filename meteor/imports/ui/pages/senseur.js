import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
//import { d3 } from 'meteor/d3';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';
import { Circles } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

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
    // console.log("Changement donnees senseur_historique_horaire");
    if(Template.instance() !== undefined) {
      var graphiqueHoraire = Template.instance().graphiqueHoraire;
      var donnees = Template.instance().data;
      if(graphiqueHoraire !== undefined && donnees !== undefined) {
        if(graphiqueHoraire.svg !== undefined && donnees['moyennes_dernier_jour'] !== undefined) {
          // console.log("senseur_historique_horaire.donnees_changees On a des donnees")
          maj_graphique_horaire(graphiqueHoraire, donnees['moyennes_dernier_jour']);
        }
      }
    }
  },
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
  maj_graphique() {
    //var donnees = Template.instance().data['extremes_dernier_mois'];
    var donnees = this['extremes_dernier_mois'];

    // data
    // Get the data
    //d3.csv("data.csv", function(error, data) {
    if(donnees !== undefined) {

      // Set the dimensions of the canvas / graph
      var margin = {top: 30, right: 20, bottom: 30, left: 50},
          width = 600 - margin.left - margin.right,
          height = 270 - margin.top - margin.bottom;

      // Set the ranges
      var x = d3.time.scale().range([0, width]);
      var y = d3.scale.linear().range([height, 0]);

      // Define the axes
      var xAxis = d3.svg.axis().scale(x)
          .orient("bottom").ticks(5);

      var yAxis = d3.svg.axis().scale(y)
          .orient("left").ticks(5);

      Template.instance()._xAxis = xAxis;
      Template.instance()._yAxis = yAxis;

      // Define the line
      var valueline = d3.svg.line()
          .x(function(d) { return x(d["periode"]); })
          .y(function(d) { return y(d["temperature-maximum"]); });

      // Adds the svg canvas
      d3.select("#graphique_quotidien svg").remove();
      var svg = d3.select("#graphique_quotidien")
          .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
          .append("g")
              .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

      // Scale the range of the data
      x.domain(d3.extent(donnees, function(d) { return d["periode"]; }));
      y.domain([0, d3.max(donnees, function(d) { return d["temperature-maximum"]; })]);

      // Add the valueline path.
      svg.append("path")
          .attr("class", "line")
          .attr("d", valueline(donnees));

      // Add the scatterplot
      svg.selectAll("dot")
          .data(donnees)
        .enter().append("circle")
          .attr("r", 3.5)
          .attr("cx", function(d) { return x(d["periode"]); })
          .attr("cy", function(d) { return y(d["temperature-maximum"]); });

      // Add the X Axis
      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      // Add the Y Axis
      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);
    }
  }
});

Template.senseur_historique_horaire.onCreated(() => {
  // console.log("senseur_historique_horaire.onCreated");
  var graphiqueHoraire = new Object();
  Template.instance().graphiqueHoraire = graphiqueHoraire;

  // Set the dimensions of the canvas / graph
  graphiqueHoraire.margin = {top: 30, right: 20, bottom: 30, left: 50};
  graphiqueHoraire.width = 600 - graphiqueHoraire.margin.left - graphiqueHoraire.margin.right;
  graphiqueHoraire.height = 270 - graphiqueHoraire.margin.top - graphiqueHoraire.margin.bottom;

  // Set the ranges
  graphiqueHoraire.x_range = d3.time.scale().range([0, graphiqueHoraire.width]);
  graphiqueHoraire.y_range = d3.scale.linear().range([graphiqueHoraire.height, 0]);

  // Define the axes
  graphiqueHoraire.xAxis = d3.svg.axis().scale(graphiqueHoraire.x_range).orient("bottom").ticks(5);
  graphiqueHoraire.yAxis = d3.svg.axis().scale(graphiqueHoraire.y_range).orient("left").ticks(5);

  // Define the line
  graphiqueHoraire.valueline = d3.svg.line()
      .x(function(d) { return graphiqueHoraire.x_range(d["periode"]); })
      .y(function(d) { return graphiqueHoraire.y_range(d["temperature-moyenne"]); });

  // console.log("senseur_historique_horaire.onCreated done");

});

Template.senseur_historique_horaire.onRendered(() => {
  // console.log("senseur_historique_horaire.onRendered");

  var graphiqueHoraire = Template.instance().graphiqueHoraire;

  // Adds the svg canvas
  graphiqueHoraire.svg = d3.select("#graphique_horaire")
      .append("svg")
      .attr("width", graphiqueHoraire.width + graphiqueHoraire.margin.left + graphiqueHoraire.margin.right)
      .attr("height", graphiqueHoraire.height + graphiqueHoraire.margin.top + graphiqueHoraire.margin.bottom)
      .append("g")
      .attr("transform",
            "translate(" + graphiqueHoraire.margin.left + "," + graphiqueHoraire.margin.top + ")");

  if(Template.instance() !== undefined) {
    var donnees = Template.instance().data;
    if(donnees !== undefined) {
      if(donnees['moyennes_dernier_jour'] !== undefined) {
        // console.log("senseur_historique_horaire.onRendered On a des donnees")
        maj_graphique_horaire(graphiqueHoraire, donnees['moyennes_dernier_jour']);
      }
    }
  }

  // console.log("senseur_historique_horaire.onRendered done");
});

function maj_graphique_horaire(graphiqueHoraire, donnees) {
  // Get the data
  if(donnees !== undefined && graphiqueHoraire !== undefined) {
    // console.log("senseur_historique_horaire.maj_graphique On a des donnees")

    var graphiqueHoraire = Template.instance().graphiqueHoraire;

    // Scale the range of the data
    graphiqueHoraire.x_range.domain(
      d3.extent(donnees, function(d) { return d["periode"]; })
    );

    range_y_extremes = [
      {"temperature-moyenne": -10}, // Mettre les extremes habituels
      {"temperature-moyenne": 20}]  // de temperature
      .concat(donnees); // Ajouter donnees reeles pour allonger au besoin
    graphiqueHoraire.y_range.domain([
      d3.min(range_y_extremes, function(d) { return d["temperature-moyenne"]; }),
      d3.max(range_y_extremes, function(d) { return d["temperature-moyenne"]; })
    ]);

    // Add the valueline path.
    graphiqueHoraire.svg.append("path")
        .attr("class", "line")
        .attr("d", graphiqueHoraire.valueline(donnees));

    // Add the scatterplot
    graphiqueHoraire.svg.selectAll("dot")
        .data(donnees)
        .enter()
        .append("circle")
        .attr("r", 3.5)
        .attr("cx", function(d) { return graphiqueHoraire.x_range(d["periode"]); })
        .attr("cy", function(d) { return graphiqueHoraire.y_range(d["temperature-moyenne"]); });

    // Add the X Axis
    graphiqueHoraire.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + graphiqueHoraire.height + ")")
        .call(graphiqueHoraire.xAxis);

    // Add the Y Axis
    graphiqueHoraire.svg.append("g")
        .attr("class", "y axis")
        .call(graphiqueHoraire.yAxis);
  } else {
    // if(donnees === undefined) console.log("senseur_historique_horaire.maj_graphique: Pas de donnees");
    // if(graphiqueHoraire === undefined) console.log("senseur_historique_horaire.maj_graphique: Pas de graphiqueHoraire");
  }
}
