import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../../api/mgdomaines_appareils_SenseursPassifs.js';

import './noeuds.html';

Template.Noeuds_show_page.onCreated(function noeudsOnCreated() {
  Meteor.subscribe('noeuds');
});

Template.Noeuds_show_page.helpers({
  noeuds() {
    return SenseursPassifs.find({'_mg-libelle': 'noeud.individuel'});
  },
});

Template.sectionSenseurs.helpers({
  senseurs(){
    // Preparer une liste de tous les senseurs du noeuds. Injecter le
    // no_senseur dans la liste (cle du dict). Aussi passer une reference
    // vers le noeud.
    var liste = [];
    for(var no_senseur in this.dict_senseurs) {
      var dict = {};
      dict['no_senseur'] = no_senseur; // Cle du dictionnaire, on l'ajoute a la liste
      dict['noeud'] = this; // Reference vers le noeud

      var valeurs_senseur = this.dict_senseurs[no_senseur]
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

      // Traiter le cas ou loc_a est undefined
      if(loc_a === loc_b) return 0;  // Les deux objets peuvent etre undefined.
      if(loc_a === undefined) return 1;  // loc_a !== loc_b, est undefined
      return loc_a.localeCompare(loc_b);
    });

    return liste;
  },
});

Template.senseur.helpers({
  humidite_existe(){
    return this.humidite > 0;
  },
  pression_existe(){
    return this.pression > 0;
  },
});
