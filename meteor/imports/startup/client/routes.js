import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/app-body.js';
import '../../ui/layouts/app-3colonnes.js'
import '../../ui/pages/root-redirector.js';
import '../../ui/pages/noeuds.js';
import '../../ui/pages/senseur.js';
import '../../ui/pages/notifications.js';
import '../../ui/pages/principal.js';

/*
// Import to override accounts templates
import '../../ui/accounts/accounts-templates.js';

*/

FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

// millegrilles.domaines.Notifications

FlowRouter.route('/notifications/', {
  name: 'Notifications.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'Notifications_show_page' });
  },
});

// mgdomaines.appareils.SenseursPassifs

FlowRouter.route('/noeuds/', {
  name: 'Noeuds.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'Noeuds_show_page' });
  },
});

FlowRouter.route('/senseur/:noeud/:senseur', {
  name: 'Senseur.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'Senseur_show_page' });
  },
});

// Application 3 3colonnes
FlowRouter.route('/principal', {
  name: 'App.principal',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'Principal_show_page' });
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
