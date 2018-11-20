import { Template } from 'meteor/templating';

import { SenseursPassifs } from '../api/mgdomaines_appareils_SenseursPassifs.js';

import './body.html';

Template.body.helpers({
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
      var loc_a = senseur_a['location'];
      var loc_b = senseur_b['location'];
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
