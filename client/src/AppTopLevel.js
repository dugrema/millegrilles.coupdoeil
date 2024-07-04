import React, { Suspense, useState, useCallback, lazy } from 'react'
import ErrorBoundary from './ErrorBoundary'

import { WorkerProvider } from './WorkerContext'

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
          <ApplicationCoupdoeil erreur={erreur} />
        </Suspense>
      </ErrorBoundary>
    </WorkerProvider>
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
