import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/app-body.js';
import '../../ui/pages/root-redirector.js';
import '../../ui/pages/noeuds.js';
import '../../ui/pages/senseur.js';

/*
// Import to override accounts templates
import '../../ui/accounts/accounts-templates.js';

*/
FlowRouter.route('/noeuds/', {
  name: 'Noeuds.show',
  action() {
    BlazeLayout.render('App_body', { main: 'Noeuds_show_page' });
  },
});

FlowRouter.route('/senseur/:noeud/:senseur', {
  name: 'Senseur.show',
  action() {
    BlazeLayout.render('App_body', { main: 'Senseur_show_page' });
  },
});

FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

/*
// the App_notFound template is used for unknown routes and missing lists
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};
*/
