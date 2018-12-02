import { Meteor } from 'meteor/meteor';
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
});

//var Circles = new Mongo.Collection('circles');
var datapoints = [18, 2, 12, 9, 5];

Template.vis.rendered = function () {
  var svg, width = 500, height = 75, x;

  //var data = Circles.findOne().data;
  d3.select("#circles").append('p').text( "Allo!" );

  svg = d3.select('#circles').append('svg')
    .attr('width', width)
    .attr('height', height);

  var drawCircles = function (update) {
    console.log("Data " + datapoints);
    var circles = svg.selectAll('circle').data(datapoints);
    if (!update) {
      circles = circles.enter().append('circle')
        .attr('cx', function (d, i) { return x(i); })
        .attr('cy', height / 2);
    } else {
      circles = circles.transition().duration(1000);
    }
    circles.attr('r', function (d) { return d; });
  };


//  function () {

    x = d3.scale.ordinal()
      .domain(d3.range(datapoints.length))
      .rangePoints([0, width], 1);
    drawCircles(false);
//  };

  /*
  Circles.find().observe({
    added: function () {
      console.log("observe added");

      x = d3.scale.ordinal()
        .domain(d3.range(Circles.findOne().data.length))
        .rangePoints([0, width], 1);
      drawCircles(false);
    },
    changed: _.partial(drawCircles, true)
  });*/
};
