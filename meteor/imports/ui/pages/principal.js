import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rapports } from '../../api//millegrilles_domaines_Rapports.js'

import './principal.html';

Template.Principal_show_page.onCreated(function noeudsOnCreated() {
  Meteor.subscribe('rapports_meteo');
});


Template.Principal_colonne_milieu.helpers({
  rapport_previsions() {
    return Rapports.findOne({
      '_mg-libelle': 'meteo_envcanada',
      'url': 'https://www.maple.mdugre.info/samples/on-52_e.xml'
    });
  },
});
