import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { Feuille } from '../mgcomponents/Feuilles'

export class ActionsCarnet {

  constructor(reactModule) {
    this.reactModule = reactModule;
  }

  toggle = (uuid, opt) => {
    let carnet = this.reactModule.state.carnet;

    // Le carnet genere une nouvelle instance a chaque operation
    carnet = carnet.toggle(uuid, opt);
    // console.debug("Ajout carnet uuid: " + uuid);
    // console.debug(opt);
    this.reactModule.setState({carnet});
  }

  viderCarnet = () => {
    let carnet = this.reactModule.state.carnet;
    carnet = carnet.viderCarnet();
    this.reactModule.setState({carnet});
  }

}

export class AffichageCarnet extends React.Component {

  state = {
    pageCourante: 1,
    elementsParPage: 10,
  }

  creerCollection = event => {
    this.props.actionsCollections.creerCollection(this.props.carnet.selection);
  }

  supprimerDocument = event => {
    let uuid = event.currentTarget.value;
    this.props.actionsCarnet.toggle(uuid);
  }

  viderCarnet = event => {
    this.props.actionsCarnet.viderCarnet();
  }

  renderListeFichiers() {
    return (
      <Feuille>
        <Row>
          <Col md={10}>
            <h2>Contenu du carnet</h2>
          </Col>
          <Col md={2}>
            <Button onClick={this.creerCollection}>
              <span className="fa-stack fa-1g" title="Creer collection">
                <i className="fa fa-folder-o fa-stack-2x" />
                <i className="fa fa-plus fa-stack-1x" />
              </span>
            </Button>
            <Button onClick={this.viderCarnet} variant="danger">
              <span className="fa-stack fa-1g" title="Vider carnet">
                <i className="fa fa-folder-o fa-stack-2x" />
                <i className="fa fa-close fa-stack-1x" />
              </span>
            </Button>
          </Col>
        </Row>

        <div className="liste-fichiers">
          <GenererListeFichiers
            {...this.props}
            actions={{
              chargeruuid: this.props.actionsNavigation.chargeruuid,
              supprimerDocument: this.supprimerDocument,
            }}
            />
        </div>

      </Feuille>
    )

  }

  render() {
    return (
      <div>
        {this.renderListeFichiers()}
      </div>
    );
  }

}

function GenererListeFichiers(props) {
  let fichiersRendered = [];

  if( props.carnet.selection ) {
    let selection = props.carnet.selection;

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

    fichiersRendered = fichiers.map((fichier)=>{
      let icone = (<i className="fa fa-file-o icone-gauche"/>);
      if(fichier['_mg-libelle'] === 'collection') {
        icone = (<i className="fa fa-folder-o"/>);
      }

      return (
        <div key={fichier.uuid} className="w3-row-padding tableau-fichiers">

          <div className="w3-col m11">
            {icone}
            <button className="aslink" onClick={props.actions.chargeruuid} value={fichier.uuid}>
              {fichier.nom}
            </button>
          </div>

          <div className="w3-col m1">
            <button value={fichier.uuid} onClick={props.actions.supprimerDocument}>
              <i className="fa fa-remove" />
            </button>
          </div>

        </div>
      );
    });
  }

  return fichiersRendered;
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

  viderCarnet() {
    let carnet = new Carnet();
    carnet = Object.assign(carnet, this);
    carnet.selection = {};  // Vider la selection
    carnet.taille = 0;
    return carnet;
  }

  calculerTaille(carnet) {
    return Object.keys(carnet.selection).length;
  }
}
