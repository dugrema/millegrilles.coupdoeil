import React, { Suspense, useState, useCallback, useEffect, lazy } from 'react'

import connecter from './workers/connecter'

import './containers/App.css'
import './containers/Layout.css'

const ApplicationCoupdoeil = lazy(()=>import('./containers/App'))

// export default class AppTopLevel extends React.Component {

//   state = {
//     modeProtege: false,         // Mode par defaut est lecture seule (prive)
//     sousMenuApplication: null,
//     connexionSocketIo: null,

//     webWorker: '',
//     webWorkerInstance: '',

//     cleMillegrilleChargee: false,
//     signateurTransaction: '',
//   }

//   componentDidMount() {
//     setupWorkers(this).then( async _ =>{
//       console.debug("Workers charges, info session : %O, proppys : %O", this.state, this.props)

//       // this.setState({
//       //   signateurTransaction: {preparerTransaction: this.state.chiffrageWorker.formatterMessage}, // Legacy
//       // })

//       await this.preparerWorkersAvecCles()
//       this.toggleProtege()  // Tenter upgrade protege automatiquement
//     })

//   }

//   componentWillUnmount() {
//     if(this.state.webWorker) {
//       console.debug("Nettoyage worker, release proxy")
//       this.state.webWorker[releaseProxy]()
//       this.state.webWorkerInstance.terminate()
//     }
//   }

//   callbackCleMillegrille = comlinkProxy(chargee => {
//     console.debug("Recu changement etat cle de millegrille dans le web worker : chargee = %s", chargee)
//     this.setState({cleMillegrilleChargee: chargee===true})
//   })

//   async preparerWorkersAvecCles() {
//     console.debug("Preparation workers avec cle %O", this.state)
//     const {nomUsager, chiffrageWorker, connexionWorker} = this.state
//     if(nomUsager) {
//       await preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker)
//       console.debug("preparerWorkersAvecCles pret")
//     } else {
//       console.warn("Nom d'usager manquant")
//     }
//   }

//   setEtatProtege = comlinkProxy(reponse => {
//     console.debug("Callback etat protege : %O", reponse)
//     const modeProtege = reponse.etat
//     console.debug("Toggle mode protege, nouvel etat : %O", reponse)
//     this.setState({modeProtege})
//   })

//   deconnexionSocketIo = comlinkProxy(event => {
//     console.debug("Socket.IO deconnecte : %O", event)
//     this.setState({modeProtege: false})
//   })

//   reconnectSocketIo = comlinkProxy(event => {
//     console.debug("Socket.IO reconnecte : %O", event)
//     if(!this.state.modeProtege) {
//       this.toggleProtege()
//     }
//   })

//   setSousMenuApplication = sousMenuApplication => {
//     console.debug("Set sous-menu application")
//     this.setState({sousMenuApplication})
//   }

//   toggleProtege = async () => {
//     if( this.state.modeProtege ) {
//       // Desactiver mode protege
//       this.state.connexionWorker.downgradePrive()
//     } else {
//       // Activer mode protege, upgrade avec certificat (implicite)
//       console.debug("toggleProtege")
//       try {
//         await this.state.connexionWorker.authentifier()
//       } catch(err) {
//         console.error("Erreur upgrade protege %O", err)
//       }
//     }
//   }

//   desactiverProtege = () => {
//     console.debug("Revenir a mode prive")
//     if(this.state.connexionSocketIo) {

//       this.state.connexionSocketIo.emit('downgradePrive', reponse=>{
//         if(reponse && reponse.err) {
//           console.error("Erreur downgrade vers mode prive")
//         }
//         this.setState({modeProtege: false})
//       })

//     } else {
//       this.setState({modeProtege: false})
//     }
//   }

//   render() {

//     const rootProps = {
//       ...this.state, 
//       // manifest,
//       toggleProtege: this.toggleProtege,
//       // setCleMillegrille: this.setCleMillegrille,
//     }

//     const workers = {
//       connexion: this.state.connexionWorker,
//       chiffrage: this.state.chiffrageWorker,
//     }

//     let page;
//     if(!this.state.nomUsager || !this.state.connexionWorker) {
//       // Connecter avec Socket.IO
//       return <p>Chargement en cours</p>
//     } else {
//       // 3. Afficher application
//       return <ApplicationCoupdoeil workers={workers}
//                                    rootProps={rootProps} />
//     }
//   }

// }

function App(props) {

  // Etat connexion
  const [etatConnexion, setEtatConnexion] = useState(false)
  const [workers, setWorkers] = useState('')  // connexionSocketIo

  // Etat session usager
  const [usager, setUsager] = useState('')
  const [etatAuthentifie, setEtatAuthentifie] = useState(false)  // modeProtege: false,
  const [certificatMaitreDesCles, setCertificatMaitreDesCles] = useState('')
  const [cleMillegrilleChargee, setcleMillegrilleChargee] = useState(false)  // cleMillegrilleChargee: false,

  // Affichage d'une erreur
  const [erreur, setErreur] = useState('')
  const [erreurMessage, setErreurMessage] = useState('')

  const setUsagerCb = useCallback(usager=>{
    console.debug('setUsagerCb Usager : %O', usager)
    setUsager(usager)
  }, [setUsager])

  const erreurCb = useCallback((erreur, erreurMessage)=>{
    console.error("erreurCb message: %s\n%O", erreurMessage, erreur)
    setErreur(erreur); setErreurMessage(erreurMessage)
  }, [setErreur, setErreurMessage])

  // Chargement des workers
  useEffect(()=>importerWorkers().then(workers=>setWorkers(workers)).catch(err=>erreurCb(err)), [setWorkers, erreurCb])

  useEffect(()=>{
    if(workers) {
      connecter(workers, setUsagerCb, setEtatConnexion)
        .then(infoConnexion=>{console.debug("Info connexion : %O", infoConnexion)})
        .catch(err=>erreurCb(err, 'Erreur de connexion au serveur'))
    }
  }, [workers, setUsagerCb, setEtatConnexion, erreurCb])

  // Conserver le fait qu'on a perdu la connexion
  useEffect(()=>{if(!etatConnexion) setEtatAuthentifie(false)}, [etatConnexion])

  // Reconnecter session
  useEffect(
    ()=>{ if(etatConnexion&&usager) reconnecter(workers, setEtatAuthentifie, setCertificatMaitreDesCles).catch(err=>erreurCb(err)) }, 
    [etatConnexion, usager, setCertificatMaitreDesCles]
  )

  if(!usager || !workers) {
    // Connecter avec Socket.IO
    return <p>Connexion en cours</p>
  } else {
    // Afficher application
    return (
      <Suspense fallback={<Attente />}>
        <ApplicationCoupdoeil 
          workers={workers}
          etatConnexion={etatConnexion}
          etatAuthentifie={etatAuthentifie}
          cleMillegrilleChargee={cleMillegrilleChargee}
          certificatMaitreDesCles={certificatMaitreDesCles} />
      </Suspense>
    )
  }

}

export default App

function Attente(props) {
  return <p>Chargement en cours</p>
}

async function importerWorkers() {
  const { chargerWorkers } = await import('./workers/workers.load')
  return chargerWorkers()
}

async function reconnecter(workers, setEtatAuthentifie, setCertificatMaitreDesCles) {
  console.debug("AppTopLevel.reconnecte")
  const {connexion} = workers

  // reconnecter() est appele apres l'authentification de l'usager (callback du worker)
  setEtatAuthentifie(true)

  connexion.getClesChiffrage()
    .then(cles=>{
      console.debug("Cles chiffrage recues : %O", cles)
      setCertificatMaitreDesCles(cles.certificat)
    })
    .catch(err=>console.error("Erreur chargement cles chiffrage : %O", err))

}
