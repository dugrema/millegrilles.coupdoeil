import React from 'react'
import { WebSocketCoupdoeil as WebSocketManager } from '../components/webSocketManager'
import { VerificationInfoServeur } from './Authentification'
import { SectionContenu } from './SectionContenu'
import { MenuItems } from './Menu'

// import {getCertificats, getClesPrivees} from '../components/pkiHelper'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

import './App.css'

export class ApplicationCoupdoeil extends React.Component {

  state = {
    serveurInfo: null,          // Provient de /coupdoeil/info.json
    idmg: null,                 // IDMG actif
    hebergement: false,

    // signateurTransaction: '',

    page: 'Accueil',
  }

  componentDidMount() {

    const wsa = this.props.rootProps.connexionWorker
    wsa.isFormatteurReady()
      .then( async _ =>{
        console.debug("Fortteur ready sur connexion")
        this.setState({websocketApp: wsa})
      })

    this.props.setSousMenuApplication(
      <MenuItems
        changerPage={this.changerPage}
        rootProps={this.props.rootProps}
        websocketApp={wsa}
        />
    )

  }

  setInfoServeur = (info) => {
    this.setState(info)
  }

  changerPage = eventPage => {
    // Verifier si event ou page
    let page
    var paramsPage = null
    if(eventPage.currentTarget) {
      var target = eventPage.currentTarget
      page = target.value
      var dataset = target.dataset
      if(dataset) {
        paramsPage = {...dataset}
      }
    } else {
      page = eventPage
    }

    if(page === this.state.page) {
      // Reset de la page
      // console.debug("Reset page : %s", page)
      this.setState({page: '', paramsPage}, ()=>{this.setState({page})})
    } else {
      // console.debug("Page : %s", page)
      this.setState({page, paramsPage})
    }
  }

  render() {
    const rootProps = {
      ...this.props, ...this.props.rootProps, ...this.state,
      changerPage: this.changerPage,
    }

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <p>Attente de connexion</p>
    } else {
      // 3. Afficher application
      page = <SectionContenu rootProps={rootProps} />
    }

    return page
  }

}
