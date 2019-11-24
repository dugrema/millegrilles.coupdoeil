import React from 'react';

export class ActionsCarnet {

  constructor(reactModule) {
    this.reactModule = reactModule;
  }

  toggle(uuid, opt) {
    let carnet = this.reactModule.state.carnet;

    // Le carnet genere une nouvelle instance a chaque operation
    carnet = carnet.toggle(uuid, opt);

    this.reactModule.setState({carnet});
  }

}

export class AffichageCarnet extends React.Component {

}

export class Carnet {

  selection = {};
  taille = 0;

  ajouter(uuidelement, opts) {
    if(!opts) {
      opts = {};
    }
    // Cloner carnet et dict de fichiers
    let carnet = new Carnet();
    carnet = Object.assign(carnet, this);
    let selection = Object.assign({}, carnet.selection);
    carnet.selection = selection;

    // Ajouter fichier
    carnet.selection[uuidelement] = opts;

    console.debug("Selection actuelle carnet, ajout de " + uuidelement);
    console.debug(carnet.selection);

    carnet.taille = this.calculerTaille(carnet);

    return carnet;
  }

  toggle(uuidelement, opts) {
    if(!opts) {
      opts = {};
    }
    // Cloner carnet et dict de fichiers
    let carnet = new Carnet();
    carnet = Object.assign(carnet, this);
    let selection = Object.assign({}, carnet.selection);
    carnet.selection = selection;

    if(!carnet.selection[uuidelement]) {
      // Ajouter fichier/collection
      carnet.selection[uuidelement] = opts;
      console.debug("Selection actuelle carnet, ajout de " + uuidelement);
    } else {
      // Enlever fichier/collection
      delete carnet.selection[uuidelement];
      console.debug("Selection actuelle carnet, retrait de " + uuidelement);
    }

    console.debug(carnet.selection);

    carnet.taille = this.calculerTaille(carnet);

    return carnet;
  }

  calculerTaille(carnet) {
    return Object.keys(carnet.selection).length;
  }
}
