import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

import './FichiersUI.css';

var mapMimeType = {
  'application/excel': 'fa-file-excel-o',
  'application/json': 'fa-file-code-o',
  'application/pdf': 'fa-file-pdf-o',
  'application/text': 'fa-file-text-o',
  'application/word': 'fa-file-word-o',
  'image/jpeg': 'fa-file-image-o',
}

class PanneauFichiersIcones extends React.Component {

  state = {
    menuContextuel: null,
    elementsSelectionnes: {},
  }

  preparerRepertoires() {
    let repertoires = this.props.repertoires;

    // Extraire et trier les repertoires
    let repertoiresTries = this.trierListe(repertoires);

    // Faire le rendering
    let listeRendered = [];
    repertoiresTries.forEach(repertoire=>{
      let classNameRepertoire = '';
      if(this.state.elementsSelectionnes[repertoire.repertoire_uuid]) {
        classNameRepertoire = classNameRepertoire + ' selectionne';
      }

      listeRendered.push(
        <div
          key={repertoire.repertoire_uuid}
          className={classNameRepertoire}
          onClick={this.clickSelection}
          data-repertoireuuid={repertoire.repertoire_uuid}
        >
          <span className="fa-stack fa-2x">
            <i className="fa fa-folder-open fa-stack-2x fond"></i>
            <i className="fa fa-folder-open-o fa-stack-2x"></i>
          </span>
          <p>{repertoire.nom}</p>
        </div>
      );
    });

    return listeRendered;
  }

  activerMenuContextuel = (event) => {
    event.preventDefault(); // Empecher le menu contextuel du navigateur.

    // Detecter le contexte
    let dataset = event.currentTarget.dataset;
    let positionX=event.clientX, positionY=event.clientY;
    console.debug("Contextuel position X=" + positionX + ", Y=" + positionY);

    if(dataset.fichieruuid) {
      // C'est un fichier. On render le popup de fichier.

    } else if(dataset.repertoireuuid) {
      // C'est un repertoire. On render le popup du repertoire.

    }

  }

  clickSelection = (event) => {
    event.stopPropagation(); // Empeche cascade vers background.

    // Selectionne l'element
    let dataset = event.currentTarget.dataset;
    if(dataset.fichieruuid) {
      let fichierUuid = dataset.fichieruuid;

      let infoFichier = {};
      infoFichier[fichierUuid] = {type: 'fichier'};
      if(event.ctrlKey) {
        // Si CTRL est utilise, on ajoute la selection
        infoFichier = Object.assign(
          this.state.elementsSelectionnes, infoFichier);
      }

      this.setState({elementsSelectionnes: infoFichier},
      ()=>{console.debug("Fichier ajoute a selection: " + fichierUuid)});

    } else if(dataset.repertoireuuid) {
      let repertoireUuid = dataset.repertoireuuid;

      let infoRepertoire = {};
      infoRepertoire[repertoireUuid] = {type: 'repertoire'};
      if(event.ctrlKey) {
        infoRepertoire = Object.assign(
          this.state.elementsSelectionnes, infoRepertoire);
      }

      this.setState({elementsSelectionnes: infoRepertoire},
      ()=>{console.debug("Repertoire ajoute a selection: " + repertoireUuid)});

    }

  }

  clickBackground = (event) => {
    console.debug("Click background, reset tout");
    // Clear les selections et menu contextuel.
    this.setState({
      menuContextuel: null,
      elementsSelectionnes: [],
    });
  }

  preparerFichiers() {
    let fichiers = this.props.fichiers;

    // Extraire et trier les repertoires
    let fichiersTries = this.trierListe(fichiers);

    // Faire le rendering
    let listeRendered = [];
    fichiersTries.forEach(fichier=>{
      let classNameFichier = '';
      if(this.state.elementsSelectionnes[fichier.uuid]) {
        classNameFichier = classNameFichier + ' selectionne';
      }
      let icone = this.determinerIconeFichier(fichier);
      listeRendered.push(
        <div
          className={classNameFichier}
          key={fichier.uuid}
          onClick={this.clickSelection}
          onDoubleClick={this.props.doubleclickFichier}
          onContextMenu={this.activerMenuContextuel}
          data-fichieruuid={fichier.uuid}
        >
          <i className={icone}></i>
          <p>{fichier.nom}</p>
        </div>
      );
    });

    return listeRendered;
  }

  determinerIconeFichier(fichier) {
    let mimetype = fichier.mimetype;
    let icone = mapMimeType[mimetype];
    if(!icone) {
      icone = 'fa-file-o'; // Par defaut un icone generique
    }

    return 'fa ' + icone + ' fa-5x';
  }

  trierListe(items) {
    let listeTriee = [];
    for(var item_uuid in items) {
      let item = items[item_uuid];
      listeTriee.push(item);
    }
    listeTriee.sort((a,b)=>{
      let nomA=a.nom, nomB=b.nom;
      return nomA.localeCompare(nomB);
    })
    return listeTriee;
  }

  render() {
    let repertoires = this.preparerRepertoires();
    let fichiers = this.preparerFichiers();

    return (
      <div
        className="PanneauFichiersIcones"
        onClick={this.clickBackground}
      >
        {repertoires}
        {fichiers}
      </div>
    );
  }
}

class PanneauFichiersListeDetaillee extends React.Component {

  render() {
    return (
      <p>Liste</p>
    );
  }
}

export {PanneauFichiersIcones, PanneauFichiersListeDetaillee};
