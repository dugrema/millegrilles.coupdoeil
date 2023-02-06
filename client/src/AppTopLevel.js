import React, { Suspense, useState, useCallback, useEffect, lazy } from 'react'
import ErrorBoundary from './ErrorBoundary'

import connecter from './workers/connecter'
import { setupWorkers, cleanupWorkers } from './workers/workers.load'

import useWorkers, {useEtatConnexion, WorkerProvider, useUsager} from './WorkerContext'

// Importer JS global
import 'react-bootstrap/dist/react-bootstrap.min.js'

// Importer cascade CSS global
import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'
import '@dugrema/millegrilles.reactjs/dist/index.css'

import './index.scss'

const ApplicationCoupdoeil = lazy(()=>import('./containers/App'))

function App(props) {

  // Affichage d'une erreur
  const [erreur, setErreur] = useState('')
  const [erreurMessage, setErreurMessage] = useState('')
  const erreurCb = useCallback((erreur, erreurMessage)=>{
    console.error("erreurCb message: %s\n%O", erreurMessage, erreur)
    setErreur(erreur); setErreurMessage(erreurMessage)
  }, [setErreur, setErreurMessage])

  return (
    <WorkerProvider attente={<Attente />}>
      <ErrorBoundary erreurCb={erreurCb}>
        <Suspense fallback={<Attente />}>
          <SubApp erreur={erreur} />
        </Suspense>
      </ErrorBoundary>
    </WorkerProvider>
  )
}

function SubApp(props) {

  const { erreurCb } = props

  // Etat connexion
  // const [etatConnexion, setEtatConnexion] = useState(false)
  // const [etatFormatteur, setEtatFormatteur] = useState(false)
  // const [workers, setWorkers] = useState('')
  const workers = useWorkers()

  // Etat session usager
  // const [usager, setUsager] = useState('')
  // const usager = useUsager()
  // const [etatAuthentifie, setEtatAuthentifie] = useState(false)  // modeProtege: false,
  // const [certificatMaitreDesCles, setCertificatMaitreDesCles] = useState('')
  // const [cleMillegrilleChargee, setCleMillegrilleChargee] = useState(false)

  // const setUsagerCb = useCallback(usager=>{
  //   //console.debug('setUsagerCb Usager : %O', usager)
  //   setUsager(usager)
  //   setEtatAuthentifie(true)  // Utilise lors d'une reconnexion
  // }, [setUsager, setEtatAuthentifie])


  // Chargement des workers
  // useEffect(()=>{
  //   const workerInstances = setupWorkers()
  //   const workers = Object.keys(workerInstances).reduce((acc, item)=>{
  //     acc[item] = workerInstances[item].proxy
  //     return acc
  //   }, {})
  //   setWorkers(workers)
  //   return () => {
  //       // console.debug("Cleanup workers")
  //       cleanupWorkers(workerInstances)
  //   }
  // }, [setWorkers, erreurCb])

  // useEffect(()=>{
  //   if(workers) {
  //     connecter(workers, setEtatConnexion, setUsagerCb, setEtatFormatteur, setCleMillegrilleChargee)
  //       .then(infoConnexion=>{console.info("Info connexion : %O", infoConnexion)})
  //       .catch(err=>erreurCb(err, 'Erreur de connexion au serveur'))
  //   }
  // }, [workers, setUsagerCb, setEtatConnexion, setEtatFormatteur, erreurCb])

  // Conserver le fait qu'on a perdu la connexion
  // useEffect(()=>{if(!etatConnexion) setEtatAuthentifie(false)}, [etatConnexion])

  // Reconnecter session
  // useEffect(
  //   ()=>{ 
  //     if(etatConnexion && etatFormatteur && usager) {
  //       console.warn("Connexion/reconnexion listeners socket.io")
  //       reconnecter(workers, setCertificatMaitreDesCles).catch(err=>erreurCb(err)) 
  //     }
  //   }, 
  //   [etatConnexion, etatFormatteur, usager, setCertificatMaitreDesCles, erreurCb]
  // )

  // Afficher application
  return (
    <ApplicationCoupdoeil 
      // workers={workers}
      // etatConnexion={etatConnexion}
      // etatAuthentifie={etatAuthentifie}
      // usager={usager}
      // cleMillegrilleChargee={cleMillegrilleChargee}
      // certificatMaitreDesCles={certificatMaitreDesCles} 
      // erreurCb={erreurCb} 
      />
  )

}

export default App

function Attente(_props) {
  return (
      <div>
          <p className="titleinit">Preparation de Coup D'Oeil</p>
          <p>Veuillez patienter durant le chargement de la page.</p>
          <ol>
              <li>Initialisation</li>
              <li>Chargement des composants dynamiques</li>
              <li>Connexion a la page</li>
          </ol>
      </div>
  )
}

// async function reconnecter(workers, setCertificatMaitreDesCles) {
//   //console.debug("AppTopLevel.reconnecte")
//   const {connexion} = workers

//   connexion.getClesChiffrage()
//     .then(cles=>{
//       //console.debug("Cles chiffrage recues : %O", cles)
//       setCertificatMaitreDesCles(cles.certificat)
//     })
//     .catch(err=>console.error("Erreur chargement cles chiffrage : %O", err))

// }
