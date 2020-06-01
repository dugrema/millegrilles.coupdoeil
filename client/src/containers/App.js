import React from 'react'
import { Alert, Container, Row, Col, Button, InputGroup, Form, FormControl } from 'react-bootstrap'

import {VerificationInfoServeur, ConnexionWebsocket} from './Authentification'
import { SectionContenu } from './SectionContenu'
import { LayoutCoudpoeil } from './Layout'

import './App.css'

import manifest from '../manifest.build.js'
// const manifest = {
//   date: "DUMMY",
//   version: "DUMMY",
// }

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

  toggleProtege = async event => {
    const modeToggle = ! this.state.modeProtege
    if(modeToggle) {
      console.debug("Activer mode protege")

      if(this.state.websocketApp) {
        try {
          await this.state.websocketApp.demandeActiverModeProtege()
          this.setState({modeProtege: true})
        } catch(err) {
          console.error("Erreur activation mode protege")
          console.error(err)
        }
      } else {
        console.error("Connexion Socket.IO absente")
      }

    } else {
      this.desactiverProtege()
    }

  }

  desactiverProtege = () => {
    console.debug("Revenir a mode prive")
    this.state.websocketApp.desactiverModeProtege()
    this.setState({modeProtege: false})
  }

  render() {

    const rootProps = {...this.state, manifest, toggleProtege: this.toggleProtege}

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <ConnexionWebsocket setWebsocketApp={this.setWebsocketApp} desactiverProtege={this.desactiverProtege} />
    } else {
      // 3. Afficher application
      page = <SectionContenu rootProps={rootProps} />
    }

    return <LayoutCoudpoeil changerPage={this.changerPage} page={page} rootProps={rootProps}/>
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
