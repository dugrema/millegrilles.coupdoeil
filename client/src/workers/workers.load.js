import {wrap, proxy as comlinkProxy, releaseProxy} from 'comlink'
import { usagerDao } from '@dugrema/millegrilles.reactjs'

import ConnexionWorker from './connexion.worker'

export function chargerWorkers() {
  // const chiffrage = charger(ChiffrageWorker)
  const connexion = charger(ConnexionWorker)
  console.debug("chargerWorkers: Workers prets")

  const workers = {
    instances: {
      connexion: connexion.instance, 
      // chiffrage: chiffrage.instance
    },
    connexion: connexion.worker,
    //chiffrage: chiffrage.worker,
  }

  return workers
}

function charger(ClasseWorker) {
  const instance = new ClasseWorker()
  const worker = wrap(instance)
  return {instance, worker}
}

export async function preparerWorkersAvecCles(nomUsager, workers) {
  // Initialiser certificat de MilleGrille et cles si presentes
  // Sert aussi a initialiser/upgrader la base de donnees si nouvelle
  const usager = await usagerDao.getUsager(nomUsager)

  // Charger cle privee pour obtenir methodes sign et decrypt

  if(usager && usager.certificat) {
    console.debug("Usager charge : %O", usager)

    const ca = usager.ca,
          clePriveePem = usager.clePriveePem

    // Initialiser le CertificateStore
    const promises = workers.map(async worker=>{

      if(!worker) return

      try {
        await worker.initialiserCertificateStore(ca, {isPEM: true, DEBUG: false})
      } catch(err) {
        // console.debug("Methode initialiserCertificateStore non presente sur worker")
      }

      console.debug("Initialiser formatteur message")
      return worker.initialiserFormatteurMessage(
        usager.certificat,
        clePriveePem,
        {
          DEBUG: false
        }
      )
    })

    await Promise.all(promises)

  } else {
    console.warning("preparerWorkersAvecCles : Certificat non disponible (usager: %O)", usager)
    throw new Error("workers.load preparerWorkersAvecCles : Certificat non disponible")
  }
}

export function cleanupWorkers(workers) {
  /* Fonction pour componentWillUnmount : cleanupWorkers(this) */

  for(let nom in Object.keys(workers)) {
    if(nom !== 'instances') {
      try {
        const worker = workers[nom]
        worker[releaseProxy]()
        const instance = workers.instances[nom]
        instance.terminate()
      } catch(err) {
        console.warn("Errreur fermeture worker %s", nom)
      }
    }
  }
  
}

// async function initialiserWorkerChiffrage(callbackCleMillegrille) {
//   // const workerInstance = new ChiffrageWorker()
//   // const chiffrageWorker = await comlinkWrap(workerInstance)

//   // const cbCleMillegrille = comlinkProxy(callbackCleMillegrille)
//   // chiffrageWorker.initialiserCallbackCleMillegrille(cbCleMillegrille)

//   const workerInstance = '', chiffrageWorker = ''  // TODO

//   return { workerInstance, chiffrageWorker }
// }

// async function initialiserConnexion(app) {
//   const workerInstance = new ConnexionWorker()
//   const chiffrageWorker = await comlinkWrap(workerInstance)

//   console.debug("Connecter React avec connexion worker")
//   await connecterReact(chiffrageWorker, app)
//   console.debug("React connecte avec connexion worker")

//   return { workerInstance, chiffrageWorker }
// }

// async function connecterReact(connexionWorker, app) {
//   /* Helper pour connecter le worker avec socketIo.
//      - connexionWorker : proxu de connexionWorker deja initialise
//      - app : this d'une classe React */
//   const urlConnexion = new URL(window.location.href)
//   const infoIdmg = await connexionWorker.connecter({location: urlConnexion.href})
//   console.debug("Connexion socket.io completee avec url %s, info idmg : %O", urlConnexion.href, infoIdmg)
//   app.setState({...infoIdmg})

//   connexionWorker.socketOn('disconnect', app.deconnexionSocketIo)
//   connexionWorker.socketOn('modeProtege', app.setEtatProtege)
//   connexionWorker.socketOn('connect', app.reconnectSocketIo)
// }

// export async function preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker) {
//   // Initialiser certificat de MilleGrille et cles si presentes
//   const usager = await usagerDao.getUsager(nomUsager)
//   console.debug("preparerWorkersAvecCles usager %O", usager)
//   if(usager && usager.certificat) {
//     const clePriveePem = usager.clePriveePem
//     // const clesPrivees = await getClesPrivees(nomUsager)

//     // Initialiser le CertificateStore
//     //await chiffrageWorker.initialiserCertificateStore([...fullchain].pop(), {isPEM: true, DEBUG: false})
//     // console.debug("preparerWorkersAvecCleschiffrageWorker.initialiserCertificateStore complete")
//     console.warn("preparerWorkersAvecCleschiffrageWorker.initialiserCertificateStore TODO")

//     const paramsCert = {
//       certificatPem: usager.certificat.join('\n'),
//       clePriveeSign: usager.signer,
//       clePriveeDecrypt: usager.dechiffrer,
//       DEBUG: true
//     }

//     // Initialiser web worker
//     //await chiffrageWorker.initialiserFormatteurMessage(paramsCert)
//     //console.debug("preparerWorkersAvecCles chiffrageWorker certs/cles initialises")

//     await connexionWorker.initialiserFormatteurMessage(
//       usager.certificat,
//       clePriveePem,
//       {
//         DEBUG: true
//       }
//     )
//     console.debug("preparerWorkersAvecCles connexionWorker certs/cles initialises")

//   } else {
//     throw new Error("Pas de cert")
//   }
// }
