import {WebSocketClient} from '@dugrema/millegrilles.common/lib/webSocketClient'

export class WebSocketCoupdoeil extends WebSocketClient {

  // Requetes

  async requeteListeNoeuds(params) {
    // console.debug("Requete liste noeuds : %O", params)
    // const domaineAction = 'Topologie.listeNoeuds'
    return emitBlocking(this.socket, 'coupdoeil/requeteListeNoeuds', params)
  }
  async requeteListeDomaines() {
    // const domaineAction = 'Topologie.listeDomaines'
    return emitBlocking(this.socket, 'coupdoeil/requeteListeDomaines')
  }
  async requeteCatalogueDomaines() {
    // const domaineAction = 'CatalogueApplications.listeDomaines'
    return emitBlocking(this.socket, 'coupdoeil/requeteCatalogueDomaines')
  }
  async requeteClesNonDechiffrables(tailleBatch, listeHachageIgnorer) {
    return emitBlocking(this.socket, 'coupdoeil/requeteClesNonDechiffrables', {
      taille: tailleBatch, hachage_ignorer: listeHachageIgnorer})
  }
  async getCatalogueApplications() {
    return emitBlocking(this.socket, 'coupdoeil/requeteCatalogueApplications')
  }
  async requeteInfoApplications(params) {
    return emitBlocking(this.socket, 'coupdoeil/requeteInfoApplications', params)
  }
  async requeteConfigurationApplication(params) {
    return emitBlocking(this.socket, 'coupdoeil/requeteConfigurationApplication', params)
  }
  async requeteCompterClesNonDechiffrables() {
    return emitBlocking(this.socket, 'coupdoeil/requeteCompterClesNonDechiffrables', {})
  }
  async getCertificatsMaitredescles() {
    return emitBlocking(this.socket, 'coupdoeil/getCertificatsMaitredescles')
  }
  async getUploadsEnCours() {
    return emitBlocking(this.socket, 'coupdoeil/getUploadsEnCours')
  }
  async getDocumentParFuuid(params) {
    return emitBlocking(this.socket, 'coupdoeil/getDocumentParFuuid', params)
  }


  // Commandes

  async restaurationChargerCles(params) {
    return emitBlocking(this.socket, 'coupdoeil/restaurationChargerCles', params)
  }
  async restaurationDomaines(params) {
    return emitBlocking(this.socket, 'coupdoeil/restaurationDomaines', params)
  }
  async restaurationGrosfichiers(params) {
    return emitBlocking(this.socket, 'coupdoeil/restaurationGrosfichiers', params)
  }
  async backupApplication(params) {
    return emitBlocking(this.socket, 'coupdoeil/backupApplication', params)
  }
  async restaurerApplication(params) {
    return emitBlocking(this.socket, 'coupdoeil/restaurerApplication', params)
  }
  async soumettreCleRechiffree(commandes) {
    return emitBlocking(this.socket, 'coupdoeil/transactionCleRechiffree', commandes)
  }
  async soumettreConfigurationApplication(configuration) {
    return emitMessage(this.socket, 'coupdoeil/ajouterCatalogueApplication', configuration)
  }
  async installerApplication(params) {
    return emitMessage(this.socket, 'coupdoeil/installerApplication', params)
  }
  async installerDomaine(params) {
    return emitMessage(this.socket, 'coupdoeil/installerDomaine', params)
  }
  async lancerBackupSnapshot(params) {
    return emitMessage(this.socket, 'coupdoeil/lancerBackupSnapshot', params)
  }
  async genererCertificatNoeud(commande) {
    return emitBlocking(this.socket, 'coupdoeil/genererCertificatNoeud', commande)
  }
  async desinstallerApplication(commande) {
    return emitBlocking(this.socket, 'coupdoeil/desinstallerApplication', commande)
  }
  async configurerApplication(commande) {
    return emitBlocking(this.socket, 'coupdoeil/configurerApplication', commande)
  }
  async demarrerApplication(commande) {
    return emitBlocking(this.socket, 'coupdoeil/demarrerApplication', commande)
  }
  async regenererPreviews() {
    return emitBlocking(this.socket, 'coupdoeil/regenererPreviews', {})
  }
  async configurerConsignationWeb(configuration) {
    return emitBlocking(this.socket, 'coupdoeil/configurerConsignationWeb', configuration)
  }
  async soumettreTransactionMaitredescles(transaction) {
    return emitBlocking(this.socket, 'coupdoeil/soumettreTransactionMaitredescles', transaction)
  }
  async clearFichierPublie(commande) {
    return emitBlocking(this.socket, 'coupdoeil/clearFichierPublie', commande)
  }
  async uploadCollectionsPubliques(commande) {
    return emitBlocking(this.socket, 'coupdoeil/uploadCollectionsPubliques', commande)
  }
  async commandeTransmettreCatalogues(commande) {
    return emitBlocking(this.socket, 'coupdoeil/commandeTransmettreCatalogues', commande)
  }
}

function emitBlocking(socket, event, params) {
  return new Promise((resolve, reject)=>{
    const timeout = setTimeout(_=>{reject({err: 'Timeout'})}, 7500)
    const traiterReponse = reponse => {
      clearTimeout(timeout)
      if(reponse.err) return reject(reponse.err)
      resolve(reponse)
    }
    if(params) {
      socket.emit(event, params, traiterReponse)
    } else {
      socket.emit(event, traiterReponse)
    }
  })
}

// export class WebSocketManager {
//
//   constructor(socket, opts) {
//     if(!opts) opts = {}
//     this.opts = opts
//     this.socket = socket
//     this.addSocket(socket)
//   }
//
//   addSocket(webSocket) {
//
//     webSocket.on('erreur', erreur=>{
//       console.error("Erreur recue par Socket.IO");
//       console.error(erreur);
//     })
//
//     return new Promise((resolve, reject)=>{
//       console.debug("Initialisation coupdoeil, enregistrement listeners cote serveur")
//       webSocket.emit('changerApplication', 'coupdoeil', reponse=>{
//         console.debug("Initialisation coupdoeil, reponse recue :\n%O", reponse)
//         if(reponse && reponse.err) reject(reponse.err)
//         resolve()
//       })
//     })
//
//   }
//
//   deconnecter() {
//     // console.debug("Deconnecter socket.io")
//     if(this.socket != null) {
//       this.socket.disconnect()
//       this.socket = null
//     }
//   }
//
//   getWebSocket() {
//     return this.socket;
//   }
//
//   subscribe(routingKeys, callback, opts) {
//     if(!opts) opts = {}
//
//     const niveauSecurite = opts.niveauSecurite || '3.protege'
//
//     const callbackFilter = function(message) {
//       if(!message) return
//
//       // Filtrer par routing key
//       const routingKey = message.routingKey
//       if(routingKeys.includes(routingKey) && niveauSecurite === message.exchange) {
//         console.debug("Message subscription recu %s:\n%O", routingKey, message)
//         try {
//           callback(message)
//         } catch(err) {
//           console.error("Erreur traitement callback sur %s", routingKey)
//         }
//       }
//     }
//
//     const socket = this.socket
//
//     // Transmet une liste de routingKeys a enregistrer sur notre Q.
//     socket.emit('subscribe', {routingKeys, niveauSecurite})
//     socket.on('mq_evenement', callbackFilter)
//     // socket.off('mq_evenement', callbackFilter)
//
//     // Retourne une methode pour faire le "unsubscribe"
//     return callbackFilter
//   }
//
//   unsubscribe(routingKeys, callback) {
//     // Retrait du listener d'evenement
//     // console.debug("Unsubscribe callback, socket.off %O", routingKeys)
//     this.socket.off('mq_evenement', callback)
//   }
//
//   async transmettreRequete(domaineAction, requete, opts) {
//     if(!opts) opts = {};
//
//     let enveloppe = {
//       domaineAction,
//       'requete': requete,
//       opts
//     };
//
//     return emitMessage(this.socket, 'requete', enveloppe)
//
//     // // Transmet une requete. Retourne une Promise pour recuperer la reponse.
//     // let socket = this.socket;
//     // let promise = new Promise((resolve, reject) => {
//     //   // Transmettre requete
//     //   socket.emit('requete', enveloppe, reponse=>{
//     //     if(!reponse) {
//     //       console.error("Erreur survenue durant requete vers " + domaineAction);
//     //       reject();
//     //       return;
//     //     }
//     //     // console.log("Reponse dans websocket pour requete");
//     //     // console.log(reponse);
//     //     resolve(reponse);
//     //     return reponse;
//     //   });
//     // });
//     //
//     // return promise;
//   }
//
//   transmettreRequeteMultiDomaines(domaineAction, requete, opts) {
//     if(!opts) opts = {}
//
//     let enveloppe = {
//       domaineAction,
//       'requete': requete,
//       opts
//     }
//
//     return emitMessage(this.socket, 'requeteMultiDomaines', enveloppe)
//
//     // Transmet une requete. Retourne une Promise pour recuperer les reponses de tous les domaines.
//     // let socket = this.socket;
//     // let promise = new Promise((resolve, reject) => {
//     //   let enveloppe = {
//     //     domaineAction,
//     //     'requete': requete,
//     //     opts
//     //   };
//     //
//     //   // Transmettre requete
//     //   socket.emit('requeteMultiDomaines', enveloppe, reponse=>{
//     //     if(!reponse) {
//     //       console.error("Erreur survenue durant requete multi-domaines vers " + domaineAction);
//     //       reject();
//     //       return;
//     //     }
//     //     // console.debug("Reponse dans websocket pour requete\n%O", reponse);
//     //     resolve(reponse);
//     //     return reponse;
//     //   });
//     // });
//     //
//     // return promise;
//   }
//
//   async transmettreCommande(routingKey, commande, opts) {
//     // Transmet une commande. Retourne une Promise pour recuperer la reponse.
//     if(!opts) opts = {};
//
//     let enveloppe = {
//       'routingKey': routingKey,
//       'commande': commande
//     }
//     if(opts.exchange) enveloppe.exchange = opts.exchange
//
//     return emitMessage(this.socket, 'commande', enveloppe)
//
//     // let socket = this.socket;
//     // let promise = new Promise((resolve, reject) => {
//     //   let enveloppe = {
//     //     'routingKey': routingKey,
//     //     'commande': commande
//     //   };
//     //
//     //   if(opts.exchange) enveloppe.exchange = opts.exchange
//     //
//     //   // Transmettre requete
//     //   let reponseFunction;
//     //
//     //   if(!opts.nowait) {
//     //
//     //     reponseFunction = reponse=>{
//     //       if(!reponse) {
//     //         console.error("Erreur survenue durant commande vers " + routingKey);
//     //         reject();
//     //         return;
//     //       }
//     //       // console.log("Reponse dans websocket pour requete");
//     //       // console.log(reponse);
//     //       resolve(reponse);
//     //       return reponse;
//     //     };
//     //
//     //   }
//     //   socket.emit('commande', enveloppe, reponseFunction);
//     // });
//     //
//     // return promise;
//   }
//
//   transmettreTransaction(routingKey, transaction, opts) {
//     let socket = this.socket;
//     let promise = new Promise((resolve, reject) => {
//       let enveloppe = {routingKey, transaction};
//       if(opts) {
//         enveloppe['opts'] = opts
//       }
//
//       // Transmettre requete
//       socket.emit('transaction', enveloppe, reponse=>{
//         if(!reponse) {
//           reject(new Error("Erreur survenue durant transaction vers " + routingKey));
//           return;
//         }
//         // console.log("Reponse dans websocket pour requete");
//         // console.log(reponse);
//         resolve(reponse);
//       });
//     });
//
//     return promise;
//   }
//
//   // Transmet une cle au maitredescles
//   transmettreCle(domaine, correlation, identificateursDocument, cleChiffree, iv, fingerprint) {
//     const routingKeyCle = 'MaitreDesCles.nouvelleCle.document';
//     let transactionCle = {
//       fingerprint: fingerprint,
//       cle: cleChiffree,
//       iv: iv,
//       domaine,
//       "identificateurs_document": identificateursDocument,
//       'uuid-transaction': correlation,
//     };
//
//     return this.transmettreTransaction(routingKeyCle, transactionCle);
//   }
//
//   demanderTokenTransfert() {
//     return this.emit('creerTokenTransfert', {'token': true});
//   }
//
//   emit(eventType, content) {
//     let promise = new Promise((resolve, reject)=>{
//
//       var timeoutReponse = setTimeout(function () {
//         reject(new Error("Timeout " + eventType));
//       }, 10000);
//
//       this.socket.emit(eventType, content, reponse=>{
//         clearTimeout(timeoutReponse);  // Annuler timeout
//
//         if(!reponse) {
//           reject(new Error("Erreur survenue durant emit " + eventType));
//           return;
//         }
//         resolve(reponse);
//       });
//     });
//
//     return promise;
//   }
//
//   emitWEventCallback(eventType, content, eventTypeCallback) {
//     // Methode qui simule la reception d'un callback en emettant un
//     // evenement puis en ecoutant sur un nouveau type (socket.on(...))
//
//     let promise = new Promise((resolve, reject) => {
//       var socket = this.socket;
//
//       // Creation d'un timeout pour faire le clreanup.
//       var timeoutHandler = setTimeout(function () {
//         socket.removeListener(eventTypeCallback);
//         reject(new Error("Timeout " + eventType));
//       }, 15000);
//
//       // Activer le listener.
//       socket.on(eventTypeCallback, (event, cb)=>{
//         // console.debug("Event recu " + eventTypeCallback);
//         // console.debug(event);
//
//         // Cleanup
//         clearTimeout(timeoutHandler);
//         socket.removeListener(eventTypeCallback);
//
//         resolve([event, cb]);
//       });
//
//       // Emettre l'evenement declencheur.
//       socket.emit(eventType, content);
//     });
//
//     return promise;
//   }
//
//   uploadFichier(uploadInfo) {
//     return this.uploadFichierManager.uploadFichier(this.socket, uploadInfo);
//   }
//
//   async getCatalogueApplications() {
//     const domaineAction = 'CatalogueApplications.listeApplications'
//     var applications = await this.transmettreRequete(domaineAction, {})
//     return applications
//   }
//
//   async soumettreConfigurationApplication(configuration) {
//     return emitMessage(this.socket, 'coupdoeil/ajouterCatalogueApplication', configuration)
//   }
//
//   async requeteClesNonDechiffrables(tailleBatch) {
//     return emitMessage(this.socket, 'coupdoeil/requeteClesNonDechiffrables', {taille: tailleBatch})
//   }
//
//   async soumettreBatchClesRechiffrees(transactions, setNbClesCompletees) {
//     for(let idx in transactions) {
//       const transaction = transactions[idx]
//       console.debug("Emettre transaction de soumettreBatchClesRechiffrees : %O", transaction)
//       try {
//         const reponse = await emitMessage(this.socket, 'coupdoeil/transactionCleRechiffree', transaction)
//         console.debug("Reponse transaction soumettreBatchClesRechiffrees : %O", reponse)
//         setNbClesCompletees(idx)
//       } catch(err) {
//         console.error(`Erreur transaction ${idx}, on continue, %O`, err)
//       }
//     }
//   }
//
//   async chargerCles() {
//     console.debug("Charger cles")
//     const reponse = await emitMessage(this.socket, 'coupdoeil/restaurationChargerCles', {})
//     console.debug("Reponse commande chargerCles : %O", reponse)
//     return reponse
//   }
//
// }

async function emitMessage(socket, eventType, valeur) {
  return new Promise((resolve, reject)=>{
    const timeout = setTimeout(_=>{reject(new Error('emitMessage ' + eventType + ': Timeout socket.io'))}, 7500)
    socket.emit(eventType, valeur, reponse => {
      clearTimeout(timeout)
      if(reponse && reponse.err) {
        console.error("Erreur : %O", reponse.err)
        return reject(reponse.err)
      }
      return resolve(reponse)
    })
  })
}
