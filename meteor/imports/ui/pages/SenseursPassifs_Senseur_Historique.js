import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import { menuCourant, MenuSenseursPassifs } from '../layouts/menuHelpers.js';

import './SenseursPassifs_Senseur_Historique.html'

Template.SenseursPassifs_Senseur_Historique.onCreated(function bodyOnCreated() {
  Meteor.subscribe('senseurs');
});
