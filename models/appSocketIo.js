var fs = require('fs');
const debug = require('debug')('millegrilles:coupdoeil:coupdoeilSocketApp')

function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'coupdoeil/requeteListeNoeuds', callback: (params, cb) => {requeteListeNoeuds(socket, params, cb)}},
      {eventName: 'coupdoeil/requeteListeDomaines', callback: cb => {requeteListeDomaines(socket, cb)}},
      {eventName: 'coupdoeil/requeteCatalogueDomaines', callback: cb => {requeteCatalogueDomaines(socket, cb)}},
      {eventName: 'coupdoeil/requeteCatalogueApplications', callback: cb => {requeteCatalogueApplications(socket, cb)}},
      {eventName: 'coupdoeil/requeteInfoApplications', callback: (params, cb) => {requeteInfoApplications(socket, params, cb)}},
      {eventName: 'coupdoeil/getCertificatsMaitredescles', callback: cb => {getCertificatsMaitredescles(socket, cb)}},
      {eventName: 'coupdoeil/getUploadsEnCours', callback: cb => {getUploadsEnCours(socket, cb)}},
      {eventName: 'coupdoeil/getDocumentParFuuid', callback: (params, cb) => {getDocumentParFuuid(socket, params, cb)}},

    ],
    listenersProteges: [
      {eventName: 'coupdoeil/ajouterCatalogueApplication', callback: (transaction, cb) => {
        ajouterCatalogueApplication(socket, transaction, cb)
      }},
      {eventName: 'coupdoeil/requeteClesNonDechiffrables', callback: (params, cb) => {
        requeteClesNonDechiffrables(socket, params, cb)
      }},
      {eventName: 'coupdoeil/requeteCompterClesNonDechiffrables', callback: (transactions, cb) => {
        requeteCompterClesNonDechiffrables(socket, transactions, cb)
      }},
      {eventName: 'coupdoeil/transactionCleRechiffree', callback: (commande, cb) => {
        commandeCleRechiffree(socket, commande, cb)
      }},
      {eventName: 'coupdoeil/restaurationChargerCles', callback: (params, cb) => {
        restaurationChargerCles(socket, params, cb)
      }},
      {eventName: 'coupdoeil/restaurationDomaines', callback: (params, cb) => {
        restaurationDomaines(socket, params, cb)
      }},
      {eventName: 'coupdoeil/restaurationGrosfichiers', callback: (params, cb) => {
        restaurationGrosfichiers(socket, params, cb)
      }},
      {eventName: 'coupdoeil/backupApplication', callback: (params, cb) => {
        backupApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/restaurerApplication', callback: (params, cb) => {
        restaurerApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/installerApplication', callback: (params, cb) => {
        installerApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/installerDomaine', callback: (params, cb) => {
        installerDomaine(socket, params, cb)
      }},
      {eventName: 'coupdoeil/lancerBackupSnapshot', callback: (params, cb) => {
        lancerBackupSnapshot(socket, params, cb)
      }},
      {eventName: 'coupdoeil/genererCertificatNoeud', callback: (params, cb) => {
        genererCertificatNoeud(socket, params, cb)
      }},
      {eventName: 'coupdoeil/desinstallerApplication', callback: (params, cb) => {
        desinstallerApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/requeteConfigurationApplication', callback: (params, cb) => {
        requeteConfigurationApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/configurerApplication', callback: (params, cb) => {
        configurerApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/demarrerApplication', callback: (params, cb) => {
        demarrerApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/regenererPreviews', callback: (params, cb) => {
        regenererPreviews(socket, params, cb)
      }},
      {eventName: 'coupdoeil/configurerConsignationWeb', callback: (params, cb) => {
        configurerConsignationWeb(socket, params, cb)
      }},
      {eventName: 'coupdoeil/soumettreTransactionMaitredescles', callback: (params, cb) => {
        soumettreTransactionMaitredescles(socket, params, cb)
      }},
      {eventName: 'coupdoeil/clearFichierPublie', callback: (commande, cb) => {
        clearFichierPublie(socket, commande, cb)
      }},
      {eventName: 'coupdoeil/uploadCollectionsPubliques', callback: (commande, cb) => {
        uploadCollectionsPubliques(socket, commande, cb)
      }},
      {eventName: 'coupdoeil/commandeTransmettreCatalogues', callback: (commande, cb) => {
        commandeTransmettreCatalogues(socket, commande, cb)
      }},
    ]
  }

  return configurationEvenements
}

function traiterTransaction(rabbitMQ, message, cb) {
  // console.log("Message");
  // console.log(message);
  let routingKey = message.routingKey;
  let transaction = message.transaction;
  let opts = message.opts;
  rabbitMQ.transmettreTransactionFormattee(
    transaction, routingKey, opts
  ).then(messageReponse=>{
    cb(messageReponse);
  }).catch(err =>{
    console.error("Erreur transmission transaction");
    console.error(err);
    cb({'err': err.toString()});
  })
}

async function ajouterCatalogueApplication(socket, transaction, cb) {
  // Ajout d'un catalogue d'application avec transaction preformattee
  console.debug("Recu ajouterCatalogueApplication : %O", transaction)
  try {
    if(transaction['en-tete'].domaine === 'CatalogueApplications.catalogueApplication') {
      const amqpdao = socket.amqpdao
      const reponse = await amqpdao.transmettreEnveloppeTransaction(transaction)
      return cb(reponse)
    } else {
      // Par defaut
      cb({err: 'Mauvais domaine pour ajouterCatalogueApplication : ' + transaction.domaine})
    }
  } catch(err) {
    console.error("ajouterCatalogueApplication %O", err)
    cb({err: ''+err})
  }

}

async function requeteClesNonDechiffrables(socket, params, cb) {
  const domaineAction = 'MaitreDesCles.clesNonDechiffrables'
  try {
    const amqpdao = socket.amqpdao
    const reponse = await amqpdao.transmettreRequete(domaineAction, {...params})
    return cb(reponse)
  } catch(err) {
    return cb({err})
  }
}

async function requeteCompterClesNonDechiffrables(socket, params, cb) {
  const domaineAction = 'MaitreDesCles.compterClesNonDechiffrables'
  try {
    const amqpdao = socket.amqpdao
    const reponse = await amqpdao.transmettreRequete(domaineAction, params)
    return cb(reponse)
  } catch(err) {
    return cb({err})
  }
}

async function commandeCleRechiffree(socket, commande, cb) {
  debug("Commande cle rechiffree : %O", commande)
  const amqpdao = socket.amqpdao
  const reponses = []
  try {
    const domaineAction = 'commande.MaitreDesCles.sauvegarderCle'
    await amqpdao.transmettreCommande(domaineAction, commande, {noformat: true})
    return cb(reponses)
  } catch(err) {
    return cb({err})
  }
}

function traiterCommande(rabbitMQ, enveloppe, cb) {
  // console.debug("Enveloppe de commande recue");
  // console.debug(enveloppe);
  let routingKey = enveloppe.routingKey;
  let commande = enveloppe.commande;
  let nowait = !cb;

  let params = {nowait}
  if(enveloppe.exchange) params.exchange = enveloppe.exchange

  rabbitMQ.transmettreCommande(routingKey, commande, params)
    .then( reponse => {
      if(reponse) {
        if(cb) {
          cb(reponse.resultats || reponse); // On transmet juste les resultats
        }
      } else {
        if(!nowait) {
          console.error("Erreur reception reponse commande " + routingKey);
        }
      }
    })
    .catch( err => {
      console.error("Erreur commande");
      console.error(err);
      if(cb) {
        cb(); // Callback sans valeurs
      }
    });
}

function extraireClePubliqueMaitredescles(rabbitMQ) {
  return rabbitMQ.demanderCertificatMaitreDesCles()
  .then(certificat=>{
    // console.debug("Certificat maitredescles");
    // console.debug(certificat);

    const infoCertificat = rabbitMQ.pki.extraireClePubliqueFingerprint(certificat);

    // console.debug(infoCertificat);
    return infoCertificat;
  })
}

async function restaurationChargerCles(socket, commande, cb) {
  debug("Restaurer cles maitredescles : %O", commande)
  const amqpdao = socket.amqpdao
  const domaineAction = 'commande.MaitreDesCles.restaurerTransactions'

  try {
    let params = {exchange: '3.protege'}
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    cb(reponse)
  } catch(err) {
    console.error("restaurationChargerCles: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function restaurationDomaines(socket, commande, cb) {
  debug("Restaurer transactions de tous les domaines")
  const amqpdao = socket.amqpdao
  const domaineAction = 'commande.global.restaurerTransactions'
  try {
    let params = {exchange: '3.protege'}
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    cb(reponse)
  } catch(err) {
    console.error("restaurationDomaines: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function restaurationGrosfichiers(socket, commande, cb) {
  debug("Restaurer grosfichiers")
  const amqpdao = socket.amqpdao
  const domaineAction = 'commande.backup.restaurerGrosFichiers'
  try {
    let params = {exchange: '3.protege'}
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    cb(reponse)
  } catch(err) {
    console.error("restaurationGrosfichiers: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function backupApplication(socket, commande, cb) {
  const amqpdao = socket.amqpdao
  const noeudId = commande.noeudId
  debug("Backup application %s sur noeud %s", noeudId)
  const domaineAction = `commande.servicemonitor.${noeudId}.backupApplication`
  try {
    let params = {exchange: commande.securite || '3.protege'}
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    cb(reponse)
  } catch(err) {
    console.error("backupApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function restaurerApplication(socket, commande, cb) {
  debug("Restaurer application")
  const amqpdao = socket.amqpdao
  const noeudId = commande.noeudId
  const domaineAction = `commande.servicemonitor.${noeudId}.restoreApplication`
  try {
    let params = {exchange: commande.securite || '3.protege'}
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    cb(reponse)
  } catch(err) {
    console.error("restaurerApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function installerApplication(socket, commande, cb) {
  debug("Installer application : %O", commande)
  const amqpdao = socket.amqpdao
  const domaineAction = ['servicemonitor', commande.noeudId ,'installerApplication'].join('.')
  try {
    let params = {exchange: commande.exchange}
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande, params)
    cb(reponse)
  } catch(err) {
    console.error("installerApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function installerDomaine(socket, commande, cb) {
  debug("Installer domaine : %O", commande)
  const amqpdao = socket.amqpdao
  const domaineAction = 'domaines.demarrer'
  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    cb(reponse)
  } catch(err) {
    console.error("installerApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function lancerBackupSnapshot(socket, commande, cb) {
  debug("Lancer backup snapshot : %O", commande)
  const amqpdao = socket.amqpdao
  const domaineAction = 'global.declencherBackupSnapshot'
  try {
    // Commande nowait - c'est un broadcast (global), il faut capturer les
    // evenements de demarrage individuels (evenement.backup.backupTransactions)
    // pour savoir quels domaines ont repondu
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande, {nowait: true})
    cb(reponse)
  } catch(err) {
    console.error("lancerBackupSnapshot: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function genererCertificatNoeud(socket, commande, cb) {
  debug("Generer nouveau certificat de noeud : %O", commande)

  const amqpdao = socket.amqpdao
  const domaineAction = 'servicemonitor.signerNoeud'

  try {
    // Commande nowait - c'est un broadcast (global), il faut capturer les
    // evenements de demarrage individuels (evenement.backup.backupTransactions)
    // pour savoir quels domaines ont repondu
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande, {attacherCertificat: true})
    debug("genererCertificatNoeud: Reponse demande certificat\n%O", reponse)

    const certificatPem = reponse.cert
    const chaine = reponse.fullchain

    cb({certificatPem, chaine})
  } catch(err) {
    console.error("genererCertificatNoeud: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function desinstallerApplication(socket, commande, cb) {
  debug("Desinstaller application %O", commande)

  const amqpdao = socket.amqpdao
  const domaineAction = ['servicemonitor', commande.noeudId ,'supprimerApplication'].join('.')

  try {
    // Commande nowait - c'est un broadcast (global), il faut capturer les
    // evenements de demarrage individuels (evenement.backup.backupTransactions)
    // pour savoir quels domaines ont repondu
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande, {exchange: commande.exchange})
    debug("desinstallerApplication: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("desinstallerApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function requeteConfigurationApplication(socket, params, cb) {
  debug("Requete configuration %O", params)
  const amqpdao = socket.amqpdao
  const domaineAction = ['servicemonitor', params.noeud_id ,'requeteConfigurationApplication'].join('.')
  try {
    // Commande nowait - c'est un broadcast (global), il faut capturer les
    // evenements de demarrage individuels (evenement.backup.backupTransactions)
    // pour savoir quels domaines ont repondu
    const reponse = await amqpdao.transmettreCommande(domaineAction, params, {exchange: params.exchange})
    debug("requeteConfigurationApplication: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("requeteConfigurationApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function configurerApplication(socket, params, cb) {
  debug("Configurer application %s sur noeud %s", params.nom_application, params.noeud_id)
  const amqpdao = socket.amqpdao
  const domaineAction = ['servicemonitor', params.noeud_id ,'configurerApplication'].join('.')
  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, params, {exchange: params.exchange})
    debug("configurerApplication: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("configurerApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function demarrerApplication(socket, params, cb) {
  debug("Demarrer application %O", params)
  const amqpdao = socket.amqpdao
  const domaineAction = ['servicemonitor', params.noeud_id ,'demarrerApplication'].join('.')
  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, params, {exchange: params.exchange})
    debug("demarrerApplication: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("demarrerApplication: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function regenererPreviews(socket, params, cb) {
  debug("Regenerer previews %O", params)
  const amqpdao = socket.amqpdao
  const domaineAction = 'commande.GrosFichiers.regenererPreviews'
  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, params)
    debug("regenererPreviews: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("regenererPreviews: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function configurerConsignationWeb(socket, params, cb) {
  debug("Configurer consignation web %O", params)
  const amqpdao = socket.amqpdao
  const domaineAction = params['en-tete'].domaine

  if(domaineAction !== 'Topologie.configurerConsignationWeb') {
    return cb({err: "Mauvais type d'action : " + domaineAction})
  }

  try {
    const reponse = await amqpdao.transmettreEnveloppeTransaction(params)
    debug("configurerConsignationWeb: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("configurerConsignationWeb: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function soumettreTransactionMaitredescles(socket, params, cb) {
  debug("Soumettre transaction maitredescles %O", params)
  const amqpdao = socket.amqpdao

  const domaineAction = params['en-tete'].domaine
  if ( ! domaineAction.startsWith('MaitreDesCles.') ) {
    return cb({err: "Mauvais type d'action : " + domaineAction})
  }

  try {
    const reponse = await amqpdao.transmettreEnveloppeTransaction(params)
    debug("soumettreTransactionMaitredescles: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("soumettreTransactionMaitredescles: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function clearFichierPublie(socket, commande, cb) {
  debug("Clear fichier publie %O", commande)
  const amqpdao = socket.amqpdao

  const domaineAction = commande['en-tete'].domaine
  if ( domaineAction !== 'GrosFichiers.clearFichierPublie' ) {
    return cb({err: "Mauvais type d'action : " + domaineAction})
  }

  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    debug("clearFichierPublie: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("clearFichierPublie: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function uploadCollectionsPubliques(socket, commande, cb) {
  debug("Upload collections publiques %O", commande)
  const amqpdao = socket.amqpdao

  const domaineAction = commande['en-tete'].domaine
  if ( domaineAction !== 'GrosFichiers.uploadCollectionsPubliques' ) {
    return cb({err: "Mauvais type d'action : " + domaineAction})
  }

  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    debug("uploadCollectionsPubliques: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("uploadCollectionsPubliques: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function commandeTransmettreCatalogues(socket, commande, cb) {
  debug("Commande retransmettre collections %O", commande)
  const amqpdao = socket.amqpdao

  const domaineAction = commande['en-tete'].domaine
  if ( domaineAction !== 'servicemonitor.transmettreCatalogues' ) {
    return cb({err: "Mauvais type d'action : " + domaineAction})
  }

  try {
    const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
    debug("commandeTransmettreCatalogues: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("commandeTransmettreCatalogues: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function executerRequete(domaineAction, socket, params, cb) {
  const amqpdao = socket.amqpdao
  try {
    const reponse = await amqpdao.transmettreRequete(domaineAction, params, {decoder: true})
    cb(reponse)
  } catch(err) {
    debug("Erreur executerRequete\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

function requeteListeNoeuds(socket, params, cb) {
  executerRequete('Topologie.listeNoeuds', socket, params, cb)
}

function requeteListeDomaines(socket, cb) {
  executerRequete('Topologie.listeDomaines', socket, {}, cb)
}

function requeteCatalogueDomaines(socket, cb) {
  executerRequete('CatalogueApplications.listeDomaines', socket, {}, cb)
}

function requeteCatalogueApplications(socket, cb) {
  executerRequete('CatalogueApplications.listeApplications', socket, {}, cb)
}

function requeteInfoApplications(socket, params, cb) {
  executerRequete('CatalogueApplications.infoApplication', socket, params, cb)
}

function getCertificatsMaitredescles(socket, cb) {
  executerRequete('MaitreDesCles.certMaitreDesCles', socket, {}, cb)
}

function getUploadsEnCours(socket, cb) {
  executerRequete('GrosFichiers.transfertsEnCours', socket, {}, cb)
}

function getDocumentParFuuid(socket, params, cb) {
  executerRequete('GrosFichiers.documentsParFuuid', socket, params, cb)
}

module.exports = {configurerEvenements}