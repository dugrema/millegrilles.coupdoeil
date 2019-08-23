import React from 'react';
import './Principale.css';

import { solveRegistrationChallenge } from '@webauthn/client';
import webSocketManager from '../WebSocketManager';

export class InterfacePrincipale extends React.Component {

  state = {
    afficherGestionTokens: false,
  }

  fonctionsNavigation = {
    retourPrincipale: () => {
      this.setState({
        afficherGestionTokens: false,
      });
    },
    afficherGestionTokens: () => {
      this.setState({afficherGestionTokens: true});
    },
  }

  render() {

    let contenu;
    if(this.state.afficherGestionTokens) {
      contenu = (
        <GestionTokens
          {...this.fonctionsNavigation} />
      );
    } else {
      contenu = (
        <div>
          <h2 className="w3-opacity">Fonctions de gestion de votre MilleGrille</h2>
          <ul>
            <li>
              <button className="aslink" onClick={this.fonctionsNavigation.afficherGestionTokens}>
                Gerer les tokens de securite
              </button>
            </li>
          </ul>
        </div>
      )
    }

    return (

      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            <div className="w3-card w3-round w3-white">
              <div className="w3-container w3-padding">
                {contenu}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
      <div>
        <h1>Gestions tokens</h1>
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
    );
  }

}
