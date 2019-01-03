import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/app-body.js';
import '../../ui/layouts/app-3colonnes.js'
import '../../ui/pages/root-redirector.js';
import '../../ui/pages/notifications.js';
import '../../ui/pages/principal.js';

// SenseursPassifs
import '../../ui/pages/SenseursPassifs.js';
import '../../ui/pages/SenseursPassifs_Configuration.js';
import '../../ui/pages/SenseursPassifs_Senseur.js';
import '../../ui/pages/SenseursPassifs_Noeud.js';
import '../../ui/pages/SenseursPassifs_Senseur_Historique.js';
import '../../ui/pages/SenseursPassifs_Senseur_Parametres.js';

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

// millegrilles.domaines.SenseursPassifs

FlowRouter.route('/SenseursPassifs/', {
  name: 'SenseursPassifs.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'SenseursPassifs_show_page' });
  },
});

FlowRouter.route('/SenseursPassifs/Configuration', {
  name: 'SenseursPassifs.Configuration.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'SenseursPassifs_Configuration' });
  },
});

FlowRouter.route('/SenseursPassifs/:noeud', {
  name: 'SenseursPassifs.Noeud.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'SenseurPassifs_Noeud' });
  },
});

FlowRouter.route('/SenseursPassifs/:noeud/:senseur', {
  name: 'SenseursPassifs.Senseur.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'Senseur_show_page' });
  },
});

FlowRouter.route('/SenseursPassifs/:noeud/:senseur/parametres', {
  name: 'SenseursPassifs.Senseur.Parametres.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'SenseurPassifs_Senseur_Parametres' });
  },
});

FlowRouter.route('/SenseursPassifs/:noeud/:senseur/historique', {
  name: 'SenseursPassifs.Senseur.Historique.show',
  action() {
    BlazeLayout.render('App_3colonnes', { main: 'SenseursPassifs_Senseur_Historique' });
  },
});

// Application 3 3colonnes
FlowRouter.route('/principal', {
  name: 'Principale.show',
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
