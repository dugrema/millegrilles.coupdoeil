// Authentification avec U2F
import React from 'react'
import axios from 'axios'

import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client'

// ConnexionServeur sert a verifier que le serveur est accessible, set info de base en memoire
// Transfere le controle a <ApplicationCoupdoeil /> via props.setInfoServeur
export class VerificationInfoServeur extends React.Component {

  componentDidMount() {
    const infoUrl = 'coupdoeil/info.json'
    axios.get(infoUrl)
    .then(response=>{
      console.debug("Reponse %s", infoUrl);
      console.debug(response);

      if(response.status === 200) {
        const serveurInfo = response.data
        this.traiterServeurJson(serveurInfo)
      } else {
        // Erreur acces serveur
        this.props.setInfoServeur({
          serveurInfo: null,
          erreurAccesServeur: true,
        })
      }

    })
    .catch(err=>{
      console.error("Erreur access information du serveur")
      console.error(err)

      // Afficher message erreur a l'ecran
      this.props.setInfoServeur({
        serveurInfo: null,
        erreurAccesServeur: true,
      })

    })
  }

  traiterServeurJson(serveurInfo) {
    var hebergement = serveurInfo.modeHebergement

    const stateUpdate = {
      serveurInfo,
      erreurAccesServeur: false,
    }

    const idmgSauvegarde = localStorage.getItem('idmg')
    if(!idmgSauvegarde || !hebergement) {

      if(!hebergement) {
        // Hebergement inactif, override du idmg sauvegarde
        stateUpdate.idmg = serveurInfo.idmg
      } else {
        // Hebergement, on utilise le IDMG sauvegarde (si disponible)
        stateUpdate.idmg = idmgSauvegarde
      }

    } else {
      // idmg sauvegarde
      stateUpdate.idmg = idmgSauvegarde
    }

    // Mise a jour du idmg sauvegarde
    localStorage.setItem('idmg', stateUpdate.idmg)

    // Transfere information au top level pour activer coupdoeil
    this.props.setInfoServeur(stateUpdate)
  }

  render() {
    return (
      <p>Initialisation de la connexion au serveur en cours ...</p>
    )
  }
}

export class ConnexionWebsocket extends React.Component {
  componentDidMount() {
    
  }

  render() {
    return <p>Connexion a Socket.IO de Coup D'Oeil en cours...</p>
  }
}

class AuthentificationProtege extends React.Component {

  async repondreChallengeTokenUSBRegistration(socket, challenge, callback) {
    solveRegistrationChallenge(challenge)
    .then(credentials=>{
      callback(credentials);
    })
    .catch(err=>{
      console.error("Erreur challenge reply registration security key");
      console.error(err);
      try{this.state.wss_socket.disconnect();} catch(err) {}
      this.setState({wss_socket: null});
    });
  }

  // Repond a un challenge pour token USB
  repondreChallengeTokenUSB(socket, challenge, callback) {

    // 2. Resoudre challenge et repondre au serveur pour activer connexion
    solveLoginChallenge(challenge)
    .then(credentials => {
      // console.debug("Tranmission evenement challenge_reply");
      //socket.emit('challenge_reply', credentials);
      callback(credentials); // Callback du challenge via websocket
    })
    .catch(err=>{
      console.error("Erreur challenge reply");
      console.error(err);
      try{this.state.wss_socket.disconnect();} catch(err) {}
      this.setState({wss_socket: null});
    });
  }

}
