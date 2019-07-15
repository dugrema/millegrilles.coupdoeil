import React from 'react';

// CSS pour l'application
import './Ecran.css';
import './w3.css';
import './w3-theme-blue-grey.css';
import './font-awesome.min.css';
import webSocketManager from './WebSocketManager';

import dateformatter from './formatters';

class NavBar extends React.Component {

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
          <MenuGauche/>
          <ContenuDomaine/>
        </div>
      </div>
    );
  }
}

function AfficherNoeuds(props) {
  const noeuds = props.listeNoeuds;

  const liste = [];
  if(noeuds) {
    noeuds.map(noeud=>{

      const senseurs = [];
      for(var noSenseur in noeud.dict_senseurs) {
        let senseur = noeud.dict_senseurs[noSenseur];
        let date_formattee = dateformatter.format_monthhour(senseur.temps_lecture);

        senseurs.push(
          <li key="{noSenseur}" className="senseur">
            <div className="location">
              {senseur.location}
            </div>
            <div className="numerique temperature">{senseur.temperature}&deg;C</div>
            <div className="numerique humidite">{senseur.humidite}%</div>
            <div className="numerique pression">{senseur.pression} kPa</div>
            <div className="temps">{date_formattee}</div>
          </li>
        );
      }

      const date_derniere_modification = dateformatter.format_monthhour(noeud['_mg-derniere-modification']);
      liste.push(
        <div key="{noeud.noeud}" className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h6 className="w3-opacity">
              Noeud {noeud.noeud}
            </h6>
            <div>
              Dernière modification: {date_derniere_modification}
            </div>
            <ul className="listeSenseurs">
              {senseurs}
            </ul>
          </div>
        </div>
      );

      return liste;
    });

  }

  return (
    <div className="w3-col m9">
      <div className="w3-row-padding">
        <div className="w3-col m12">
          <h1>Domaine SenseursPassifs</h1>
          {liste}
        </div>
      </div>
    </div>
  )
}

class ContenuDomaine extends React.Component {

  state = {
    listeNoeuds: null
  }

  // Configuration statique du composant:
  //   subscriptions: Le nom des routing keys qui vont etre ecoutees
  config = {
    subscriptions: ['noeuds.source.millegrilles_domaines_SenseursPassifs.documents']
  }

  processDocument = (doc) => {

  }

  componentDidMount() {
    // console.log('Socket connecte: ' + webSocketManager.getWebSocket().id);

    let requeteDocumentInitial =  {
      'requetes': [{
        'filtre': {'_mg-libelle': 'noeud.individuel'}
      }]};

    // Enregistrer les routingKeys, demander le document initial.
    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.SenseursPassifs', requeteDocumentInitial)
    .then( docInitial => {
      // console.log("Recu doc noeuds");

      let resultatsNoeuds = docInitial[0];
      // console.log("Noeuds: ");
      // console.log(resultatsNoeuds);

      this.setState({'listeNoeuds': resultatsNoeuds});
    })
    .catch( err=>{
      console.error("Erreur chargement document initial");
      console.error(err);
    });
  }

  componentWillUmount() {

  }

  render() {
    return (
      <AfficherNoeuds listeNoeuds={this.state.listeNoeuds}/>
    )
  }
}

class Footer extends React.Component {

  render() {
    return (

      <footer className="w3-container w3-theme-d3 w3-padding-16">
        <h5>Coup D'Oeil version abcd.1234</h5>
        <p>
          Coup D'Oeil fait partie du groupe de logiciels
          <a href="https://www.millegrilles.com">MilleGrilles</a>.
        </p>
        <p className="w3-container w3-theme-d5">
            Powered by <a href="https://www.w3schools.com/w3css/default.asp" target="_blank" rel="noopener noreferrer">w3.css</a>,
             Meteor, node.js, MongoDB, RabbitMQ, Python, nginx, docker, letsencrypt,
             d3, RaspberryPi, Intel Xeon, Debian, Font Awesome, git.
        </p>
      </footer>
    );
  }

}

class MenuGauche extends React.Component {
  render() {
    return (
      <div className="w3-col m3">
        <MenuGaucheTop/>
        <MenuGaucheListeDomaines/>
        <MenuGaucheNavigation/>
      </div>
    );
  }
}

class MenuGaucheTop extends React.Component {
  render() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container">
          <h4 className="w3-center">DEV2</h4>
         <hr/>
         <p>
           <i className="fa fa-home fa-fw w3-margin-right w3-text-theme"></i>
           dev2.maple.mdugre.info
         </p>
        </div>
      </div>
    );
  }
}

class MenuGaucheListeDomaines extends React.Component {
  render() {
    return (
      <div className="w3-card w3-round w3-white w3-hide-small">
        <div className="w3-container">
          <p>Domaines</p>
          <p>
            <span className="w3-tag w3-small w3-theme-d5 SenseursPassifs">SenseursPassifs</span>
            <span className="w3-tag w3-small w3-theme-d3 Notifications">Notifications</span>
          </p>
        </div>
      </div>
    );
  }
}

class MenuGaucheNavigation extends React.Component {
  render() {
    return(
      <div className="w3-card w3-round">
        <div className="w3-white menu-domaine-gauche">
          Boutons!
        </div>
      </div>
    );
  }
}

class EcranApp extends React.Component {

  componentDidMount() {
    // console.debug("Mounted!");
  }

  componentWillUnmount() {
    // console.debug("Demonte!");
  }

  render() {
    return (
      <div>
        <NavBar/>
        <Contenu/>
        <Footer/>
      </div>
    );
  }

}

export default EcranApp;
