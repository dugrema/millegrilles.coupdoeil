// Authentification avec U2F
import React from 'react'
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client'

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
