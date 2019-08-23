import React from 'react';
import webSocketManager from './WebSocketManager';
import manifest from './manifest.build.js';  // App version, build date

// CSS pour l'application
import './Ecran.css';
import './w3.css';
import './w3-theme-blue-grey.css';
import 'font-awesome/css/font-awesome.min.css';

// Importer les Domaines et creer la liste des domaines connus
import {SenseursPassifs} from './domaines/SenseursPassifs';
import {GrosFichiers} from './domaines/GrosFichiers';
import {InterfacePrincipale} from './domaines/Principale.js';

const domainesConnus = {
  'SenseursPassifs': SenseursPassifs,
  'GrosFichiers': GrosFichiers,
  'Principale': InterfacePrincipale,
};

class EcranApp extends React.Component {
  // Classe principale de l'ecran de l'application
  // Conserve l'etat global utilisable dans toute l'application. Gere aussi
  // la navigation et les mises a jour globales.

  state = {
    configDocument: null,
    domaineActif: 'SenseursPassifs'
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

  changerDomaine = (event) => {
    const domaine = event.currentTarget.dataset.domaine;
    // console.debug('Domaine change vers: ' + domaine);
    if(domaine) {
      this.setState({domaineActif: domaine});
    }
  }

  changerMenuGauche = (menu) => {
    this.setState({menuGauche: menu});
  }

  render() {
    return (
      <div>
        <NavBar configDocument={this.state.configDocument}/>
        <SectionContenu
          configDocument={this.state.configDocument}
          domaineActif={this.state.domaineActif}
          changerDomaine={this.changerDomaine}
          changerMenuGauche={this.changerMenuGauche}/>
      </div>
    );
  }

}

function SectionContenu(props) {
  // Contenu de l'application: Menu de gauche et section domaine
  // Section principale, au milieu de l'ecran

  const domaine = props.domaineActif;
  var SectionDomaine;
  if(domaine && domainesConnus[domaine]) {
    SectionDomaine = domainesConnus[domaine];
  }

  return (
    <div className="w3-container w3-content divtop">
      <div className="w3-row">
        <MenuGauche
          {...props.configDocument}
          domaineActif={props.domaineActif}
          changerDomaine={props.changerDomaine}
        />
        <SectionDomaine
          changerMenuGauche={props.changerMenuGauche}
        />
      </div>
    </div>
  );

}

class NavBar extends React.Component {
  // Barre de navigation dans le haut de l'ecran

  state = {
  }

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

function Footer(props) {
  // Section du bas de l'ecran d'application
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

function MenuGauche(props) {
  return (
    <div className="w3-col m3">
      <MenuGaucheTop {...props}/>
      <MenuGaucheNavigation
        {...props}
        />
    </div>
  );
}

function MenuGaucheTop(props) {

  return (
    <div className="w3-card w3-round w3-white w3-card_BR">
      <div className="w3-container">
        <h4 className="w3-center">{props.domaineActif}</h4>
       <hr/>
       <p>
         <i className="fa fa-home fa-fw w3-margin-right w3-text-theme"></i>
         {props.nom_millegrille}
       </p>
      </div>
    </div>
  );
}

function MenuGaucheNavigation(props) {

  const listeDomaines = [], listeDomainesInconnus = [];

  if(props.domaines) {
    for(var idx in props.domaines) {
      const domaine = props.domaines[idx];
      let classe_rang = 'w3-tag w3-small w3-theme-d' + domaine.rang;

      // '<button class="w3-button w3-block w3-theme-l%NIVEAU% w3-left-align bouton-menu-gauche">'
      // + '<!-- route="%ROUTE%" -->'
      // + '<i class="fa %ICON% fa-fw w3-margin-right"></i>'
      // + '%LIBELLE%'
      // + '</button>';
      // let item = this.menuItems[item_idx];
      // let menu_item_html = this.menu_item_template
      //   .replace(/%ROUTE%/, item['route'])
      //   .replace(/%ICON%/, item['icon'])
      //   .replace(/%LIBELLE%/, item['libelle'])
      //   .replace(/%NIVEAU%/, item['niveau']+1);
      // MenuPrincipale.ajouterMenuItem('Principale.show', 'fa-globe', 'Sommaire');
      // MenuPrincipale.ajouterMenuItem('Principale.parametres.show', 'fa-sliders', 'Paramètres');
      // MenuPrincipale.setInitialise();
      // MenuSenseursPassifs.ajouterMenuItem('SenseursPassifs.show', 'fa-globe', 'Liste noeuds');
      // MenuSenseursPassifs.ajouterMenuItem('SenseursPassifs.Configuration.show', 'fa-sliders', 'Configuration');

      // Verifier si le domaine est charge
      if(domainesConnus[domaine.description]) {
        // <span
        //   key={domaine.description}
        //   className={classe_rang}
        //   onClick={props.changerDomaine}
        //   data-domaine={domaine.description}
        // >{domaine.description}</span>

        var className = 'w3-button w3-block w3-theme-l3 w3-left-align bouton-menu-gauche';
        listeDomaines.push((
          <button
            key={domaine.description}
            className={className}
            onClick={props.changerDomaine}
            data-domaine={domaine.description}
          >
            <i className="fa fa-sliders fa-fw w3-margin-right"></i>
            {domaine.description}
          </button>

        ));
      }
      else {
        console.debug("Domaine inconnu: " + domaine.description);
      //   listeDomainesInconnus.push((
      //     <span
      //       key={domaine.description}
      //       className={classe_rang}
      //     >{domaine.description}</span>
      //   ));
      }

    }
  }

  const menu = (
    <div className="w3-white menu-domaine-gauche">
      <button key='Domaines' className='w3-button w3-block w3-theme-l1 w3-left-align bouton-menu-gauche'>
        <i className="fa fa-sliders fa-fw w3-margin-right"></i>
        Domaines
      </button>
      {listeDomaines}
    </div>
  );

  return (
    <div className="w3-card w3-round">
        {menu}
    </div>
  );
}

export default EcranApp;
