import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';
import { menuCourant, MenuSenseursPassifs } from '../layouts/menuHelpers.js';

import './SenseursPassifs_Configuration.html';

Template.SenseursPassifs_Configuration.onRendered(function preparerMenu() {
  menuCourant.set(MenuSenseursPassifs);
});
