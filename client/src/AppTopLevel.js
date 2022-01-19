import React from 'react'
import {proxy as comlinkProxy, releaseProxy} from 'comlink'

import {setupWorkers, preparerWorkersAvecCles} from './workers/workers.load'
import {ApplicationCoupdoeil} from './containers/App'

import '@dugrema/millegrilles.common/css/millegrilles.css'
import './containers/App.css'
import './containers/Layout.css'

// import manifest from './manifest.build.js'
// const manifest = {
//   date: "DUMMY",
//   version: "DUMMY",
// }

const NOM_USAGER_PROPRIETAIRE = 'proprietaire'

export default class AppTopLevel extends React.Component {

  state = {
    modeProtege: false,         // Mode par defaut est lecture seule (prive)
    sousMenuApplication: null,
    connexionSocketIo: null,

    webWorker: '',
    webWorkerInstance: '',

    cleMillegrilleChargee: false,
    signateurTransaction: '',
  }

  componentDidMount() {
    setupWorkers(this).then( async _ =>{
      console.debug("Workers charges, info session : %O, proppys : %O", this.state, this.props)

      // this.setState({
      //   signateurTransaction: {preparerTransaction: this.state.chiffrageWorker.formatterMessage}, // Legacy
      // })

      await this.preparerWorkersAvecCles()
      this.toggleProtege()  // Tenter upgrade protege automatiquement
    })

  }

  componentWillUnmount() {
    if(this.state.webWorker) {
      console.debug("Nettoyage worker, release proxy")
      this.state.webWorker[releaseProxy]()
      this.state.webWorkerInstance.terminate()
    }
  }

  callbackCleMillegrille = comlinkProxy(chargee => {
    console.debug("Recu changement etat cle de millegrille dans le web worker : chargee = %s", chargee)
    this.setState({cleMillegrilleChargee: chargee===true})
  })

  async preparerWorkersAvecCles() {
    console.debug("Preparation workers avec cle %O", this.state)
    const {nomUsager, chiffrageWorker, connexionWorker} = this.state
    if(nomUsager) {
      await preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker)
      console.debug("preparerWorkersAvecCles pret")
    } else {
      console.warn("Nom d'usager manquant")
    }
  }

  setEtatProtege = comlinkProxy(reponse => {
    console.debug("Callback etat protege : %O", reponse)
    const modeProtege = reponse.etat
    console.debug("Toggle mode protege, nouvel etat : %O", reponse)
    this.setState({modeProtege})
  })

  deconnexionSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO deconnecte : %O", event)
    this.setState({modeProtege: false})
  })

  reconnectSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO reconnecte : %O", event)
    if(!this.state.modeProtege) {
      this.toggleProtege()
    }
  })

  setSousMenuApplication = sousMenuApplication => {
    console.debug("Set sous-menu application")
    this.setState({sousMenuApplication})
  }

  toggleProtege = async () => {
    if( this.state.modeProtege ) {
      // Desactiver mode protege
      this.state.connexionWorker.downgradePrive()
    } else {
      // Activer mode protege, upgrade avec certificat (implicite)
      console.debug("toggleProtege")
      try {
        const resultat = await this.state.connexionWorker.upgradeProteger()

        // Promise.all([
        //   this.state.connexionWorker.enregistrerCallbackTopologie(),
        // ]).then(listeners=>{
        //     console.debug("Listeners proteges prets")
        //   })
        //   .catch(err=>{
        //     console.error("Erreur reconnexion listeners proteges : %O", err)
        //   })

      } catch(err) {
        console.error("Erreur upgrade protege %O", err)
      }
    }
  }

  desactiverProtege = () => {
    console.debug("Revenir a mode prive")
    if(this.state.connexionSocketIo) {

      this.state.connexionSocketIo.emit('downgradePrive', reponse=>{
        if(reponse && reponse.err) {
          console.error("Erreur downgrade vers mode prive")
        }
        this.setState({modeProtege: false})
      })

    } else {
      this.setState({modeProtege: false})
    }
  }

  render() {

    const rootProps = {
      ...this.state, 
      // manifest,
      toggleProtege: this.toggleProtege,
      // setCleMillegrille: this.setCleMillegrille,
    }

    const workers = {
      connexion: this.state.connexionWorker,
      chiffrage: this.state.chiffrageWorker,
    }

    let page;
    if(!this.state.nomUsager || !this.state.connexionWorker) {
      // Connecter avec Socket.IO
      return <p>Chargement en cours</p>
    } else {
      // 3. Afficher application
      return <ApplicationCoupdoeil workers={workers}
                                   rootProps={rootProps} />
    }
  }

}
