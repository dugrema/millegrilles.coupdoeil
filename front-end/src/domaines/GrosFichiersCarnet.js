import React from 'react';

export class ActionsCarnet {

  constructor(reactModule) {
    this.reactModule = reactModule;
  }

  toggle = (uuid, opt) => {
    let carnet = this.reactModule.state.carnet;

    // Le carnet genere une nouvelle instance a chaque operation
    carnet = carnet.toggle(uuid, opt);
    console.debug("Ajout carnet uuid: " + uuid);
    console.debug(opt);

    this.reactModule.setState({carnet});
  }

}

export class AffichageCarnet extends React.Component {

  state = {
    pageCourante: 1,
    elementsParPage: 10,
  }

  supprimerDocument = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsCarnet.toggle(uuid);
  }

  changerPage = event => {
    let pageCourante = event.currentTarget.value;
    this.setState({pageCourante});
  }

  renderBoutonsPages() {
    let boutonsPages = [];
    if(this.props.carnet.selection) {
      let selection = this.props.carnet.selection;
      let nbPages = Math.ceil(Object.keys(selection).length / this.state.elementsParPage);

      for(let page=1; page<=nbPages; page++) {
        let cssCourante = '';
        if(this.state.pageCourante === ''+page) {
          cssCourante = 'courante';
        }
        boutonsPages.push(
          <button key={page} onClick={this.changerPage} value={page} className={cssCourante}>
            {page}
          </button>
        );
      }
    }
    return boutonsPages;
  }

  renderListeFichiers() {
    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">
          <div className="w3-rowpadding row-donnees">
            <div className="w3-col m11">
              <h2>Contenu du carnet</h2>
            </div>
            <div className="w3-col m1">
              <button>
                <span className="fa-stack fa-1g">
                  <i className="fa fa-folder-o fa-stack-2x" />
                  <i className="fa fa-plus fa-stack-1x" />
                </span>
              </button>
            </div>
          </div>

          <div className="liste-fichiers">
            {this.genererListeFichiers()}
          </div>

          <div className="bas-page">
            <div className="w3-col m12 boutons-pages">
              {this.renderBoutonsPages()}
            </div>
          </div>
        </div>
      </div>
    )

  }

  genererListeFichiers() {
    let fichiersRendered = [];

    if( this.props.carnet.selection ) {
      let premierElem = (this.state.pageCourante-1) * this.state.elementsParPage;
      let dernierElem = premierElem + this.state.elementsParPage; // (+1)

      let selection = this.props.carnet.selection;

      // Creer une liste de fichiers/collections et la trier
      let fichiers = [];
      for(let uuid in selection) {
        let opts = selection[uuid];
        fichiers.push({...opts, uuid});
      }
      fichiers.sort((a,b)=>{
        let nom_a = a['nom'];
        let nom_b = b['nom'];
        if(nom_a === nom_b) return 0;
        if(!nom_a) return 1;
        return nom_a.localeCompare(nom_b);
      })

      for(let idx = premierElem; idx < dernierElem && idx < fichiers.length; idx++) {
        let fichier = fichiers[idx];

        let icone = (<i className="fa fa-file-o icone-gauche"/>);
        if(fichier['_mg-libelle'] === 'collection') {
          icone = (<i className="fa fa-folder-o"/>);
        }

        fichiersRendered.push(
          <div key={fichier.uuid} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m11">
              {icone}
              <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
                {fichier.nom}
              </button>
            </div>

            <div className="w3-col m1">
              <button value={fichier.uuid} onClick={this.supprimerDocument}>
                <i className="fa fa-remove" />
              </button>
            </div>

          </div>
        );
      }
    }

    return fichiersRendered;
  }

  render() {
    return (
      <div>
        {this.renderListeFichiers()}
      </div>
    );
  }

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
