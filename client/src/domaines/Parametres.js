import React from 'react';
// import { Form, Container, Row, Col } from 'react-bootstrap';
// import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';
import { Feuille } from '../mgcomponents/Feuilles';
import { GestionEmailSmtp } from './ParametresGestionEmailSmtp';
import { NoeudsPublics } from './ParametresNoeudsPublics'
import { ParametresErreurs } from './ParametresErreurs'
import './Parametres.css';

class ActionsInterdites extends React.Component {

  fermerMilleGrille = event => {
    let transaction = {
    }
    let domaine = 'millegrilles.domaines.Parametres.fermerMilleGrilles';

    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });

  }


  render() {

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">

          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">Actions interdites</h2>

              <p>Dechire l&apos;étiquette de garantie de la MilleGrille</p>

              <ul>
                <li>
                  <button className="w3-red" onClick={this.fermerMilleGrille}>
                    Fermer la MilleGrille
                  </button>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export class Parametres extends React.Component {

  state = {
    parametreCourant: null,
    publiqueConfiguration: null,
  }

  sousPages = {
    'GestionEmailSmtp': GestionEmailSmtp,
    'ActionsInterdites': ActionsInterdites,
    NoeudsPublics, ParametresErreurs,
  }

  fonctionsNavigation = {
    retourParametres: () => {
      this.setState({parametreCourant: null});
    },
    afficherEcran: event => {
      let sousPage = this.sousPages[event.currentTarget.value];
      this.setState({parametreCourant: sousPage});
    }
  }

  fonctionsGestion() {
    return (
      <Feuille>
        <h2 className="w3-opacity">Parametres d&apos;administration de la MilleGrille</h2>

        <ul>
          <li>
            <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="NoeudsPublics">
              Noeuds publics
            </button>
            : Déploiements de la MilleGrille sur internet
          </li>
          <li>
            <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="ActionsInterdites">
              Actions interdites
            </button>
          </li>
          <li>
            <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="GestionEmailSmtp">
              Gerer serveurs de notification par courriel (SMTP)
            </button>
          </li>
          <li>
            <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="ParametresErreurs">
              Erreurs systeme
            </button>
          </li>
        </ul>
      </Feuille>
    );
  }

  render() {
    let contenu;
    if(this.state.parametreCourant) {
      let ModuleGestion = this.state.parametreCourant;

      contenu = (
        <ModuleGestion
          {...this.fonctionsNavigation} />
      );
    } else {
      contenu = (
        <div className="w3-col m12">
          {this.fonctionsGestion()}
        </div>
      )
    }

    return (

      <div className="w3-col m9">
        <div className="w3-row-padding">
            {contenu}
        </div>
      </div>
    )
  }

}
