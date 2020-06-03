// Authentification avec U2F
import React from 'react'
import axios from 'axios'

import { WebSocketManager } from 'millegrilles.common/lib/webSocketManager'

// ConnexionServeur sert a verifier que le serveur est accessible, set info de base en memoire
// Transfere le controle a <ApplicationCoupdoeil /> via props.setInfoServeur
export class VerificationInfoServeur extends React.Component {

  componentDidMount() {
    const infoUrl = '/coupdoeil/info.json'
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

  state = {
    erreur: false,
    erreurMessage: '',
  }

  componentDidMount() {
    this.authentifier()
  }

  async authentifier() {
    const config = {
      path: '/coupdoeil/socket.io',
      reconnection: true,
    }
    const websocketConnexion = new WebSocketManager(config)
    websocketConnexion.disconnectHandler = this.props.desactiverProtege

    try {
      await websocketConnexion.connecter()
      this.props.setWebsocketApp(websocketConnexion)
      console.debug("Authentification completee")
    } catch(err) {
      console.error("Erreur authentification")
      console.error(err)
      this.setState({erreur: true, erreurMessage: err.cause})
    }

  }

  render() {
    let page;
    if(this.state.erreur) {
      page = <p>Erreur : {this.state.erreurMessage}</p>
    } else {
      page = <p>Connexion a Socket.IO de Coup D'Oeil en cours ...</p>
    }

    return page
  }
}
