import React from 'react';
import webSocketManager from './WebSocketManager';

// CSS pour l'application
import './Ecran.css';
import './w3.css';
import './w3-theme-blue-grey.css';
import 'font-awesome/css/font-awesome.min.css';

import {NavBar, SectionContenu} from './PagesNavigation';

class EcranApp extends React.Component {
  // Classe principale de l'ecran de l'application
  // Conserve l'etat global utilisable dans toute l'application. Gere aussi
  // la navigation et les mises a jour globales.

  state = {
    configDocument: null,

    navigationState: {
      domaineActif: null,
      pageActive: null,
    }
  }

  fonctionsNavigation = {
    afficherAccueil: () => {
      this.setState({
        navigationState: {
          domaineActif: null,
          pageActive: 'accueil',
        }
      });
    },

    afficherListeDomaines: () => {
      this.setState({
        navigationState: {
          domaineActif: null,
          pageActive: 'listeDomaines',
        }
      });
    },

    changerDomaine: (event) => {
      const domaine = event.currentTarget.dataset.domaine;
       console.debug('Domaine change vers: ' + domaine);
      if(domaine) {
        this.setState({navigationState: {domaineActif: domaine}});
      }
    },

    changerMenuGauche: (menu) => {
      this.setState({menuGauche: menu});
    }
  }

  componentDidMount() {
    // Charger le document de configuration de la MilleGrille
    this.chargerDocumentPrincipale();
  }

  chargerDocumentPrincipale() {
    // Transmettre requete pour recevoir le des domaines
    let requeteDomaines =  {
      'requetes': [{
        'filtre': {
          '_mg-libelle': 'domaines'
        }
      }]};

    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.Principale', requeteDomaines)
    .then( docInitial => {
      // console.debug("Recu doc");
      let resultats = docInitial[0][0];
      // console.debug(resultats);
      this.setState({documentDomaines: resultats});
    })
    .catch( err=>{
      console.error("Erreur chargement document liste domaines");
      console.error(err);
    });

    let requeteIdMillegrille =  {
      'requetes': [{
        'filtre': {
          '_mg-libelle': 'millegrille.id'
        }
      }]};
    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.Parametres', requeteIdMillegrille)
    .then( docInitial => {
      // console.debug("Recu doc");
      let resultats = docInitial[0][0];
      // console.debug(resultats);
      this.setState({documentIdMillegrille: resultats});
    })
    .catch( err=>{
      console.error("Erreur chargement document id millegrille");
      console.error(err);
    });

  }

  componentWillUnmount() {
    // console.debug("Demonte!");
  }

  render() {
    return (
      <div>
        <NavBar configDocument={this.state.configDocument}/>
        <SectionContenu
          configDocument={this.state.configDocument}
          changerDomaine={this.changerDomaine}
          changerMenuGauche={this.changerMenuGauche}
          fonctionsNavigation={this.fonctionsNavigation}
          {...this.state.navigationState}
          />
      </div>
    );
  }

}

export default EcranApp;
