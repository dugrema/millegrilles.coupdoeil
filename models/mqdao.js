const debug = require('debug')('mqdao')
const { MESSAGE_KINDS } = require('@dugrema/millegrilles.utiljs/src/constantes')

const L2Prive = '2.prive',
      L3Protege = '3.protege'

const DOMAINE_INSTANCE = 'instance',
      DOMAINE_MONITOR = DOMAINE_INSTANCE,
      CONST_DOMAINE_GROSFICHIERS = 'GrosFichiers',
      CONST_DOMAINE_MAITREDESCLES = 'MaitreDesCles',
      CONST_DOMAINE_FICHIERS = 'fichiers',
      CONST_DOMAINE_TOPOLOGIE = 'CoreTopologie',
      CONST_DOMAINE_CATALOGUES = 'CoreCatalogues',
      CONST_DOMAINE_COREPKI = 'CorePki',
      CONST_DOMAINE_MAITREDESCOMPTES = 'CoreMaitreDesComptes',
      CONST_DOMAINE_MESSAGERIE = 'Messagerie'

const ROUTING_KEYS_FICHIERS = [
    //'evenement.grosfichiers.majFichier',
]

const ROUTING_KEYS_COLLECTIONS = [
    //'evenement.grosfichiers.majCollection',
]

// const EVENEMENTS_SUPPORTES = [
// ...ROUTING_KEYS_FICHIERS,
// ...ROUTING_KEYS_COLLECTIONS,
// ]

let _certificatMaitreCles = null,
    _domainesApplications = null

function challenge(socket, params) {
    // Repondre avec un message signe
    const reponse = {
        reponse: params.challenge,
        message: 'Trust no one',
        nomUsager: socket.nomUsager,
        userId: socket.userId,
    }
    return socket.amqpdao.pki.formatterMessage(reponse, 'challenge', {kind: MESSAGE_KINDS.KIND_DOCUMENT, ajouterCertificat: true})
}

async function getClesChiffrage(socket, params) {
    let certificatMaitreCles = _certificatMaitreCles
    if(!certificatMaitreCles) {
        debug("Requete pour certificat maitre des cles")

        try {
            certificatMaitreCles = await socket.amqpdao.transmettreRequete(
                CONST_DOMAINE_MAITREDESCLES, {}, 
                {action: 'certMaitreDesCles', decoder: true}
            )

            // TTL
            setTimeout(()=>{_certificatMaitreCles=null}, 120_000)
        } catch(err) {
            console.error("mqdao.transmettreRequete ERROR : %O", err)
            return {ok: false, err: ''+err}
        }
    
        // certificatMaitreCles = await transmettreRequete(socket, params, 'certMaitreDesCles', {domaine: CONST_DOMAINE_MAITREDESCLES})
        _certificatMaitreCles = certificatMaitreCles
    }
    return certificatMaitreCles
}

// function getProfil(socket, params) {
//     return transmettreRequete(socket, params, 'getProfil')
// }

function installerApplication(socket, commande) {
    debug("Installer application : %O", commande)
    const contenu = JSON.parse(commande.contenu)
    return transmettreCommande(socket, commande, 'installerApplication', {exchange: contenu.exchange, noformat: true})
}

function demarrerApplication(socket, commande) {
    debug("Demarrer application : %O", commande)
    const contenu = JSON.parse(commande.contenu)
    return transmettreCommande(socket, commande, 'demarrerApplication', {exchange: contenu.exchange, noformat: true})
}

function arreterApplication(socket, commande) {
    debug("Arreter application : %O", commande)
    const contenu = JSON.parse(commande.contenu)
    return transmettreCommande(socket, commande, 'arreterApplication', {exchange: contenu.exchange, noformat: true})
}

function supprimerApplication(socket, commande) {
    debug("Supprimer application %O", commande)
    const contenu = JSON.parse(commande.contenu)
    return transmettreCommande(socket, commande, 'supprimerApplication', {exchange: contenu.exchange, noformat: true})
}  

function requeteConfigurationApplication(socket, requete) {
    debug("Requete configuration application application %O", requete)
    return transmettreRequete(
        socket, requete, 'requeteConfigurationApplication', 
        {domaine: 'instance', exchange: requete.exchange, partition: requete.instanceId}
    )
}

function ajouterCatalogueApplication(socket, commande) {
    debug("Ajouter catalogue application %O", commande)
    return transmettreCommande(socket, commande, 'ajouterCatalogueApplication')
}

function configurerApplication(socket, commande) {
    debug("Configurer application %O", commande)
    return transmettreCommande(socket, commande, 'configurerApplication', {exchange: commande.exchange})
}

function transmettreCatalogues(socket, commande) {
    debug("Transmettre catalogue %O", commande)
    return transmettreCommande(socket, commande, 'transmettreCatalogues')
}

function majMonitor(socket, commande) {
    return transmettreCommande(socket, commande, 'instance', {domaine: CONST_DOMAINE_TOPOLOGIE, exchange: commande.exchange})
}

function supprimerInstance(socket, commande) {
    return transmettreCommande(socket, commande, 'supprimerInstance', {domaine: CONST_DOMAINE_TOPOLOGIE})
}

function requeteConfigurationAcme(socket, requete) {
    debug("requeteConfigurationAcme %O", requete)
    const partition = requete['en-tete'].partition
    return transmettreRequete(socket, requete, 'configurationAcme', {domaine: DOMAINE_INSTANCE, partition, exchange: '1.public'})
}

function configurerDomaineAcme(socket, requete) {
    debug("configurerDomaineAcme %O", requete)
    const partition = requete['en-tete'].partition,
          exchange = requete.securite
    return transmettreCommande(socket, requete, 'configurerDomaine', {domaine: DOMAINE_INSTANCE, partition, exchange})
}

function resetClesNonDechiffrables(socket, commande) {
    debug("resetClesNonDechiffrables %O", commande)
    return transmettreCommande(socket, commande, 'resetNonDechiffrable', {domaine: CONST_DOMAINE_MAITREDESCLES, exchange: '3.protege'})
}

function rechiffrerClesBatch(socket, commande) {
    debug("rechiffrerClesBatch %O", commande)
    return transmettreCommande(socket, commande, 'rechiffrerBatch', {domaine: CONST_DOMAINE_MAITREDESCLES, exchange: '3.protege'})
}

function getConfigurationFichiers(socket, requete) {
    debug("getConfigurationFichiers %O", requete)
    return transmettreRequete(
        socket, requete, 'getConfigurationFichiers', 
        {domaine: 'CoreTopologie', exchange: '3.protege'}
    )
}

function getPublicKeySsh(socket, requete) {
    debug("getPublicKeySsh %O", requete)
    return transmettreRequete(
        socket, requete, 'getPublicKeySsh', 
        {domaine: 'fichiers', exchange: '2.prive'}
    )
}

async function modifierConfigurationConsignation(socket, commande) {
    debug("modifierConfigurationConsignation %O", commande)
    const commandeMaitredescles = commande['_commandeMaitredescles']
    if(commandeMaitredescles) {
        delete commande['_commandeMaitredescles']  // Cleanup
        const reponse = await transmettreCommande(
            socket, commandeMaitredescles, 'sauvegarderCle', 
            {domaine: 'MaitreDesCles', exchange: '3.protege', partition: commandeMaitredescles['_partition']}
        )
        if(reponse.ok !== true) {
            return reponse
        }
    }
    return transmettreCommande(socket, commande, 'configurerConsignation', {domaine: CONST_DOMAINE_TOPOLOGIE, exchange: '3.protege'})
}

function setFichiersPrimaire(socket, commande) {
    debug("setFichiersPrimaire %O", commande)
    return transmettreCommande(socket, commande, 'setFichiersPrimaire', {domaine: CONST_DOMAINE_TOPOLOGIE, exchange: '3.protege'})
}

function declencherSync(socket, commande) {
    debug("declencherSync %O", commande)
    return transmettreCommande(socket, commande, 'declencherSync', {domaine: CONST_DOMAINE_FICHIERS, exchange: '2.prive'})
}

function demarrerBackupTransactions(socket, commande) {
    debug("demarrerBackupTransactions %O", commande)
    return transmettreCommande(socket, commande, 'demarrerBackupTransactions', {domaine: CONST_DOMAINE_FICHIERS, exchange: '2.prive'})
}

function getCles(socket, requete) {
    return transmettreRequete(socket, requete, 'dechiffrage', {domaine: CONST_DOMAINE_MAITREDESCLES, exchange: '2.prive'})
}

function getConfigurationNotifications(socket, requete) {
    return transmettreRequete(
        socket, requete, 'getConfigurationNotifications', 
        {domaine: CONST_DOMAINE_MESSAGERIE, exchange: '1.public'}
    )
}

function conserverConfigurationNotifications(socket, requete) {
    return transmettreCommande(
        socket, requete, 'conserverConfigurationNotifications', 
        {domaine: CONST_DOMAINE_MESSAGERIE, exchange: '3.protege'}
    )
}

function genererClewebpushNotifications(socket, requete) {
    return transmettreCommande(
        socket, requete, 'genererClewebpushNotifications', 
        {domaine: CONST_DOMAINE_MESSAGERIE, exchange: '3.protege'}
    )
}

function requeteListeNoeuds(socket, params) {
    return transmettreRequete(socket, params, 'listeNoeuds', {domaine: CONST_DOMAINE_TOPOLOGIE})
}
  
function requeteListeDomaines(socket, params) {
    return transmettreRequete(socket, params, 'listeDomaines', {domaine: CONST_DOMAINE_TOPOLOGIE})
}

function requeteCatalogueApplications(socket, params) {
    return transmettreRequete(socket, params, 'listeApplications', {domaine: CONST_DOMAINE_CATALOGUES})
}

function requeteInfoApplications(socket, params) {
    return transmettreRequete(socket, params, 'infoApplication', {domaine: CONST_DOMAINE_CATALOGUES})
}

function requeteListeUsagers(socket, params) {
    return transmettreRequete(socket, params, 'getListeUsagers', {domaine: CONST_DOMAINE_MAITREDESCOMPTES})
}

function requeteUsager(socket, params) {
    return transmettreRequete(socket, params, 'chargerUsager', {domaine: CONST_DOMAINE_MAITREDESCOMPTES})
}

function resetWebauthnUsager(socket, params) {
    return transmettreCommande(socket, params, 'resetWebauthnUsager', {domaine: CONST_DOMAINE_MAITREDESCOMPTES})
}

function requeteClesNonDechiffrables(socket, params) {
    return transmettreRequete(socket, params, 'clesNonDechiffrables', {domaine: CONST_DOMAINE_MAITREDESCLES})
}

function requeteCompterClesNonDechiffrables(socket, params) {
    return transmettreRequete(socket, params, 'compterClesNonDechiffrables', {domaine: CONST_DOMAINE_MAITREDESCLES})
}

function commandeCleRechiffree(socket, params) {
    return transmettreCommande(socket, params, 'sauvegarderCle', {domaine: CONST_DOMAINE_MAITREDESCOMPTES})
}

function genererCertificatNoeud(socket, params) {
    return transmettreCommande(socket, params, 'signerCsr', {domaine: CONST_DOMAINE_COREPKI})
}

function configurerConsignationWeb(socket, params) {
    return transmettreCommande(socket, params, 'configurerConsignationWeb', {domaine: CONST_DOMAINE_COREPKI})
}

function majDelegations(socket, params) {
    return transmettreCommande(socket, params, 'majUsagerDelegations', {domaine: CONST_DOMAINE_MAITREDESCOMPTES})
}

function majDelegations(socket, params) {
    return transmettreCommande(socket, params, 'majUsagerDelegations', {domaine: CONST_DOMAINE_MAITREDESCOMPTES})
}

// Fonctions generiques

async function transmettreRequete(socket, params, action, opts) {
    opts = opts || {}
    const domaine = opts.domaine || DOMAINE_MONITOR
    const exchange = opts.exchange || L3Protege
    const partition = opts.partition
    try {
        verifierMessage(params, domaine, action)
        const reponse = await socket.amqpdao.transmettreRequete(
            domaine, 
            params, 
            {action, partition, exchange, noformat: true, decoder: true}
        )
        console.debug("!!! REQUETE REPONSE ", reponse)
        return reponse
    } catch(err) {
        console.error("mqdao.transmettreRequete ERROR : %O", err)
        return {ok: false, err: ''+err}
    }
}

async function transmettreCommande(socket, params, action, opts) {
    opts = opts || {}
    const domaine = opts.domaine || DOMAINE_MONITOR
    const exchange = opts.exchange || L3Protege
    const nowait = opts.nowait
    const partition = opts.partition || params.routage.partition
    try {
        verifierMessage(params, domaine, action)
        return await socket.amqpdao.transmettreCommande(
            domaine, 
            params, 
            {action, partition, exchange, noformat: true, decoder: true, nowait}
        )
    } catch(err) {
        console.error("mqdao.transmettreCommande ERROR : %O", err)
        return {ok: false, err: ''+err}
    }
}

/* Fonction de verification pour eviter abus de l'API */
function verifierMessage(message, domaine, action) {
    const routage = message.routage || {},
          domaineRecu = routage.domaine,
          actionRecue = routage.action
    if(domaineRecu !== domaine) throw new Error(`Mismatch domaine (${domaineRecu} !== ${domaine})"`)
    if(actionRecue !== action) throw new Error(`Mismatch action (${actionRecue} !== ${action})"`)
}

module.exports = {
    challenge, getClesChiffrage,
    transmettreCatalogues,
    installerApplication, demarrerApplication, arreterApplication, supprimerApplication,
    ajouterCatalogueApplication, requeteConfigurationApplication, configurerApplication, supprimerInstance,
    resetClesNonDechiffrables, rechiffrerClesBatch, getConfigurationFichiers, getPublicKeySsh,
    modifierConfigurationConsignation, setFichiersPrimaire, declencherSync, demarrerBackupTransactions,

    majMonitor, requeteConfigurationAcme, configurerDomaineAcme, getCles, getConfigurationNotifications,
    conserverConfigurationNotifications, genererClewebpushNotifications,

    requeteListeNoeuds, requeteListeDomaines, requeteCatalogueApplications, requeteInfoApplications,
    requeteListeUsagers, requeteUsager, resetWebauthnUsager, 
    requeteClesNonDechiffrables, requeteCompterClesNonDechiffrables, commandeCleRechiffree,
    genererCertificatNoeud, configurerConsignationWeb, majDelegations,

    // ecouterMajFichiers, ecouterMajCollections, ecouterTranscodageProgres, 
    // retirerTranscodageProgres, 
}
