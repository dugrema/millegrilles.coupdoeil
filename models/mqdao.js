const debug = require('debug')('mqdao')

const L2Prive = '2.prive',
      L3Protege = '3.protege'

const DOMAINE_MONITOR = 'monitor',
      CONST_DOMAINE_GROSFICHIERS = 'GrosFichiers',
      CONST_DOMAINE_MAITREDESCLES = 'MaitreDesCles',
      CONST_DOMAINE_FICHIERS = 'fichiers',
      CONST_DOMAINE_TOPOLOGIE = 'CoreTopologie'

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
    return socket.amqpdao.pki.formatterMessage(reponse, 'challenge', {ajouterCertificat: true})
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
    return transmettreCommande(socket, commande, 'installerApplication', {exchange: commande.exchange})
}

function demarrerApplication(socket, commande) {
    debug("Installer application : %O", commande)
    return transmettreCommande(socket, commande, 'demarrerApplication', {exchange: commande.exchange})
}

function supprimerApplication(socket, commande) {
    debug("Supprimer application %O", commande)
    return transmettreCommande(socket, commande, 'supprimerApplication', {exchange: commande.exchange})
}  

function requeteConfigurationApplication(socket, requete) {
    debug("Requete configuration application application %O", requete)
    return transmettreRequete(
        socket, requete, 'requeteConfigurationApplication', 
        {domaine: 'monitor', exchange: requete.exchange, partition: requete.instanceId}
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
    debug("Maj monitor %O", commande)
    return transmettreCommande(socket, commande, 'monitor', {domaine: CONST_DOMAINE_TOPOLOGIE, exchange: commande.exchange})
}

function supprimerInstance(socket, commande) {
    debug("Maj monitor %O", commande)
    return transmettreCommande(socket, commande, 'supprimerInstance', {domaine: CONST_DOMAINE_TOPOLOGIE})
}

function requeteConfigurationAcme(socket, requete) {
    debug("requeteConfigurationAcme %O", requete)
    const partition = requete['en-tete'].partition
    return transmettreRequete(socket, requete, 'configurationAcme', {domaine: DOMAINE_MONITOR, partition, exchange: '1.public'})
}

function configurerDomaineAcme(socket, requete) {
    debug("configurerDomaineAcme %O", requete)
    const partition = requete['en-tete'].partition,
          exchange = requete.securite
    return transmettreCommande(socket, requete, 'configurerDomaine', {domaine: DOMAINE_MONITOR, partition, exchange})
}

function resetClesNonDechiffrables(socket, commande) {
    debug("resetClesNonDechiffrables %O", commande)
    return transmettreCommande(socket, commande, 'resetNonDechiffrable', {domaine: CONST_DOMAINE_MAITREDESCLES, exchange: '3.protege'})
}

function rechiffrerClesBatch(socket, commande) {
    debug("rechiffrerClesBatch %O", commande)
    return transmettreCommande(socket, commande, 'rechiffrerBatch', {domaine: CONST_DOMAINE_MAITREDESCLES, exchange: '3.protege'})
}

function getConfigurationConsignation(socket, requete) {
    debug("getConfigurationConsignation %O", requete)
    return transmettreRequete(
        socket, requete, 'getConfiguration', 
        {domaine: 'fichiers', exchange: '2.prive'}
    )
}

function getPublicKeySsh(socket, requete) {
    debug("getPublicKeySsh %O", requete)
    return transmettreRequete(
        socket, requete, 'getPublicKeySsh', 
        {domaine: 'fichiers', exchange: '2.prive'}
    )
}

// Fonctions generiques

async function transmettreRequete(socket, params, action, opts) {
    opts = opts || {}
    const domaine = opts.domaine || DOMAINE_MONITOR
    const exchange = opts.exchange || L3Protege
    const partition = opts.partition
    try {
        verifierMessage(params, domaine, action)
        return await socket.amqpdao.transmettreRequete(
            domaine, 
            params, 
            {action, partition, exchange, noformat: true, decoder: true}
        )
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
    const partition = opts.partition || params['en-tete'].partition
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
    const entete = message['en-tete'] || {},
          domaineRecu = entete.domaine,
          actionRecue = entete.action
    if(domaineRecu !== domaine) throw new Error(`Mismatch domaine (${domaineRecu} !== ${domaine})"`)
    if(actionRecue !== action) throw new Error(`Mismatch action (${actionRecue} !== ${action})"`)
}


module.exports = {
    challenge, getClesChiffrage,
    transmettreCatalogues,
    installerApplication, demarrerApplication, supprimerApplication,
    ajouterCatalogueApplication, requeteConfigurationApplication, configurerApplication, supprimerInstance,
    resetClesNonDechiffrables, rechiffrerClesBatch, getConfigurationConsignation, getPublicKeySsh,

    majMonitor, requeteConfigurationAcme, configurerDomaineAcme,
    
    // ecouterMajFichiers, ecouterMajCollections, ecouterTranscodageProgres, 
    // retirerTranscodageProgres, 
}
