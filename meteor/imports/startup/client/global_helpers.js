import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.registerHelper("format_date_moisheure", function (date) {
  return moment(date).format("MMM-DD HH:mm:ss");
});
