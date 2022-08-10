import {wrap, releaseProxy} from 'comlink'

// import ConnexionWorker from './connexion.worker'
// import ChiffrageWorker from './chiffrage.worker'

export function setupWorkers() {
  const connexion = chargerConnexionWorker(),
        chiffrage = chargerChiffrageWorker()
  return { connexion, chiffrage }
}

// export function chargerWorkers() {
//   const chiffrage = charger(ChiffrageWorker)
//   const connexion = charger(ConnexionWorker)

//   const workers = {
//     instances: {
//       connexion: connexion.instance, 
//       chiffrage: chiffrage.instance
//     },
//     connexion: connexion.worker,
//     chiffrage: chiffrage.worker,
//   }

//   connexion.worker.testWorker().catch(err=>console.error("Erreur test worker connexion : %O", err))

//   // chiffrage.worker.importWasmCrypto().catch(err=>console.error("chiffrage worker : Erreur chargement WASM crypto"))

//   return workers
// }

// function charger(ClasseWorker) {
//   const instance = new ClasseWorker()
//   console.debug("Instance worker %s : %O", ClasseWorker, instance)
//   const worker = wrap(instance)
//   console.debug("Worker wrappe : %O", worker)
//   return {instance, worker}
// }

// export async function preparerWorkersAvecCles(nomUsager, workers) {
//   // Initialiser certificat de MilleGrille et cles si presentes
//   // Sert aussi a initialiser/upgrader la base de donnees si nouvelle

//   const { usagerDao } = await import('@dugrema/millegrilles.reactjs')

//   const usager = await usagerDao.getUsager(nomUsager)

//   // Charger cle privee pour obtenir methodes sign et decrypt

//   if(usager && usager.certificat) {
//     console.debug("Usager charge : %O", usager)

//     const ca = usager.ca,
//           clePriveePem = usager.clePriveePem

//     // Initialiser le CertificateStore
//     const promises = Object.values(workers).map(async workerInstance=>{

//       if(!workerInstance) return

//       const worker = workerInstance.proxy

//       try {
//         await worker.initialiserCertificateStore(ca, {isPEM: true, DEBUG: false})
//       } catch(err) {
//         // console.debug("Methode initialiserCertificateStore non presente sur worker")
//       }

//       console.debug("Initialiser formatteur message")
//       return worker.initialiserFormatteurMessage(
//         usager.certificat,
//         clePriveePem,
//         {
//           DEBUG: false
//         }
//       )
//     })

//     await Promise.all(promises)

//   } else {
//     console.warning("preparerWorkersAvecCles : Certificat non disponible (usager: %O)", usager)
//     throw new Error("workers.load preparerWorkersAvecCles : Certificat non disponible")
//   }
// }

export function cleanupWorkers(workers) {
  Object.values(workers).forEach((workerInstance) => {
    // console.debug("Cleanup worker instance : %O", workerInstance)
    try {
      const {worker, proxy} = workerInstance
      proxy[releaseProxy]()
      worker.terminate()
    } catch(err) {
      console.warn("Errreur fermeture worker : %O\n(Workers: %O)", err, workers)
    }
  })
}

function chargerConnexionWorker() {
  const worker = new Worker(new URL('./connexion.worker', import.meta.url), {type: 'module'})
  const proxy = wrap(worker)
  return {proxy, worker}
}

function chargerChiffrageWorker() {
  const worker = new Worker(new URL('./chiffrage.worker', import.meta.url), {type: 'module'})
  const proxy = wrap(worker)
  return {proxy, worker}
}
