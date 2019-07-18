import React from 'react';
import webSocketManager from './WebSocketManager';
import manifest from './manifest.build.js';  // App version, build date

// CSS pour l'application
import './Ecran.css';
import './w3.css';
import './w3-theme-blue-grey.css';
import './font-awesome.min.css';

// Importer les Domaines
import {SenseursPassifs} from './domaines/SenseursPassifs';

class EcranApp extends React.Component {
  // Classe principale de l'ecran de l'application
  // Conserve l'etat global utilisable dans toute l'application. Gere aussi
  // la navigation et les mises a jour globales.

  state = {
    configDocument: null,
    domaineActif: null
  }

  componentDidMount() {
    // Charger le document de configuration de la MilleGrille
    this.chargerDocumentPrincipale();
  }

  chargerDocumentPrincipale() {
    // Transmettre requete pour recevoir le document du senseur
    let requeteDocumentConfig =  {
      'requetes': [{
        'filtre': {
          '_mg-libelle': 'configuration'
        }
      }]};

    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.Principale', requeteDocumentConfig)
    .then( docInitial => {
      // console.debug("Recu doc");
      let resultats = docInitial[0][0];
      // console.debug(resultats);
      this.setState({configDocument: resultats});
    })
    .catch( err=>{
      console.error("Erreur chargement document initial");
      console.error(err);
    });
  }

  componentWillUnmount() {
    // console.debug("Demonte!");
  }

  changerDomaine = (domaine) => {
    this.setState({domaineActif: domaine});
  }

  render() {
    return (
      <div>
        <NavBar configDocument={this.state.configDocument}/>
        <Contenu
          configDocument={this.state.configDocument}
          domaineActif={this.state.domaineActif}
          changerDomaine={this.changerDomaine}/>
        <Footer/>
      </div>
    );
  }

}

class NavBar extends React.Component {
  // Barre de navigation dans le haut de l'ecran

  render() {
    return (
      <div className="w3-top">
       <div className="w3-bar w3-theme-d2 w3-left-align w3-large">
        <button className="w3-bar-item w3-button w3-hide-medium w3-hide-large w3-right w3-padding-large w3-hover-white w3-large w3-theme-d2">
          <i className="fa fa-bars"></i>
        </button>
        <button className="w3-bar-item w3-button w3-padding-large w3-theme-d4 Principal">
          <i className="fa fa-home w3-margin-right"></i>
          Coup D'Oeil
        </button>
        <button className="w3-bar-item w3-button w3-hide-small w3-padding-large w3-hover-white" title="Mes tâches">
          <i className="fa fa-calendar-check-o"></i>
        </button>
       </div>
      </div>
    );
  }
}

class Contenu extends React.Component {

  render() {
    return (
      <div className="w3-container w3-content divtop">
        <div className="w3-row">
          <MenuGauche configDocument={this.props.configDocument}/>
          <SenseursPassifs />
        </div>
      </div>
    );
  }
}

class Footer extends React.Component {

  render() {
    return (
      <footer>
        <div className="w3-container w3-theme-d3 w3-padding-small">
          <h5>Coup D'Oeil version <span title={manifest.date}>{manifest.version}</span></h5>
            Coup D'Oeil fait partie du groupe de
            logiciels <a href="https://www.millegrilles.com">MilleGrilles</a>.
        </div>
        <div className="w3-container w3-theme-d5">
            Powered by <a href="https://www.w3schools.com/w3css/default.asp" target="_blank" rel="noopener noreferrer">w3.css</a>,
             Meteor, node.js, MongoDB, RabbitMQ, Python, nginx, docker, letsencrypt,
             d3, RaspberryPi, Intel Xeon, Debian, Font Awesome, git.
        </div>
      </footer>
    );
  }

}

class MenuGauche extends React.Component {
  render() {
    return (
      <div className="w3-col m3">
        <MenuGaucheTop configDocument={this.props.configDocument}/>
        <MenuGaucheListeDomaines configDocument={this.props.configDocument}/>
        <MenuGaucheNavigation/>
      </div>
    );
  }
}

class MenuGaucheTop extends React.Component {

  render() {
    const configDocument=this.props.configDocument;
    var nomMillegrille='N.D.', urlMilleGrille='N.D.';
    if(this.props.configDocument) {
      nomMillegrille = configDocument.nom_millegrille;
      urlMilleGrille = configDocument.adresse_url_base;
    }

    return (
      <div className="w3-card w3-round w3-white w3-card_BR">
        <div className="w3-container">
          <h4 className="w3-center">{nomMillegrille}</h4>
         <hr/>
         <p>
           <i className="fa fa-home fa-fw w3-margin-right w3-text-theme"></i>
           {urlMilleGrille}
         </p>
        </div>
      </div>
    );
  }
}

class MenuGaucheListeDomaines extends React.Component {

  render() {
    const configDocument=this.props.configDocument;
    const listeDomaines = [];

    if(configDocument && configDocument.domaines) {
      for(var idx in configDocument.domaines) {
        const domaine = configDocument.domaines[idx];
        let classe_rang = 'w3-tag w3-small w3-theme-d' + domaine.rang;
        listeDomaines.push((
          <span
            key={domaine.description}
            className={classe_rang}>{domaine.description}</span>
        ));
      }
    }

    return (
      <div className="w3-card w3-round w3-white w3-hide-small w3-card_BR">
        <div className="w3-container">
          <p>Domaines</p>
          <p>
            {listeDomaines}
          </p>
        </div>
      </div>
    );
  }
}

class MenuGaucheNavigation extends React.Component {
  render() {
    return(
      <div className="w3-card w3-round w3-card_BR">
        <div className="w3-white menu-domaine-gauche">
          Boutons!
        </div>
      </div>
    );
  }
}

export default EcranApp;
