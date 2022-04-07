import { proxy } from 'comlink'

const CONST_APP_URL = 'coupdoeil/socket.io'
// const CONST_APP_URL = 'coupdoeil'

async function connecter(workers, setUsagerState, setEtatConnexion) {
    const { connexion } = workers
  
    console.debug("Set callbacks connexion worker")
    const location = new URL(window.location.href)
    location.pathname = CONST_APP_URL
    console.info("Connecter a %O", location.href)

    // Preparer callbacks
    const setUsagerCb = proxy( usager => setUsager(workers, usager, setUsagerState) )
    const setEtatConnexionCb = proxy(etat => setEtatConnexion(etat))
    await connexion.setCallbacks(setEtatConnexionCb, setUsagerCb)

    const resultat = await connexion.connecter(location.href)
    console.debug("Resultat connexion : %O", resultat)

    return resultat
}

export default connecter

// Charger l'usager, son profil (db locale) et ses extensions (certificat)
// Initialise (ou re-initialise) les formatteurs de message de chaque worker
async function setUsager(workers, nomUsager, setUsagerState, opts) {
    opts = opts || {}
    console.debug("connecter setUsager (cb worker) '%s'", nomUsager)
    const { usagerDao, forgecommon } = await import('@dugrema/millegrilles.reactjs')
    const { pki } = await import('@dugrema/node-forge')
    const { extraireExtensionsMillegrille } = forgecommon
    const usager = await usagerDao.getUsager(nomUsager)
    // console.debug("Usager info : %O", usager)
    
    if(usager && usager.certificat) {
        const fullchain = usager.certificat,
              caPem = usager.ca

        const certificatPem = fullchain.join('')

        // Initialiser le CertificateStore
        //await workers.chiffrage.initialiserCertificateStore(caPem, {isPEM: true, DEBUG: false})

        // Initialiser chaque worker avec la cle privee
        await Promise.all(Object.keys(workers).filter(item=>item!=='instances').map(nomWorker=>{
            const worker = workers[nomWorker]
            console.debug("Initialiser formatteur message pour worker %s", nomWorker)
            return worker.initialiserFormatteurMessage(certificatPem, usager.clePriveePem, {DEBUG: false})
        }))
    
        // console.debug("Charger extensions de %s", fullchain[0])
        const certForge = pki.certificateFromPem(fullchain[0])
        const extensions = extraireExtensionsMillegrille(certForge)

        // Authentifier aupres du back-en (socket.io)
        // console.debug("Authentifier usager")
        await workers.connexion.authentifier()

        // Appeler methode pour conserver information usager (doit etre apres authentification)
        await setUsagerState({...usager, nomUsager, extensions})

    } else {
        console.warn("Pas de certificat pour l'usager '%s'", usager)
    }

}
