import React from 'react'
import { Alert, Container, Row, Col, Button, InputGroup, Form, FormControl } from 'react-bootstrap'

import {VerificationInfoServeur, ConnexionWebsocket} from './Authentification'
import { SectionContenu } from './SectionContenu'
import { LayoutCoudpoeil } from './Layout'

import './App.css'

export class ApplicationCoupdoeil extends React.Component {

  state = {
    serveurInfo: null,          // Provient de /coupdoeil/info.json
    websocketApp: null,         // Connexion socket.io

    idmg: null,                 // IDMG actif
    hebergement: false,
    modeProtege: false,         // Mode par defaut est lecture seule (prive)

    page: 'Principale',
  }

  setInfoServeur = (info) => {
    this.setState(info)
  }

  setWebsocketApp = websocketApp => {
    // Set la connexion Socket.IO. Par defaut, le mode est prive (lecture seule)
    this.setState({websocketApp, modeProtege: false})
  }

  setModeProtege = mode => {
    this.setState({modeProtege: mode})
  }

  changerPage = page => {
    if(page === this.state.page) {
      // Reset de la page
      // console.debug("Reset page : %s", page)
      this.setState({page: ''}, ()=>{this.setState({page})})
    } else {
      // console.debug("Page : %s", page)
      this.setState({page})
    }
  }

  render() {

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <ConnexionWebsocket setWebsocketApp={this.setWebsocketApp} />
    } else {
      // 3. Afficher application
      page = <SectionContenu rootProps={{...this.state}} />
    }

    return <LayoutCoudpoeil idmg={this.state.idmg} page={page} changerPage={this.changerPage} />
  }

}

class ApplicationConnectee extends React.Component {

  render() {
    return (
      <div>
         <p>IDMG : {this.props.rootProps.serveurInfo.idmg}</p>
         <p>AppConnectee</p>
      </div>
    )
  }

}
