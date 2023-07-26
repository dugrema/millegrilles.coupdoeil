var fs = require('fs');
const debug = require('debug')('millegrilles:coupdoeil:mqdao')
const mqdao = require('./mqdao.js')

function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      // {eventName: 'coupdoeil/getCertificatsMaitredescles', callback: cb => {getCertificatsMaitredescles(socket, cb)}}, // obsolete, utiliser getClesChiffrage
    ],
    listenersProteges: [
      // {eventName: 'getClesChiffrage', callback: (params, cb) => traiter(socket, mqdao.getClesChiffrage, {params, cb})},

      {eventName: 'coupdoeil/installerApplication', callback: (params, cb) => traiter(socket, mqdao.installerApplication, {params, cb}) },
      {eventName: 'coupdoeil/demarrerApplication', callback: (params, cb) => { traiter(socket, mqdao.demarrerApplication, {params, cb}) }},
      {eventName: 'coupdoeil/arreterApplication', callback: (params, cb) => { traiter(socket, mqdao.arreterApplication, {params, cb}) }},
      {eventName: 'coupdoeil/supprimerApplication', callback: (params, cb) => { traiter(socket, mqdao.supprimerApplication, {params, cb}) }},
      {eventName: 'coupdoeil/requeteConfigurationApplication', callback: (params, cb) => { traiter(socket, mqdao.requeteConfigurationApplication, {params, cb}) }},
      {eventName: 'coupdoeil/ajouterCatalogueApplication', callback: (params, cb) => { traiter(socket, mqdao.ajouterCatalogueApplication, {params, cb}) }},
      {eventName: 'coupdoeil/configurerApplication', callback: (params, cb) => { traiter(socket, mqdao.configurerApplication, {params, cb}) }},
      {eventName: 'coupdoeil/transmettreCatalogues', callback: (params, cb) => { traiter(socket, mqdao.transmettreCatalogues, {params, cb}) }},
      {eventName: 'coupdoeil/requeteConfigurationAcme', callback: (params, cb) => { traiter(socket, mqdao.requeteConfigurationAcme, {params, cb}) }},
      {eventName: 'coupdoeil/configurerDomaineAcme', callback: (params, cb) => { traiter(socket, mqdao.configurerDomaineAcme, {params, cb}) }},

      {eventName: 'coretopologie/majMonitor', callback: (params, cb) => { traiter(socket, mqdao.majMonitor, {params, cb}) }},
      {eventName: 'coretopologie/supprimerInstance', callback: (params, cb) => { traiter(socket, mqdao.supprimerInstance, {params, cb}) }},
      {eventName: 'resetClesNonDechiffrables', callback: (params, cb) => { traiter(socket, mqdao.resetClesNonDechiffrables, {params, cb}) }},
      {eventName: 'rechiffrerClesBatch', callback: (params, cb) => { traiter(socket, mqdao.rechiffrerClesBatch, {params, cb}) }},
      {eventName: 'getConfigurationFichiers', callback: (params, cb) => { traiter(socket, mqdao.getConfigurationFichiers, {params, cb}) }},
      {eventName: 'getPublicKeySsh', callback: (params, cb) => { traiter(socket, mqdao.getPublicKeySsh, {params, cb}) }},
      {eventName: 'modifierConfigurationConsignation', callback: (params, cb) => { traiter(socket, mqdao.modifierConfigurationConsignation, {params, cb}) }},
      {eventName: 'setFichiersPrimaire', callback: (params, cb) => { traiter(socket, mqdao.setFichiersPrimaire, {params, cb}) }},
      {eventName: 'declencherSync', callback: (params, cb) => { traiter(socket, mqdao.declencherSync, {params, cb}) }},
      {eventName: 'demarrerBackupTransactions', callback: (params, cb) => { traiter(socket, mqdao.demarrerBackupTransactions, {params, cb}) }},
      {eventName: 'reindexerConsignation', callback: (params, cb) => { traiter(socket, mqdao.reindexerConsignation, {params, cb}) }},
      {eventName: 'getCles', callback: (params, cb) => { traiter(socket, mqdao.getCles, {params, cb}) }},
      {eventName: 'getConfigurationNotifications', callback: (params, cb) => { traiter(socket, mqdao.getConfigurationNotifications, {params, cb}) }},
      {eventName: 'conserverConfigurationNotifications', callback: (params, cb) => { traiter(socket, mqdao.conserverConfigurationNotifications, {params, cb}) }},
      {eventName: 'genererClewebpushNotifications', callback: (params, cb) => { traiter(socket, mqdao.genererClewebpushNotifications, {params, cb}) }},

      {eventName: 'coupdoeil/requeteListeNoeuds', callback: (params, cb) => { traiter(socket, mqdao.requeteListeNoeuds, {params, cb})}},
      {eventName: 'coupdoeil/requeteListeDomaines', callback: (params, cb) => { traiter(socket, mqdao.requeteListeDomaines, {params, cb})}},
      // {eventName: 'coupdoeil/requeteCatalogueDomaines', callback: cb => {requeteCatalogueDomaines(socket, cb)}},
      {eventName: 'coupdoeil/requeteCatalogueApplications', callback: (params, cb) => {traiter(socket, mqdao.requeteCatalogueApplications, {params, cb})}},
      {eventName: 'coupdoeil/requeteInfoApplications', callback: (params, cb) => {traiter(socket, mqdao.requeteInfoApplications, {params, cb})}},
      // {eventName: 'coupdoeil/requeteRapportBackup', callback: (params, cb) => {requeteRapportBackup(socket, params, cb)}},
      // {eventName: 'coupdoeil/getUploadsEnCours', callback: (params, cb) => {traiter(socket, mqdao.getUploadsEnCours, {params, cb})}},
      // {eventName: 'coupdoeil/getDocumentParFuuid', callback: (params, cb) => {getDocumentParFuuid(socket, params, cb)}},
      {eventName: 'maitrecomptes/requeteListeUsagers', callback: (params, cb) => {traiter(socket, mqdao.requeteListeUsagers, {params, cb})}},
      {eventName: 'maitrecomptes/requeteUsager', callback: (params, cb) => {traiter(socket, mqdao.requeteUsager, {params, cb})}},
      {eventName: 'maitrecomptes/resetWebauthnUsager', callback: (params, cb) => {traiter(socket, mqdao.resetWebauthn, {params, cb})}},

      {eventName: 'coupdoeil/requeteClesNonDechiffrables', callback: (params, cb) => {
        traiter(socket, mqdao.requeteClesNonDechiffrables, {params, cb})
      }},
      {eventName: 'coupdoeil/requeteCompterClesNonDechiffrables', callback: (params, cb) => {
        traiter(socket, mqdao.requeteCompterClesNonDechiffrables, {params, cb})
      }},
      {eventName: 'coupdoeil/transactionCleRechiffree', callback: (params, cb) => {
        traiter(socket, mqdao.commandeCleRechiffree, {params, cb})
      }},
      {eventName: 'transmettreCleSymmetrique', callback: (params, cb) => {
        traiter(socket, mqdao.transmettreCleSymmetrique, {params, cb})
      }},
      {eventName: 'verifierClesSymmetriques', callback: (params, cb) => {
        traiter(socket, mqdao.verifierClesSymmetriques, {params, cb})
      }},
      // {eventName: 'coupdoeil/restaurationChargerCles', callback: (params, cb) => {
      //   restaurationChargerCles(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/restaurationDomaines', callback: (params, cb) => {
      //   restaurationDomaines(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/restaurationGrosfichiers', callback: (params, cb) => {
      //   restaurationGrosfichiers(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/backupApplication', callback: (params, cb) => {
      //   backupApplication(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/restaurerApplication', callback: (params, cb) => {
      //   restaurerApplication(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/installerDomaine', callback: (params, cb) => {
      //   installerDomaine(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/lancerBackupSnapshot', callback: params => {
      //   lancerBackupSnapshot(socket, params)
      // }},
      // {eventName: 'coupdoeil/resetBackup', callback: params => {
      //   resetBackup(socket, params)
      // }},
      {eventName: 'coupdoeil/genererCertificatNoeud', callback: (params, cb) => {
        traiter(socket, mqdao.genererCertificatNoeud, {params, cb})
      }},
      // {eventName: 'coupdoeil/regenererPreviews', callback: (params, cb) => {
      //   regenererPreviews(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/configurerConsignationWeb', callback: (params, cb) => {
      //   traiter(socket, mqdao.configurerConsignationWeb, {params, cb})
      // }},
      // {eventName: 'coupdoeil/soumettreTransactionMaitredescles', callback: (params, cb) => {
      //   soumettreTransactionMaitredescles(socket, params, cb)
      // }},
      // {eventName: 'coupdoeil/clearFichierPublie', callback: (commande, cb) => {
      //   clearFichierPublie(socket, commande, cb)
      // }},
      // {eventName: 'coupdoeil/uploadCollectionsPubliques', callback: (commande, cb) => {
      //   uploadCollectionsPubliques(socket, commande, cb)
      // }},
      // {eventName: 'coupdoeil/commandeSoumettreCatalogueApplication', callback: (commande, cb) => {
      //   commandeSoumettreCatalogueApplication(socket, commande, cb)
      // }},
      {eventName: 'genererCertificatNavigateur', callback: (commande, cb) => {
        genererCertificatNavigateurWS(socket, commande, cb)
      }},
      {eventName: 'maitrecomptes/majDelegations', callback: (params, cb) => {
        traiter(socket, mqdao.majDelegations, {params, cb})
      }},
      {eventName: 'coupdoeil/regenererDomaine', callback: (params, cb) => {
        traiter(socket, mqdao.regenererDomaine, {params, cb})
      }},
      {eventName: 'getRecoveryCsr', callback: async (params, cb) => {traiterCompteUsagersDao(socket, 'getRecoveryCsr', {params, cb})}},
      {eventName: 'signerRecoveryCsr', callback: async (params, cb) => {traiterCompteUsagersDao(socket, 'signerRecoveryCsr', {params, cb})}},
      {eventName: 'signerRecoveryCsrParProprietaire', callback: async (params, cb) => {traiter(socket, mqdao.signerRecoveryCsrParProprietaire, {params, cb})}},
      
      // Listeners evenements
      {eventName: 'coupdoeil/ecouterEvenementsPresenceDomaines', callback: (params, cb) => {
        ecouterEvenementsPresenceDomaines(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsPresenceDomaines', callback: (params, cb) => {
        retirerEvenementsPresenceDomaines(socket, params, cb)
      }},

      {eventName: 'coupdoeil/ecouterEvenementsPresenceNoeuds', callback: (params, cb) => {
        ecouterEvenementsPresenceNoeuds(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsPresenceNoeuds', callback: (params, cb) => {
        retirerEvenementsPresenceNoeuds(socket, params, cb)
      }},

      {eventName: 'coupdoeil/ecouterEvenementsInstances', callback: (params, cb) => {
        ecouterEvenementsInstances(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsInstances', callback: (params, cb) => {
        retirerEvenementsInstances(socket, params, cb)
      }},

      {eventName: 'coupdoeil/ecouterEvenementsApplications', callback: (params, cb) => {
        ecouterEvenementsApplications(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsApplications', callback: (params, cb) => {
        retirerEvenementsApplications(socket, params, cb)
      }},

      {eventName: 'coupdoeil/ecouterEvenementsAcme', callback: (params, cb) => {
        ecouterEvenementsAcme(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsAcme', callback: (params, cb) => {
        retirerEvenementsAcme(socket, params, cb)
      }},

      {eventName: 'coupdoeil/ecouterEvenementsBackup', callback: (params, cb) => {
        ecouterEvenementsBackup(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsBackup', callback: (params, cb) => {
        retirerEvenementsBackup(socket, params, cb)
      }},

      {eventName: 'coupdoeil/ecouterEvenementsConsignation', callback: (params, cb) => {
        ecouterEvenementsConsignation(socket, params, cb)
      }},
      {eventName: 'coupdoeil/retirerEvenementsConsignation', callback: (params, cb) => {
        retirerEvenementsConsignation(socket, params, cb)
      }},

      {eventName: 'ecouterEvenementsRechiffageCles', callback: (params, cb) => {
        ecouterEvenementsRechiffageCles(socket, params, cb)
      }},
      {eventName: 'retirerEvenementsRechiffageCles', callback: (params, cb) => {
        retirerEvenementsRechiffageCles(socket, params, cb)
      }},

      {eventName: 'ecouterEvenementsBackup', callback: (params, cb) => {
        ecouterEvenementsBackup(socket, params, cb)
      }},
      {eventName: 'retirerEvenementsBackup', callback: (params, cb) => {
        retirerEvenementsBackup(socket, params, cb)
      }},
    ]
  }

  return configurationEvenements
}

async function traiter(socket, methode, {params, cb}) {
  try {
    const reponse = await methode(socket, params)
    if(cb) {
      let messageReponse = reponse
      if(reponse['__original']) {
        messageReponse = reponse['__original']
      }
      try {
        await cb(messageReponse)
      } catch(err) {
        console.error("Erreur reponse %s : %O", methode, err)
      }
    }
  } catch(err) {
    debug("Erreur commande socket.io: %O", err)
    cb({err: ''+err, stack: err.stack})
  }
}

// async function ajouterCatalogueApplication(socket, transaction, cb) {
//   // Ajout d'un catalogue d'application avec transaction preformattee
//   console.debug("Recu ajouterCatalogueApplication : %O, callback : %O", transaction, cb)
//   try {
//     if(transaction['en-tete'].domaine === 'CatalogueApplications.catalogueApplication') {
//       const amqpdao = socket.amqpdao
//       const reponse = await amqpdao.transmettreEnveloppeTransaction(transaction)
//       if(cb) cb(reponse)
//     } else {
//       // Par defaut
//       if(cb) cb({err: 'Mauvais domaine pour ajouterCatalogueApplication : ' + transaction.domaine})
//     }
//   } catch(err) {
//     console.error("ajouterCatalogueApplication %O", err)
//     if(cb) cb({err: ''+err})
//   }

// }

async function requeteClesNonDechiffrables(socket, params, cb) {
  const domaine = 'MaitreDesCles', action = 'clesNonDechiffrables'
  try {
    const amqpdao = socket.amqpdao
    const reponse = await amqpdao.transmettreRequete(domaine, params, {action, noformat: true})
    return cb(reponse)
  } catch(err) {
    return cb({err})
  }
}

async function requeteCompterClesNonDechiffrables(socket, params, cb) {
  const domaine = 'MaitreDesCles', action = 'compterClesNonDechiffrables'
  try {
    const amqpdao = socket.amqpdao
    const reponse = await amqpdao.transmettreRequete(domaine, params, {action, noformat: true})
    return cb(reponse)
  } catch(err) {
    return cb({err})
  }
}

async function commandeCleRechiffree(socket, commande, cb) {
  // debug("Commande cle rechiffree : %O", commande)
  debug("Commande pour cle rechiffree %s", commande.hachage_bytes)
  const amqpdao = socket.amqpdao
  const reponses = {}
  try {
    const domaine = 'MaitreDesCles', action = 'sauvegarderCle'
    const partition = commande['en-tete'].partition
    await amqpdao.transmettreCommande(domaine, commande, {action, partition, noformat: true})
    return cb(reponses)
  } catch(err) {
    console.error("Erreur commandeCleRechiffree : %O", err)
    return cb({err})
  }
}

// function traiterCommande(rabbitMQ, enveloppe, cb) {
//   // console.debug("Enveloppe de commande recue");
//   // console.debug(enveloppe);
//   let routingKey = enveloppe.routingKey;
//   let commande = enveloppe.commande;
//   let nowait = !cb;

//   let params = {nowait}
//   if(enveloppe.exchange) params.exchange = enveloppe.exchange

//   rabbitMQ.transmettreCommande(routingKey, commande, params)
//     .then( reponse => {
//       if(reponse) {
//         if(cb) {
//           cb(reponse.resultats || reponse); // On transmet juste les resultats
//         }
//       } else {
//         if(!nowait) {
//           console.error("Erreur reception reponse commande " + routingKey);
//         }
//       }
//     })
//     .catch( err => {
//       console.error("Erreur commande");
//       console.error(err);
//       if(cb) {
//         cb(); // Callback sans valeurs
//       }
//     });
// }

// function extraireClePubliqueMaitredescles(rabbitMQ) {
//   return rabbitMQ.demanderCertificatMaitreDesCles()
//   .then(certificat=>{
//     // console.debug("Certificat maitredescles");
//     // console.debug(certificat);

//     const infoCertificat = rabbitMQ.pki.extraireClePubliqueFingerprint(certificat);

//     // console.debug(infoCertificat);
//     return infoCertificat;
//   })
// }

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
  debug("Restaurer transactions %O", commande)
  const amqpdao = socket.amqpdao

  const domaineAction = commande['en-tete'].domaine,
        action = domaineAction.split('.').pop()

  if(action !== 'restaurerTransactions') {
    debug("ERREUR Action refusee resetBackup sur mauvais domaine : %O", commande)
    return
  }
  try {
    const reponse = await amqpdao.transmettreEnveloppeCommande(commande, domaineAction, {nowait: true})
    if(cb) cb(reponse)
  } catch(err) {
    console.error("resetBackup: Erreur %O", err)
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

// async function backupApplication(socket, commande, cb) {
//   const amqpdao = socket.amqpdao
//   const noeudId = commande.noeudId
//   debug("Backup application %s sur noeud %s", noeudId)
//   const domaineAction = `commande.instance.${noeudId}.backupApplication`
//   try {
//     let params = {exchange: commande.securite || '3.protege'}
//     const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
//     cb(reponse)
//   } catch(err) {
//     console.error("backupApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function restaurerApplication(socket, commande, cb) {
//   debug("Restaurer application")
//   const amqpdao = socket.amqpdao
//   const noeudId = commande.noeudId
//   const domaineAction = `commande.instance.${noeudId}.restoreApplication`
//   try {
//     let params = {exchange: commande.securite || '3.protege'}
//     const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
//     cb(reponse)
//   } catch(err) {
//     console.error("restaurerApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function installerApplication(socket, commande, cb) {
//   debug("Installer application : %O", commande)
//   const amqpdao = socket.amqpdao
//   const domaineAction = 'monitor'
//   try {
//     let params = {action: 'installerApplication', partition: commande.noeudId, exchange: commande.exchange}
//     const reponse = await amqpdao.transmettreCommande(domaineAction, commande, params)
//     cb(reponse)
//   } catch(err) {
//     console.error("installerApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function installerDomaine(socket, commande, cb) {
//   debug("Installer domaine : %O", commande)
//   const amqpdao = socket.amqpdao
//   const domaineAction = 'domaines.demarrer'
//   try {
//     const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
//     cb(reponse)
//   } catch(err) {
//     console.error("installerApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function lancerBackupSnapshot(socket, commande) {
//   debug("Lancer backup horaire/snapshot : %O", commande)
//   const amqpdao = socket.amqpdao
//   const domaine = commande.domaine || 'global', action = 'declencherBackupHoraire'
//   const entete = commande['en-tete']
//   if(domaine !== entete.domaine || action !== entete.action) {
//     throw new Error("Mauvais domaine/action pour lancerBackupSnapshot : %s/%s", domaine, action)
//   }
//   try {
//     amqpdao.transmettreEnveloppeCommande(commande, domaine, {action, nowait: true})
//   } catch(err) {
//     console.error("lancerBackupSnapshot: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function resetBackup(socket, commande) {
//   debug("Reset backup : %O", commande)
//   const amqpdao = socket.amqpdao

//   const domaineAction = commande['en-tete'].domaine,
//         action = domaineAction.split('.').pop()

//   if(action !== 'resetBackup') {
//     debug("ERREUR Action refusee resetBackup sur mauvais domaine : %O", commande)
//     return
//   }
//   try {
//     // Commande nowait - c'est un broadcast (global), il faut capturer les
//     // evenements de demarrage individuels (evenement.backup.backupTransactions)
//     // pour savoir quels domaines ont repondu
//     amqpdao.transmettreEnveloppeCommande(commande, domaineAction, {nowait: true})
//   } catch(err) {
//     console.error("resetBackup: Erreur %O", err)
//   }
// }

async function genererCertificatNoeud(socket, commande, cb) {
  debug("Generer nouveau certificat de noeud : %O", commande)

  const amqpdao = socket.amqpdao
  const domaine = 'CorePki'  //, action = 'signerCsr'

  try {
    // const reponse = await amqpdao.transmettreCommande(domaine, commande, {action, attacherCertificat: true})
    const reponse = await amqpdao.transmettreEnveloppeCommande(commande)
    debug("genererCertificatNoeud: Reponse demande certificat\n%O", reponse)

    const certificat = reponse.certificat

    cb({certificat})
  } catch(err) {
    console.error("genererCertificatNoeud: Erreur %O", err)
    cb({err: ''+err})
  }
}

// async function desinstallerApplication(socket, commande, cb) {
//   debug("Desinstaller application %O", commande)

//   const amqpdao = socket.amqpdao
//   const domaineAction = ['monitor', commande.noeudId ,'supprimerApplication'].join('.')

//   try {
//     // Commande nowait - c'est un broadcast (global), il faut capturer les
//     // evenements de demarrage individuels (evenement.backup.backupTransactions)
//     // pour savoir quels domaines ont repondu
//     const reponse = await amqpdao.transmettreCommande(domaineAction, commande, {exchange: commande.exchange})
//     debug("desinstallerApplication: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("desinstallerApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function requeteConfigurationApplication(socket, params, cb) {
//   debug("Requete configuration %O", params)
//   const amqpdao = socket.amqpdao
//   const domaineAction = ['monitor', params.noeud_id ,'requeteConfigurationApplication'].join('.')
//   try {
//     // Commande nowait - c'est un broadcast (global), il faut capturer les
//     // evenements de demarrage individuels (evenement.backup.backupTransactions)
//     // pour savoir quels domaines ont repondu
//     const reponse = await amqpdao.transmettreCommande(domaineAction, params, {exchange: params.exchange})
//     debug("requeteConfigurationApplication: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("requeteConfigurationApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function configurerApplication(socket, params, cb) {
//   debug("Configurer application %s sur noeud %s", params.nom_application, params.noeud_id)
//   const amqpdao = socket.amqpdao
//   const domaineAction = ['monitor', params.noeud_id ,'configurerApplication'].join('.')
//   try {
//     const reponse = await amqpdao.transmettreCommande(domaineAction, params, {exchange: params.exchange})
//     debug("configurerApplication: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("configurerApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function demarrerApplication(socket, params, cb) {
//   debug("Demarrer application %O", params)
//   const amqpdao = socket.amqpdao
//   const domaineAction = ['monitor', params.noeud_id ,'demarrerApplication'].join('.')
//   try {
//     const reponse = await amqpdao.transmettreCommande(domaineAction, params, {exchange: params.exchange})
//     debug("demarrerApplication: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("demarrerApplication: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function regenererPreviews(socket, params, cb) {
//   debug("Regenerer previews %O", params)
//   const amqpdao = socket.amqpdao
//   const domaineAction = 'commande.GrosFichiers.regenererPreviews'
//   try {
//     const reponse = await amqpdao.transmettreCommande(domaineAction, params)
//     debug("regenererPreviews: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("regenererPreviews: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function configurerConsignationWeb(socket, params, cb) {
//   debug("Configurer consignation web %O", params)
//   const amqpdao = socket.amqpdao
//   const domaineAction = params['en-tete'].domaine
//
//   if(domaineAction !== 'Topologie.configurerConsignationWeb') {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }
//
//   try {
//     const reponse = await amqpdao.transmettreEnveloppeTransaction(params)
//     debug("configurerConsignationWeb: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("configurerConsignationWeb: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function soumettreTransactionMaitredescles(socket, params, cb) {
//   debug("Soumettre transaction maitredescles %O", params)
//   const amqpdao = socket.amqpdao

//   const domaineAction = params['en-tete'].domaine
//   if ( ! domaineAction.startsWith('MaitreDesCles.') ) {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }

//   try {
//     const reponse = await amqpdao.transmettreEnveloppeTransaction(params)
//     debug("soumettreTransactionMaitredescles: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("soumettreTransactionMaitredescles: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

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

// async function uploadCollectionsPubliques(socket, commande, cb) {
//   debug("Upload collections publiques %O", commande)
//   const amqpdao = socket.amqpdao

//   const domaineAction = commande['en-tete'].domaine
//   if ( domaineAction !== 'GrosFichiers.uploadCollectionsPubliques' ) {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }

//   try {
//     const reponse = await amqpdao.transmettreCommande(domaineAction, commande)
//     debug("uploadCollectionsPubliques: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("uploadCollectionsPubliques: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function commandeTransmettreCatalogues(socket, commande, cb) {
//   debug("Commande retransmettre collections %O", commande)
//   const amqpdao = socket.amqpdao

//   const {domaine, action} = commande['en-tete']
//   if ( domaine !== 'monitor' ) {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }
//   if ( action !== 'transmettreCatalogues' ) {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }

//   try {
//     const reponse = await amqpdao.transmettreCommande(domaine, commande, {action, noformat: true})
//     debug("commandeTransmettreCatalogues: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("commandeTransmettreCatalogues: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

// async function commandeSoumettreCatalogueApplication(socket, commande, cb) {
//   debug("Commande retransmettre collections %O", commande)
//   const amqpdao = socket.amqpdao

//   const {domaine, action} = commande['en-tete']
//   if ( domaine !== 'CoreCatalogues' ) {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }
//   if ( action !== 'catalogueApplication' ) {
//     return cb({err: "Mauvais type d'action : " + domaineAction})
//   }

//   try {
//     const reponse = await amqpdao.transmettreCommande(domaine, commande, {action, noformat: true})
//     debug("commandeTransmettreCatalogues: Reponse \n%O", reponse)
//     cb(reponse)
//   } catch(err) {
//     console.error("commandeTransmettreCatalogues: Erreur %O", err)
//     cb({err: ''+err})
//   }
// }

async function genererCertificatNavigateurWS(socket, commande, cb) {
  debug("Generer certificat navigateur, params: %O", commande)
  const amqpdao = socket.amqpdao

  const {domaine, action} = commande['en-tete'] 
  if ( domaine !== 'CoreMaitreDesComptes' || action != 'signerCompteUsager' ) {
    return cb({err: "Mauvais type d'action : %s.%s", domaine, action})
  }

  try {
    const reponse = await amqpdao.transmettreEnveloppeCommande(commande, domaine, {action})
    debug("genererCertificatNavigateurWS: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("genererCertificatNavigateurWS: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function resetWebauthn(socket, commande, cb) {
  debug("resetWebauthn commande: %O", commande)

  const domaine = commande['en-tete'].domaine
  const action = commande['en-tete'].action
  if ( domaine !== 'CoreMaitreDesComptes' || action !== 'resetWebauthnUsager') {
    return cb({err: "Mauvais type d'action : " + domaine + "/" + action})
  }

  try {
    const amqpdao = socket.amqpdao
    const reponse = await amqpdao.transmettreEnveloppeCommande(commande, domaine, {action})
    debug("resetWebauthn: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("resetWebauthn: Erreur %O", err)
    cb({err: ''+err})
  }

}

async function majDelegations(socket, transaction, cb) {
  debug("majDelegations %O", transaction)
  const amqpdao = socket.amqpdao

  const domaine = transaction['en-tete'].domaine
  const action = transaction['en-tete'].action
  if ( domaine !== 'CoreMaitreDesComptes' || action !== 'majUsagerDelegations') {
    return cb({err: "Mauvais type d'action : " + domaine + "/" + action})
  }

  try {
    const reponse = await amqpdao.transmettreEnveloppeCommande(transaction, domaine, {action})
    debug("majDelegations: Reponse \n%O", reponse)
    cb(reponse)
  } catch(err) {
    console.error("majDelegations: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function regenererDomaine(socket, transaction, cb) {
  debug("regenererDomaine %O", transaction)
  const amqpdao = socket.amqpdao

  const domaineAction = transaction['en-tete'].domaine
  const action = domaineAction.split('.').pop()
  if ( action !== 'regenerer' ) {
    return cb({err: "Mauvais type d'action : " + domaineAction})
  }

  try {
    amqpdao.transmettreEnveloppeCommande(transaction, domaineAction, {nowait: true, noformat: true})
    cb({ok: true})
  } catch(err) {
    console.error("majDelegations: Erreur %O", err)
    cb({err: ''+err})
  }
}

async function executerRequete2(socket, params, cb) {
  const amqpdao = socket.amqpdao
  const routage = params.routage || {}
  const domaine = routage.domaine,
        action = routage.action
  try {
    const reponse = await amqpdao.transmettreRequete(domaine, params, {action, decoder: true, noformat: true})
    cb(reponse)
  } catch(err) {
    console.error(new Date() + " executerRequete2 Erreur %O (requete : %O)", err, params)
    debug("Erreur executerRequete %O\n%O", params.routage, err)
    if(cb) cb({err: 'Erreur: ' + err})
  }
}

async function executerRequete(domaineAction, socket, params, cb) {
  const amqpdao = socket.amqpdao
  try {
    const reponse = await amqpdao.transmettreRequete(domaineAction, params, {decoder: true})
    cb(reponse)
  } catch(err) {
    debug("Erreur executerRequete %s\n%O", domaineAction, err)
    if(cb) cb({err: 'Erreur: ' + err})
  }
}

async function executerRequeteAction(domaine, action, socket, params, cb) {
  const amqpdao = socket.amqpdao
  try {
    const reponse = await amqpdao.transmettreRequete(domaine, params, {action, decoder: true})
    cb(reponse)
  } catch(err) {
    debug("Erreur executerRequete %s.\n%O", domaine, action, err)
    if(cb) cb({err: 'Erreur: ' + err})
  }
}

function requeteListeNoeuds(socket, params, cb) {
  if(params.routage.action !== 'listeNoeuds') return cb({ok: false, err: 'Action doit etre listeNoeuds'})
  executerRequete2(socket, params, cb)
}

function requeteListeDomaines(socket, params, cb) {
  // executerRequeteAction('CoreTopologie', 'listeDomaines', socket, {}, cb)
  if(params.routage.action !== 'listeDomaines') return cb({ok: false, err: 'Action doit etre listeDomaines'})
  executerRequete2(socket, params, cb)
}

function requeteCatalogueApplications(socket, params, cb) {
  // executerRequeteAction('CoreCatalogues', 'listeApplications', socket, {}, cb)
  if(params.routage.action !== 'listeApplications') return cb({ok: false, err: 'Action doit etre listeApplications'})
  executerRequete2(socket, params, cb)
}

function requeteInfoApplications(socket, params, cb) {
  // executerRequeteAction('CoreCatalogues', 'infoApplication', socket, params, cb)
  if(params.routage.action !== 'infoApplication') return cb({ok: false, err: 'Action doit etre infoApplication'})
  executerRequete2(socket, params, cb)
}

function requeteRapportBackup(socket, params, cb) {
  executerRequete('Backup.dernierRapport', socket, params, cb)
}

function getCertificatsMaitredescles(socket, cb) {
  // executerRequete('MaitreDesCles.certMaitreDesCles', socket, {}, cb)
  if(params.routage.action !== 'certMaitreDesCles') return cb({ok: false, err: 'Action doit etre certMaitreDesCles'})
  executerRequete2(socket, params, cb)
}

// function getUploadsEnCours(socket, cb) {
//   // executerRequete('GrosFichiers.transfertsEnCours', socket, {}, cb)
//   if(params.routage.action !== 'transfertsEnCours') return cb({ok: false, err: 'Action doit etre transfertsEnCours'})
//   executerRequete2(socket, {}, cb)
// }

function getDocumentParFuuid(socket, params, cb) {
  // executerRequete('GrosFichiers.documentsParFuuid', socket, params, cb)
  if(params.routage.action !== 'documentsParFuuid') return cb({ok: false, err: 'Action doit etre documentsParFuuid'})
  executerRequete2(socket, params, cb)
}

function requeteListeUsagers(socket, params, cb) {
  // executerRequeteAction('CoreMaitreDesComptes', 'getListeUsagers', socket, params, cb)
  if(params.routage.action !== 'getListeUsagers') return cb({ok: false, err: 'Action doit etre getListeUsagers'})
  executerRequete2(socket, params, cb)
}

function requeteUsager(socket, params, cb) {
  // executerRequeteAction('CoreMaitreDesComptes', 'chargerUsager', socket, params, cb)
  if(params.routage.action !== 'chargerUsager') return cb({ok: false, err: 'Action doit etre chargerUsager'})
  executerRequete2(socket, params, cb)
}

// Enregistrement d'evenements

function ecouterEvenementsPresenceDomaines(socket, _params, cb) {
  const opts = { routingKeys: ['evenement.*.presenceDomaine'], exchanges: ['3.protege'] }
  debug("ecouterEvenementsPresenceDomaines : %O", opts)
  socket.subscribe(opts, cb)
}

function retirerEvenementsPresenceDomaines(socket, _params, cb) {
  const opts = { routingKeys: ['evenement.*.presenceDomaine'], exchanges: ['3.protege'] }
  debug("retirerEvenementsPresenceDomaines sur %O", opts)
  socket.unsubscribe(opts, cb)
}

const RK_PRESENCE_INSTANCES = ['evenement.instance.presence'],
      EX_PRESENCE_INSTANCES = ['1.public', '2.prive', '3.protege']

function ecouterEvenementsPresenceNoeuds(socket, _params, cb) {
  const presence = { routingKeys: RK_PRESENCE_INSTANCES, exchanges: EX_PRESENCE_INSTANCES }
  socket.subscribe(presence, cb)
}

function retirerEvenementsPresenceNoeuds(socket, _params, cb) {
  const presence = { routingKeys: RK_PRESENCE_INSTANCES, exchanges: EX_PRESENCE_INSTANCES }
  socket.unsubscribe(presence, cb)
}

const RK_TOPOLOGIE_INSTANCES = ['evenement.CoreTopologie.instanceSupprimee'],
      EX_TOPOLOGIE_INSTANCES = ['3.protege']

function ecouterEvenementsInstances(socket, _params, cb) {
  const topologie = { routingKeys: RK_TOPOLOGIE_INSTANCES, exchanges: EX_TOPOLOGIE_INSTANCES }
  socket.subscribe(topologie, cb)
}

function retirerEvenementsInstances(socket, _params, cb) {
  const topologie = { routingKeys: RK_TOPOLOGIE_INSTANCES, exchanges: EX_TOPOLOGIE_INSTANCES }
  socket.unsubscribe(topologie, cb)
}

const RK_FICHIERS_PRESENCE = [
  'evenement.fichiers.presence', 
  'evenement.fichiers.syncPrimaire',
  'evenement.CoreTopologie.changementConsignationPrimaire',
]
const EX_FICHIERS_INSTANCES = ['2.prive']

function ecouterEvenementsConsignation(socket, _params, cb) {
  const params = { routingKeys: RK_FICHIERS_PRESENCE, exchanges: EX_FICHIERS_INSTANCES }
  socket.subscribe(params, cb)
}

function retirerEvenementsConsignation(socket, _params, cb) {
  const params = { routingKeys: RK_FICHIERS_PRESENCE, exchanges: EX_FICHIERS_INSTANCES }
  socket.unsubscribe(params, cb)
}

function ecouterEvenementsApplications(socket, params, cb) {
  const instanceId = params.instanceId,
        exchange = params.exchange
  
  if(!instanceId || !exchange) {
    debug("ecouterEvenementsPresenceNoeuds ERROR instanceId/exchange manquant de params : %O", params)
    if(cb) cb({ok: false, err: "instanceId ou exchange manquant"})
    return
  }

  const opts = {
    routingKeys: [
      `evenement.instance.${instanceId}.applicationDemarree`,
      `evenement.instance.${instanceId}.applicationArretee`,
      `evenement.instance.${instanceId}.erreurDemarrageApplication`,
    ],
    exchanges: [exchange],
  }

  debug("ecouterEvenementsApplications Params : %O", opts)
  socket.subscribe(opts, cb)
}

function retirerEvenementsApplications(socket, params, cb) {
  const instanceId = params.instanceId,
        exchange = params.exchange

  if(!instanceId || !exchange) {
    debug("ecouterEvenementsPresenceNoeuds ERROR instanceId/exchange manquant de params : %O", params)
    if(cb) cb({ok: false, err: "instanceId ou exchange manquant"})
    return
  }

  const opts = {
    routingKeys: [
      `evenement.instance.${instanceId}.applicationDemarree`,
      `evenement.instance.${instanceId}.applicationArretee`,
      `evenement.instance.${instanceId}.erreurDemarrageApplication`,
    ],
    exchanges: [exchange],
  }

  debug("retirerEvenementsApplications sur %O", opts)
  socket.unsubscribe(opts, cb)
}

const RK_EVENEMENTS_ACME = ['evenement.instance.INSTANCE_ID.resultatAcme']

function ecouterEvenementsAcme(socket, params, cb) {
  const instanceId = params.instanceId,
        exchange = params.exchange
  const routingKeys = RK_EVENEMENTS_ACME.map(item=>item.replace('INSTANCE_ID', instanceId))
  const evenements = { routingKeys, exchanges: [exchange] }
  socket.subscribe(evenements, cb)
}

function retirerEvenementsAcme(socket, params, cb) {
  const instanceId = params.instanceId,
        exchange = params.exchange
  const routingKeys = RK_EVENEMENTS_ACME.map(item=>item.replace('INSTANCE_ID', instanceId))
  const evenements = { routingKeys, exchanges: [exchange] }
  socket.unsubscribe(evenements, cb)
}

function ecouterEvenementsBackup(socket, params, cb) {
  const opts = {
    routingKeys: [
      'evenement.backup.backupMaj',
      'evenement.backup.backupApplication',
      'evenement.backup.restaurationMaj',
      'evenement.backup.regenerationMaj',
    ],
    exchange: ['3.protege'],
  }
  debug("ecouterEvenementsBackup Params : %O", params)
  socket.subscribe(opts, cb)
}

function retirerEvenementsBackup(socket, params, cb) {
  const routingKeys = [
    '3.protege.evenement.backup.backupMaj',
    '3.protege.evenement.backup.backupApplication',
    '3.protege.evenement.backup.restaurationMaj',
    '3.protege.evenement.backup.regenerationMaj',
  ]
  socket.unsubscribe({routingKeys})
  debug("retirerEvenementsBackup sur %O", params)
  if(cb) cb(true)
}

const CONST_ROUTINGKEYS_EVENEMENTS_DECHIFFRAGE = [
  'evenement.MaitreDesCles.demandeCleSymmetrique',
]

function ecouterEvenementsRechiffageCles(socket, params, cb) {
  const opts = {
    routingKeys: CONST_ROUTINGKEYS_EVENEMENTS_DECHIFFRAGE,
    exchanges: ['3.protege'],
  }
  debug("ecouterEvenementsRechiffageCles Params : %O", params)
  socket.subscribe(opts, cb)
}

function retirerEvenementsRechiffageCles(socket, params, cb) {
  socket.unsubscribe({
    routingKeys: CONST_ROUTINGKEYS_EVENEMENTS_DECHIFFRAGE,
    exchanges: ['3.protege'],
  })
  debug("retirerEvenementsRechiffageCles sur %O", params)
  if(cb) cb(true)
}

const CONST_ROUTINGKEYS_EVENEMENTS_BACKUP = [
  'evenement.backup.demarrage',
  'evenement.backup.maj',
  'evenement.backup.succes',
  'evenement.backup.echec',
]

function ecouterEvenementsBackup(socket, params, cb) {
  const opts = {
    routingKeys: CONST_ROUTINGKEYS_EVENEMENTS_BACKUP,
    exchanges: ['2.prive'],
  }
  debug("ecouterEvenementsBackup Params : %O", params)
  socket.subscribe(opts, cb)
}

function retirerEvenementsBackup(socket, params, cb) {
  socket.unsubscribe({
    routingKeys: CONST_ROUTINGKEYS_EVENEMENTS_BACKUP,
    exchanges: ['2.prive'],
  })
  debug("retirerEvenementsBackup sur %O", params)
  if(cb) cb(true)
}

async function traiterCompteUsagersDao(socket, methode, {params, cb}) {
  try {
    const comptesUsagersDao = socket.comptesUsagersDao
    const reponse = await comptesUsagersDao[methode](socket, params)
    if(cb) cb(reponse)
  } catch(err) {
    console.error(new Date() + " appSocketIo.traiterCompteUsagerDao ERROR traiterCompteUsagersDao ERROR %O", err)
    cb({ok: false, err: "Erreur serveur : " + err})
  }
}

module.exports = {configurerEvenements}
