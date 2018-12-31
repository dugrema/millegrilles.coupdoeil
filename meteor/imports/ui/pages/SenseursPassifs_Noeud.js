import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import { menuCourant, MenuSenseursPassifs } from '../layouts/menuHelpers.js';

import './SenseursPassifs_Noeud.html'

Template.SenseurPassifs_Noeud.onCreated(function bodyOnCreated() {
  Meteor.subscribe('noeuds');
  Meteor.subscribe('senseurs');
});

Template.SenseurPassifs_Noeud.onRendered(function preparerMenu() {
  var menuNoeud = MenuSenseursPassifs.clone();
  let parametres = {
    noeud: FlowRouter.getParam('noeud')
  };

  menuNoeud.setParent('SenseursPassifs.show');
  menuNoeud.ajouterMenuItem('SenseursPassifs.Noeud.show', 'fa-sliders', 'Noeud', 2, parametres);
  menuCourant.set(menuNoeud);
});

Template.SenseurPassifs_Noeud.helpers({
  noeud() {
    let noeud = FlowRouter.getParam('noeud');

    return SenseursPassifs.findOne({
      '_mg-libelle': 'noeud.individuel',
      'noeud': noeud
    });
  },
});

Template.SenseurPassifs_Noeud_Show.helpers({
  derniere_modification(noeud) {
    if(noeud === undefined) {
      return null;
    }
    let derniereModification = noeud['_mg-derniere-modification'];
    return moment(derniereModification).format("MMM-DD HH:mm:ss");
  },
  compte_senseurs(noeud) {
    if(noeud === undefined) {
      return 0;
    }
    return Object.keys(noeud['dict_senseurs']).length;
  },
  senseurs(noeud){
    // Preparer une liste de tous les senseurs du noeuds. Injecter le
    // no_senseur dans la liste (cle du dict). Aussi passer une reference
    // vers le noeud.
    var liste = [];
    for(var no_senseur in noeud.dict_senseurs) {
      var dict = {};
      dict['no_senseur'] = no_senseur; // Cle du dictionnaire, on l'ajoute a la liste
      dict['noeud'] = noeud; // Reference vers le noeud

      var valeurs_senseur = noeud.dict_senseurs[no_senseur]
      for(var cle_valeurs in valeurs_senseur) {
        var info_senseur = valeurs_senseur[cle_valeurs];
        dict[cle_valeurs] = info_senseur;
      }

      liste.push(dict);
    }

    // Trier la liste par location
    liste = liste.sort(function (senseur_a, senseur_b) {
      let loc_a = senseur_a['location'],
          loc_b = senseur_b['location'];

      if(loc_a === loc_b) {
        // Les deux locations peuvent etre undefined. Trier par numero senseur.
        let no_senseur_a = senseur_a.no_senseur,
            no_senseur_b = senseur_b.no_senseur;
        return no_senseur_a - no_senseur_b;
      }

      // Traiter le cas ou seul loc_a est undefined
      if(loc_a === undefined) return 1;  // loc_a !== loc_b, est undefined
      return loc_a.localeCompare(loc_b);
    });

    return liste;
  },
});

Template.SenseurPassifs_Senseur_Show.helpers({
  humidite_existe(senseur){
    return senseur.humidite > 0;
  },
  pression_existe(senseur){
    return senseur.pression > 0;
  },
  libelle_senseur(senseur){
    if(senseur.location !== undefined) return senseur.location;
    return 'Senseur ' + senseur.no_senseur;
  },
});
