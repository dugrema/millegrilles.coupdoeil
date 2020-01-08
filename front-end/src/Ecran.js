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
       // console.debug('Domaine change vers: ' + domaine);
      if(domaine) {
        if(domaine !== this.state.navigationState.domaineActif) {
          this.setState({navigationState: {domaineActif: domaine}});
        } else {
          // L'usager a clique sur le meme domaine que celui deja charge.
          // On force un toggle du domaine, brut mais effectif.
          this.setState({navigationState: {domaineActif: null}}, ()=>{
            this.setState({navigationState: {domaineActif: domaine}});
          });
        }
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
          '_mg-libelle': {'$in': ['domaines', 'profil.millegrille']}
        }
      }]};

    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.Principale', requeteDomaines)
    .then( docInitial => {
      // console.debug("Recu doc");
      let resultats = docInitial[0];
      // console.debug(resultats);
      const documentsConfig = {};
      for(let idx in resultats) {
        let resultat = resultats[idx];

        if(resultat['_mg-libelle'] === 'domaines') {
          documentsConfig.documentDomaines = resultat;
        } else if(resultat['_mg-libelle'] === 'profil.millegrille') {
          documentsConfig.documentIdMillegrille = resultat;
        }
      }

      this.setState(documentsConfig);
    })
    .catch( err=>{
      console.error("Erreur chargement document liste domaines");
      console.error(err);
    });

    let requeteIdMillegrille =  {
      'requetes': [{
        'filtre': {
          '_mg-libelle': 'profil.millegrille'
        }
      }]};
    webSocketManager.transmettreRequete(
      'requete.millegrilles.domaines.Principale', requeteIdMillegrille)
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
          documentIdMillegrille={this.state.documentIdMillegrille}
          documentDomaines={this.state.documentDomaines}
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
