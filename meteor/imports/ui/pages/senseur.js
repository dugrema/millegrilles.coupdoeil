import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import './senseur.html'

Template.body.onCreated(function bodyOnCreated() {
  Meteor.subscribe('senseurs');
});

Template.senseurDetail.helpers({
  senseurs() {
    var noeud = FlowRouter.getParam('noeud');
    var no_senseur = parseInt(FlowRouter.getParam('senseur'));
    console.log('Noeud ' + noeud + ' senseur ' + no_senseur);
    var senseurdocs = SenseursPassifs.find({
      'noeud': noeud, 
      'senseur': no_senseur, 
      '_mg-libelle': 'senseur.individuel'
    });

    return senseurdocs;
  },
});
