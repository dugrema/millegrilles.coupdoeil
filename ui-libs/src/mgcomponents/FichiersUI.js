import React from 'react';
import 'font-awesome/css/font-awesome.min.css';

import './FichiersUI.css';

// Mapping entre les mimetype et l'icone a afficher.
const mapMimeTypeIcons = {
  'application/excel': 'fa-file-excel-o',
  'application/json': 'fa-file-code-o',
  'application/pdf': 'fa-file-pdf-o',
  'application/text': 'fa-file-text-o',
  'application/word': 'fa-file-word-o',
  'image/jpeg': 'fa-file-image-o',
}

class PanneauFichiersIcones extends React.Component {
  // Panneau qui affiche les repertoires et fichiers sous forme d'icone.
  // Props a fournir:
  //   - fichiers: dict de fichiers (uuid: {nom:, uuid:, ...})
  //   - repertoires: dict de repertoires (repertoire_uuid: {nom:, repertoire_uuid:, ...})
  //   + copier: (parametres selection, repertoireDestination)
  //   + deplacer: (parametres selection, repertoireDestination)
  //   + supprimer: (parametre selection)

  state = {
    menuContextuel: null,
    elementsSelectionnes: {},

    elementsCopierDeplacer: null,   // Liste d'elements a copier ou deplacer
    operationCopierDeplacer: null,  // Le type d'operation: copier ou deplacer
  }

  // Gestionnaire d'evenements

  activerMenuContextuel = (event) => {
    event.preventDefault(); // Empecher le menu contextuel du navigateur.
    event.stopPropagation(); // Empeche cascade vers background.

    // Detecter le contexte
    let dataset = event.currentTarget.dataset;
    let positionX=event.clientX, positionY=event.clientY;

    let uuidItem = dataset.fichieruuid || dataset.repertoireuuid;
    // Selectionner le fichier/repertoire s'il ne l'est pas deja
    if(!this.state.elementsSelectionnes[uuidItem]) {
      // Effacer selection courante et remplacer par le fichier courant
      this.clickSelection(event);
    }

    if(dataset.fichieruuid) {
      // C'est un fichier. On render le popup de fichier.
      this.setState({menuContextuel: {
        type: 'fichier',
        repertoireuuid: dataset.fichieruuid,
        x: positionX,
        y: positionY,
      }})
    } else if(dataset.repertoireuuid) {
      // C'est un repertoire. On render le popup du repertoire.
      this.setState({menuContextuel: {
        type: 'repertoire',
        repertoireuuid: dataset.repertoireuuid,
        x: positionX,
        y: positionY,
      }})
    } else {
      this.setState({menuContextuel: {
        type: 'panneau',
        x: positionX,
        y: positionY,
      }})
    }

  }

  clickSelection = (event) => {
    event.stopPropagation(); // Empeche cascade vers background.

    this.setState({menuContextuel: null});

    let dataset = event.currentTarget.dataset;

    // Detecter si on a un fichier ou un repertoire (la logique est presque pareille)
    let uuidItem = dataset.fichieruuid || dataset.repertoireuuid;
    let infoDictValeur;
    if(dataset.fichieruuid) {
      infoDictValeur = {type: 'fichier'};
    } else if (dataset.repertoireuuid) {
      infoDictValeur = {type: 'repertoire'};
    }

    // Selectionne l'element
    let dejaSelectionne = this.state.elementsSelectionnes[uuidItem];

    let infoDict = {};
    if(!dejaSelectionne || !event.ctrlKey) {
      // Si le bouton controle est enfonce, permet de deselectionner l'item
      infoDict[uuidItem] = infoDictValeur;
    }
    if(event.ctrlKey) {
      // Le bouton CTRL est enfonce. On conserve la selection existante.
      for(var uuid in this.state.elementsSelectionnes) {
        if(uuid !== uuidItem) {
          infoDict[uuid] = this.state.elementsSelectionnes[uuid];
        }
      }
    }

    this.setState({elementsSelectionnes: infoDict});

  }

  clickBackground = (event) => {
    // Clear les selections et menu contextuel.
    this.setState({
      menuContextuel: null,
      elementsSelectionnes: [],
    });
  }

  activerCopier = (event) => {
    // Conserve la selection dans le buffer copier
    this.setState({
      elementsCopierDeplacer: this.state.elementsSelectionnes,
      operationCopierDeplacer: 'copier',
    });
  }

  activerDeplacer = (event) => {
    // Conserve la selection dans le buffer deplacer (couper)
    this.setState({
      elementsCopierDeplacer: this.state.elementsSelectionnes,
      operationCopierDeplacer: 'deplacer',
    });
  }

  copier = repertoireDestination => {
    // Deleguer au handler du contenant parent
    this.props.copier(this.state.elementsCopierDeplacer, repertoireDestination);
  }

  deplacer = repertoireDestination => {
    // Deleguer au handler du contenant parent
    this.props.deplacer(this.state.elementsCopierDeplacer, repertoireDestination);
    // Les items sont deplaces, on ne peut pas repeter l'operation.
    this.setState({elementsCopierDeplacer: null, operationCopierDeplacer: null});
  }

  supprimer = event => {
    // Deleguer au handler du contenant parent
    this.props.supprimer(this.state.elementsSelectionnes);
    this.setState({elementsSelectionnes: null});
  }

  // Methodes utilitaire

  determinerIconeFichier(fichier) {
    let mimetype = fichier.mimetype;
    let icone = mapMimeTypeIcons[mimetype];
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

  // Methodes de rendering du panneau

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
          onContextMenu={this.activerMenuContextuel}
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

  render() {
    let repertoires = this.preparerRepertoires();
    let fichiers = this.preparerFichiers();
    let menuContextuel = null;
    if(this.state.menuContextuel) {
      menuContextuel = (
        <MenuContextuel
          parametres={this.state.menuContextuel}
          elementsSelectionnes={this.state.elementsSelectionnes}
          operationCopierDeplacer={this.state.operationCopierDeplacer}
          activerCopier={this.activerCopier}
          activerDeplacer={this.activerDeplacer}
          copier={this.copier}
          deplacer={this.deplacer}
          supprimer={this.supprimer}
          />
      )
    }

    return (
      <div
        className="PanneauFichiersIcones"
        onClick={this.clickBackground}
        onContextMenu={this.activerMenuContextuel}
      >
        {repertoires}
        {fichiers}
        {menuContextuel}
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

class MenuContextuel extends React.Component {

  coller = event => {
    // Copier ou deplacer les items dans le buffer.
    let repertoireDestination = this.props.parametres.repertoireuuid;

    let operation = this.props.operationCopierDeplacer;
    if(operation === 'copier') {
      this.props.copier(repertoireDestination);
    } else if(operation === 'deplacer') {
      this.props.deplacer(repertoireDestination);
    }
  }

  renderMenuPanneau() {
    let copierOuCouperExiste = this.props.operationCopierDeplacer;

    let boutonColler = null;
    if(copierOuCouperExiste) {
      boutonColler = (
        <li>
          <button onClick={this.coller}>
            <i className="fa fa-paste"></i> Coller
          </button>
        </li>
      );
    }

    return (
      <ul>
        {boutonColler}
        <li>
          <button>
            <i className="fa fa-edit"></i> Proprietes
          </button>
        </li>
      </ul>
    );
  }

  renderMenuFicher() {
    return (
      <ul>
        <li>
          <button onClick={this.props.activerCopier}>
            <i className="fa fa-copy"></i> Copier
          </button>
        </li>
        <li>
          <button onClick={this.props.activerDeplacer}>
            <i className="fa fa-cut"></i> Couper
          </button>
        </li>
        <li>
          <button onClick={this.props.supprimer}>
            <i className="fa fa-eraser"></i> Supprimer
          </button>
        </li>
        <li>
          <button>
            <i className="fa fa-edit"></i> Proprietes
          </button>
        </li>
      </ul>
    );
  }

  renderMenuRepertoire() {

    let copierOuCouperExiste = this.props.operationCopierDeplacer;

    let boutonColler = null;
    if(copierOuCouperExiste) {
      boutonColler = (
        <li>
          <button onClick={this.coller}>
            <i className="fa fa-paste"></i> Coller
          </button>
        </li>
      );
    }

    return (
      <ul>
        <li>
          <button onClick={this.props.activerCopier}>
            <i className="fa fa-copy"></i> Copier
          </button>
        </li>
        <li>
          <button onClick={this.props.activerDeplacer}>
            <i className="fa fa-cut"></i> Couper
          </button>
        </li>
        {boutonColler}
        <li>
          <button onClick={this.props.supprimer}>
            <i className="fa fa-eraser"></i> Supprimer
          </button>
        </li>
        <li>
          <button>
            <i className="fa fa-edit"></i> Proprietes
          </button>
        </li>
      </ul>
    );
  }

  renderMenuMultiSelection() {
    return (
      <ul>
        <li>
          <button onClick={this.props.activerCopier}>
            <i className="fa fa-copy"></i> Copier
          </button>
        </li>
        <li>
          <button onClick={this.props.activerDeplacer}>
            <i className="fa fa-cut"></i> Couper
          </button>
        </li>
        <li>
          <button onClick={this.props.supprimer}>
            <i className="fa fa-eraser"></i> Supprimer
          </button>
        </li>
      </ul>
    );
  }

  render() {
    let parametres = this.props.parametres;

    let styleMenu = {
        left: parametres.x,
        top: parametres.y,
      };

    // Determiner le type de menu a afficher
    let renderedMenu;
    if(Object.keys(this.props.elementsSelectionnes).length > 1) {
      renderedMenu = this.renderMenuMultiSelection();
    } else if(parametres['type'] === 'panneau') {
      renderedMenu = this.renderMenuPanneau();
    } else if(parametres['type'] === 'repertoire') {
      renderedMenu = this.renderMenuRepertoire();
    } else if(parametres['type'] === 'fichier') {
      renderedMenu = this.renderMenuFicher();
    }

    return (
      <nav className="context-menu" style={styleMenu}>
        {renderedMenu}
      </nav>
    );
  }

}

export {PanneauFichiersIcones, PanneauFichiersListeDetaillee};
