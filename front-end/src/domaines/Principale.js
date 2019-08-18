import React from 'react';
import './Principale.css';

import { solveRegistrationChallenge } from '@webauthn/client';
import webSocketManager from '../WebSocketManager';

export class InterfacePrincipale extends React.Component {

  state = {
    afficherGestionTokens: false,
  }

  gestionTokens = () => {
    this.setState({afficherGestionTokens: true});
  }

  render() {

    let contenu;
    if(this.state.afficherGestionTokens) {
      contenu = (
        <GestionTokens />
      );
    } else {
      contenu = (
        <div>
          <h2>Fonctions de gestion de votre MilleGrille</h2>
          <ul>
            <li>
              <button className="aslink" onClick={this.gestionTokens}>
                Gerer les tokens de securite
              </button>
            </li>
          </ul>
        </div>
      )
    }

    return (
      <div>
        <h1>Interface principale</h1>
        {contenu}
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
        </ul>
      </div>
    );
  }

}
