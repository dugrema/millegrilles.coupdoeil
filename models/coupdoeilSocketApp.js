var fs = require('fs');
const debug = require('debug')('millegrilles:coupdoeil:coupdoeilSocketApp')

function configurationEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'coupdoeil/requeteListeNoeuds', callback: (params, cb) => {requeteListeNoeuds(socket, params, cb)}},
      {eventName: 'coupdoeil/requeteListeDomaines', callback: cb => {requeteListeDomaines(socket, cb)}},
      {eventName: 'coupdoeil/requeteCatalogueDomaines', callback: cb => {requeteCatalogueDomaines(socket, cb)}},
      {eventName: 'coupdoeil/requeteCatalogueApplications', callback: cb => {requeteCatalogueApplications(socket, cb)}},
      {eventName: 'coupdoeil/requeteInfoApplications', callback: (params, cb) => {requeteInfoApplications(socket, params, cb)}},

      // {eventName: 'subscribe', callback: message => {
      //   const {routingKeys, niveauSecurite} = message
      //   debug("Subscribe %O", message)
      //
      //   const channel = socket.amqpdao.channel,
      //         reply_q = socket.amqpdao.reply_q
      //
      //   socket.amqpdao.routingKeyManager
      //     .addRoutingKeysForSocket(socket, routingKeys, niveauSecurite, channel, reply_q);
      // }},
      // {eventName: 'unsubscribe', callback: message => {
      //   // console.debug("Message unsubscribe");
      //   // console.debug(message);
      //   debug("Unsubscribe %O", message)
      //   const {routingKeys, niveauSecurite} = message
      //
      //   const channel = socket.amqpdao.channel,
      //         reply_q = socket.amqpdao.reply_q
      //
      //   socket.amqpdao.routingKeyManager
      //     .removeRoutingKeysForSocket(socket, message, niveauSecurite, channel, reply_q);
      // }},

      // {eventName: 'requete', callback: (enveloppe, cb) => {
      //    debug("Enveloppe de requete recue");
      //    debug(enveloppe);
      //   const domaineAction = enveloppe.domaineAction;
      //   const requete = enveloppe.requete;
      //   const opts = enveloppe.opts || {};
      //
      //   socket.amqpdao.transmettreRequete(domaineAction, requete)
      //   .then( reponse => {
      //     debug("Reponse recue : %O", reponse)
      //     cb(reponse.resultats || reponse)
      //   })
      //   .catch( err => {
      //     console.error("Erreur requete");
      //     console.error(err);
      //     cb(); // Callback sans valeurs
      //   });
      // }},
      // {eventName: 'requeteMultiDomaines', callback: (enveloppe, cb) => {
      //   // console.debug("Enveloppe de requete recue");
      //   // console.debug(enveloppe);
      //   const domaineAction = enveloppe.domaineAction;
      //   const requete = enveloppe.requete;
      //   const opts = enveloppe.opts || {};
      //
      //   socket.amqpdao.transmettreRequeteMultiDomaines(domaineAction, requete)
      //   .then( reponse => {
      //     cb(reponse.resultats || reponse)
      //   })
      //   .catch( err => {
      //     console.error("Erreur requete multi-domaines");
      //     console.error(err);
      //     cb(); // Callback sans valeurs
      //   });
      // }}

    ],
    listenersProteges: [
      // {eventName: 'transaction', callback: (message, cb) => {
      //   traiterTransaction(socket.amqpdao, message, cb)
      // }},
      // {eventName: 'commande', callback: (message, cb) => {
      //   traiterCommande(socket.amqpdao, message, cb)
      // }},
      {eventName: 'coupdoeil/ajouterCatalogueApplication', callback: (transaction, cb) => {
        ajouterCatalogueApplication(socket, transaction, cb)
      }},
      {eventName: 'coupdoeil/requeteClesNonDechiffrables', callback: (params, cb) => {
        requeteClesNonDechiffrables(socket, params, cb)
      }},
      {eventName: 'coupdoeil/transactionsCleRechiffree', callback: (transactions, cb) => {
        transactionsCleRechiffree(socket, transactions, cb)
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
      {eventName: 'coupdoeil/installerApplication', callback: (params, cb) => {
        installerApplication(socket, params, cb)
      }},
      {eventName: 'coupdoeil/installerDomaine', callback: (params, cb) => {
        installerDomaine(socket, params, cb)
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
    const reponse = await amqpdao.transmettreRequete(domaineAction, params)
    return cb(reponse)
  } catch(err) {
    return cb({err})
  }
}

async function transactionsCleRechiffree(socket, transactions, cb) {
  const amqpdao = socket.amqpdao
  const reponses = []
  try {
    for(let idx in transactions) {
      const transaction = transactions[idx]
      reponses.push(await amqpdao.transmettreEnveloppeTransaction(transaction))
    }
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

module.exports = {configurationEvenements};
