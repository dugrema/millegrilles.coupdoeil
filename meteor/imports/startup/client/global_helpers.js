import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

// Global helpers
Template.registerHelper("format_date_moisheure", function(date) {
    return moment(date).format("MMM-DD HH:mm:ss");
});

Template.registerHelper("est_nombre", function(valeur) {
  return !isNaN(valeur);
});
