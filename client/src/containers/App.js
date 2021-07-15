import React, {useState} from 'react'
import { WebSocketCoupdoeil as WebSocketManager } from '../components/webSocketManager'
import { VerificationInfoServeur } from './Authentification'
import { SectionContenu } from './SectionContenu'
import { MenuItems } from './Menu'

// import {getCertificats, getClesPrivees} from '../components/pkiHelper'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

import './App.css'

export function ApplicationCoupdoeil(props) {

  // state = {
  //   serveurInfo: null,          // Provient de /coupdoeil/info.json
  //   idmg: null,                 // IDMG actif
  //   hebergement: false,
  //
  //   page: 'Accueil',
  // }
  const [serveurInfo, setServeurInfo] = useState('')
  const [idmg, setIdmg] = useState('')
  const [page, setPage] = useState('Accueil')

  // componentDidMount() {
  //
  //   // const wsa = this.props.rootProps.connexionWorker
  //   // wsa.isFormatteurReady()
  //   //   .then( async _ =>{
  //   //     console.debug("Fortteur ready sur connexion")
  //   //     this.setState({websocketApp: wsa})
  //   //   })
  //
  //   // this.props.setSousMenuApplication(
  //   //   <MenuItems
  //   //     changerPage={this.changerPage}
  //   //     rootProps={this.props.rootProps}
  //   //     websocketApp={wsa}
  //   //     />
  //   // )
  //
  // }

  // setInfoServeur = (info) => {
  //   this.setState(info)
  // }

  const changerPage = eventPage => {
    // Verifier si event ou page
    let pageResultat
    // var paramsPage = null
    if(eventPage.currentTarget) {
      var target = eventPage.currentTarget
      pageResultat = target.value
      var dataset = target.dataset
      if(dataset) {
        console.warn("FIX ME : params page dataset : %O", dataset)
        // paramsPage = {...dataset}
      }
    } else {
      pageResultat = eventPage
    }

    if(pageResultat === page) {
      // Reset de la page
      // console.debug("Reset page : %s", page)
      // this.setState({page: '', paramsPage}, ()=>{setPage(pageResultat)})
      setPage(pageResultat)
    } else {
      // console.debug("Page : %s", page)
      // this.setState({page, paramsPage})
      setPage(pageResultat)
    }
  }

  const rootProps = {
    ...props, ...props.rootProps,
    serveurInfo, idmg, page,
    changerPage,
  }

  let pageRendered
  if(!serveurInfo) {
    // 1. Recuperer information du serveur
    return <VerificationInfoServeur setInfoServeur={setServeurInfo} />
  } else if(!props.workers) {
    // 2. Connecter avec Socket.IO
    return <p>Attente de connexion</p>
  }
  // 3. Afficher application
  return <SectionContenu workers={props.workers} rootProps={rootProps} />
}
