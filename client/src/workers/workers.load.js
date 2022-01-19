import {wrap as comlinkWrap, proxy as comlinkProxy, releaseProxy} from 'comlink'
import { getUsager } from '@dugrema/millegrilles.reactjs'

//TODO
/* eslint-disable-next-line */
// import ChiffrageWorker from '@dugrema/millegrilles.common/lib/browser/chiffrage.worker'

import ConnexionWorker from './connexion.worker'

export async function setupWorkers(app) {
  /* Fonction pour componentDidMount : setupWorker(this) */

  const [chiffrage, connexion] = await Promise.all([
    initialiserWorkerChiffrage(app.callbackCleMillegrille),
    initialiserConnexion(app)
  ])
  console.debug("Workers prets : chiffrage %O, connexion %O", chiffrage, connexion)

  app.setState({
    connexionWorker: connexion.chiffrageWorker,
    connexionInstance: connexion.workerInstance,
    chiffrageWorker: chiffrage.chiffrageWorker,
    chiffrageInstance: chiffrage.workerInstance,
  })

  return {chiffrage, connexion}
}

export function cleanupWorkers(app) {
  /* Fonction pour componentWillUnmount : cleanupWorkers(this) */

  try {
    if(app.state.chiffrageWorker) {
      console.debug("Nettoyage worker chiffrage, release proxy")
      app.state.chiffrageWorker[releaseProxy]()
      app.state.chiffrageInstance.terminate()
      app.setState({chiffrageWorker: null, chiffrageInstance: null})
    }
  } catch(err) {console.error("Erreur fermeture worker chiffrage")}

  try {
    if(app.state.connexionWorker) {
      console.debug("Nettoyage worker, connexion release proxy")
      app.state.connexionWorker[releaseProxy]()
      app.state.connexionInstance.terminate()
      app.setState({connexionWorker: null, connexionInstance: null})
    }
  } catch(err) {console.error("Erreur fermeture worker chiffrage")}
}

async function initialiserWorkerChiffrage(callbackCleMillegrille) {
  // const workerInstance = new ChiffrageWorker()
  // const chiffrageWorker = await comlinkWrap(workerInstance)

  // const cbCleMillegrille = comlinkProxy(callbackCleMillegrille)
  // chiffrageWorker.initialiserCallbackCleMillegrille(cbCleMillegrille)

  const workerInstance = '', chiffrageWorker = ''  // TODO

  return { workerInstance, chiffrageWorker }
}

async function initialiserConnexion(app) {
  const workerInstance = new ConnexionWorker()
  const chiffrageWorker = await comlinkWrap(workerInstance)

  console.debug("Connecter React avec connexion worker")
  await connecterReact(chiffrageWorker, app)
  console.debug("React connecte avec connexion worker")

  return { workerInstance, chiffrageWorker }
}

async function connecterReact(connexionWorker, app) {
  /* Helper pour connecter le worker avec socketIo.
     - connexionWorker : proxu de connexionWorker deja initialise
     - app : this d'une classe React */
  const infoIdmg = await connexionWorker.connecter({location: ''+window.location})
  console.debug("Connexion socket.io completee, info idmg : %O", infoIdmg)
  app.setState({...infoIdmg})

  connexionWorker.socketOn('disconnect', app.deconnexionSocketIo)
  connexionWorker.socketOn('modeProtege', app.setEtatProtege)
  connexionWorker.socketOn('connect', app.reconnectSocketIo)
}

export async function preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker) {
  // Initialiser certificat de MilleGrille et cles si presentes
  const usager = await getUsager(nomUsager)
  console.debug("preparerWorkersAvecCles usager %O", usager)
  if(usager && usager.certificat) {
    const clePriveePem = usager.clePriveePem
    // const clesPrivees = await getClesPrivees(nomUsager)

    // Initialiser le CertificateStore
    //await chiffrageWorker.initialiserCertificateStore([...fullchain].pop(), {isPEM: true, DEBUG: false})
    // console.debug("preparerWorkersAvecCleschiffrageWorker.initialiserCertificateStore complete")
    console.warn("preparerWorkersAvecCleschiffrageWorker.initialiserCertificateStore TODO")

    const paramsCert = {
      certificatPem: usager.certificat.join('\n'),
      clePriveeSign: usager.signer,
      clePriveeDecrypt: usager.dechiffrer,
      DEBUG: true
    }

    // Initialiser web worker
    //await chiffrageWorker.initialiserFormatteurMessage(paramsCert)
    //console.debug("preparerWorkersAvecCles chiffrageWorker certs/cles initialises")

    await connexionWorker.initialiserFormatteurMessage(
      usager.certificat,
      clePriveePem,
      {
        DEBUG: true
      }
    )
    console.debug("preparerWorkersAvecCles connexionWorker certs/cles initialises")

  } else {
    throw new Error("Pas de cert")
  }
}
