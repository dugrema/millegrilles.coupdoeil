import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import manifest from '../manifest.build.js';  // App version, build date
import { solveRegistrationChallenge } from '@webauthn/client';
import webSocketManager from '../WebSocketManager';
import { Trans } from 'react-i18next';

import './Principale.css';

export class InterfacePrincipale extends React.Component {

  state = {
    ecranCourant: null,
  }

  fonctionsNavigation = {
    retourPrincipale: () => {
      this.setState({
        ecranCourant: null,
      });
    },
    afficherEcran: (event) => {
      this.setState({ecranCourant: event.currentTarget.value});
    },
  }

  version() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Information générale</h2>

          <ul>
            <li>
              Version de Coup D&apos;Oeil: <span title={manifest.date}>{manifest.version}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  fonctionsGestion() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Fonctions de gestion de votre MilleGrille</h2>

          <ul>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="information">
                Information usager et MilleGrille
              </button>
            </li>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherEcran} value="gestionTokens">
                Gerer les tokens de securite
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {

    let contenu;
    if(this.state.ecranCourant === 'information') {
      contenu = (
        <InformationMilleGrille
          {...this.fonctionsNavigation} />
      );
    } else if(this.state.ecranCourant === 'gestionTokens') {
      contenu = (
        <GestionTokens
          {...this.fonctionsNavigation} />
      );
    } else {
      contenu = (
        <div className="w3-col m12">
          {this.version()}
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

class InformationMilleGrille extends React.Component {

  render() {
    return (
      <div>
        <Container className='w3-card w3-round w3-white'>
          <div className='w3-container w3-padding'>
            <Row><Col><h2><Trans>principale.information.titre</Trans></h2></Col></Row>
            <Row><Col><p><Trans>principale.information.description_1</Trans></p></Col></Row>
          </div>
        </Container>
      </div>
    );
  }
}

class GestionTokens extends React.Component {

  state = {
    pin: null,
  }

  ajouterToken = () => {

    // Le processus comporte plusieurs etapes. On commence par ajouter
    // un handler pour repondre au challenge du serveur.
    var callbackChallenge = null;
    webSocketManager.emitWEventCallback(
      'enregistrerDevice', {}, 'challengeEnregistrerDevice')
    .then(event=>{
      let challenge = event[0];
      let cb = event[1];
      console.log("Challenge recu");
      console.log(challenge);
      console.log(cb);
      callbackChallenge = cb;

      return solveRegistrationChallenge(challenge);
    }).then(credentials=>{
      console.log("Transmission de la reponse au challenge");
      console.log(credentials);

      // Transmettre reponse
      callbackChallenge(credentials);
    }).catch(err=>{
      console.error("Erreur traitement ajouter token");
      console.error(err);
    });

  }

  genererPinTemporaireAjoutDevice = () => {
    let self = this;
    webSocketManager.emit('creerPINTemporaireDevice', {})
    .then(reponse => {
      let pin = reponse.pin;
      self.setState({pin: pin});
    })
  }

  render() {
    return(
      <div className="w3-col m12">
        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <div>
              <h1>Gestion tokens</h1>
              <ul>
                <li>
                  <button onClick={this.ajouterToken}>
                    Ajouter token
                  </button>
                </li>
                <li>
                  <button onClick={this.genererPinTemporaireAjoutDevice}>
                    Generer un PIN
                  </button> temporaire pour connecter un nouveau token.
                  PIN actuel: {this.state.pin}
                </li>
                <li>
                  <button className="aslink" onClick={this.props.retourPrincipale}>
                    Retour
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
