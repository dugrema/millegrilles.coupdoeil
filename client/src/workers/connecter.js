import { proxy } from 'comlink'

const CONST_APP_URL = 'coupdoeil/socket.io'
// const CONST_APP_URL = 'coupdoeil'

async function connecter(workers, setEtatConnexion, setUsagerState, setFormatteurPret, setCleMillegrilleChargee) {
    const { connexion, chiffrage } = workers
  
    // console.debug("Set callbacks connexion worker")
    const location = new URL(window.location.href)
    location.pathname = CONST_APP_URL
    console.info("Connecter a %O", location.href)

    // Preparer callbacks
    const setUsagerCb = proxy( usager => {
        //console.debug("usager cb : %O", usager)
        setUsager(workers, usager, setUsagerState)
    } )
    const setEtatConnexionCb = proxy(etat => {
        //console.debug('etat connexion cb %s', etat)
        setEtatConnexion(etat)
    })
    const setFormatteurPretCb = proxy(etat => {
        // console.debug('formatteur cb %O', etat)
        setFormatteurPret(etat)
    })
    const setCallbackCleMillegrilleCb = proxy(setCleMillegrilleChargee)

    await connexion.setCallbacks(setEtatConnexionCb, setUsagerCb, setFormatteurPretCb)
    if(chiffrage) await chiffrage.setCallbackCleMillegrille(setCallbackCleMillegrilleCb)

    const resultat = await connexion.connecter(location.href)
    // console.debug("Resultat connexion : %O", resultat)

    return resultat
}

export default connecter

// Charger l'usager, son profil (db locale) et ses extensions (certificat)
// Initialise (ou re-initialise) les formatteurs de message de chaque worker
async function setUsager(workers, nomUsager, setUsagerState, opts) {
    opts = opts || {}
    // console.debug("connecter setUsager (cb worker) '%s'", nomUsager)
    const { usagerDao, forgecommon, idmg: idmgUtils } = await import('@dugrema/millegrilles.reactjs')
    const { pki } = await import('@dugrema/node-forge')
    const { extraireExtensionsMillegrille } = forgecommon

    // console.debug("Charger usager : %s", nomUsager)
    const usager = await usagerDao.getUsager(nomUsager)
    // console.debug("Usager info : %O", usager)
    
    if(usager && usager.certificat) {
        const fullchain = usager.certificat,
              caPem = usager.ca

        // Calculer le idmg
        const idmg = await idmgUtils.getIdmg(caPem)

        const certificatPem = fullchain.join('')

        // Initialiser le CertificateStore
        if(workers.connexion) await workers.connexion.initialiserCertificateStore(caPem)
        if(workers.chiffrage) await workers.chiffrage.initialiserCertificateStore(caPem, {isPEM: true, DEBUG: false})

        await workers.chiffrage.initialiserFormatteurMessage(certificatPem, usager.clePriveePem, {DEBUG: false})
        await workers.connexion.initialiserFormatteurMessage(certificatPem, usager.clePriveePem, {DEBUG: false})

        // // Initialiser chaque worker avec la cle privee
        // await Promise.all(Object.keys(workers).filter(item=>item!=='instances').map(nomWorker=>{
        //     const worker = workers[nomWorker]
        //     // console.debug("Initialiser formatteur message pour worker %s", nomWorker)
        //     return worker.initialiserFormatteurMessage(certificatPem, usager.clePriveePem, {DEBUG: false})
        // }))
    
        // console.debug("Charger extensions de %s", fullchain[0])
        const certForge = pki.certificateFromPem(fullchain[0])
        const extensions = extraireExtensionsMillegrille(certForge)

        // Authentifier aupres du back-en (socket.io)
        // console.debug("Authentifier usager")
        const reponseAuthentifier = await workers.connexion.authentifier()
        // console.debug("Reponse authentifier : %O", reponseAuthentifier)
        if(!reponseAuthentifier || reponseAuthentifier.protege !== true) { // throw new Error("Echec authentification (protege=false)")
            console.error("Erreur authentification : reponseAuthentifier = %O", reponseAuthentifier)
            return
        }

        // Appeler methode pour conserver information usager (doit etre apres authentification)
        await setUsagerState({...usager, nomUsager, idmg, extensions})

    } else {
        console.warn("Pas de certificat pour l'usager '%s'", usager)
    }

}
