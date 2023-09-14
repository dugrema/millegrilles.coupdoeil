import {expose as comlinkExpose} from 'comlink'
import { MESSAGE_KINDS } from '@dugrema/millegrilles.utiljs/src/constantes'

import * as connexionClient from '@dugrema/millegrilles.reactjs/src/connexionClient'

const DOMAINE_CORETOPOLOGIE = 'CoreTopologie',
      DOMAINE_CORECATALOGUES = 'CoreCatalogues',
      DOMAINE_COREMAITREDESCOMPTES = 'CoreMaitreDesComptes',
      DOMAINE_MAITREDESCLES = 'MaitreDesCles',
      DOMAINE_INSTANCE = 'instance'

function testWorker() {
  // console.debug("connexion worker ok")
  return true
}

function getClesChiffrage() {
  return connexionClient.emitBlocking('getClesChiffrage', {})
}

function requeteListeNoeuds(params) {
  // console.debug("Requete liste noeuds, params : %O", params)
  return connexionClient.emitBlocking(
    'coupdoeil/requeteListeNoeuds', params, 
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORETOPOLOGIE, action: 'listeNoeuds', ajouterCertificat: true}
  )
}
function requeteListeDomaines() {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteListeDomaines', {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORETOPOLOGIE, action: 'listeDomaines', ajouterCertificat: true}
  )
}
function requeteListeUsagers(params) {
  params = params || {}
  return connexionClient.emitBlocking(
    'maitrecomptes/requeteListeUsagers', params,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_COREMAITREDESCOMPTES, action: 'getListeUsagers', ajouterCertificat: true}
  )
}
function requeteUsager(params) {
  return connexionClient.emitBlocking(
    'maitrecomptes/requeteUsager', params,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_COREMAITREDESCOMPTES, action: 'chargerUsager', ajouterCertificat: true}
  )
}
function requeteCatalogueDomaines() {
  throw new Error("deprecated")
  // return connexionClient.emitBlocking('coupdoeil/requeteCatalogueDomaines')
}
function requeteClesNonDechiffrables(tailleBatch, nombreClesRechiffrees) {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteClesNonDechiffrables', 
    {
      limite: tailleBatch, 
      skip: nombreClesRechiffrees,
      // date_creation_min: dateCreationMin,
      // exclude_hachage_bytes: excludeHachageBytes,
    },
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_MAITREDESCLES, action: 'clesNonDechiffrables', ajouterCertificat: true}
  )
}
function getCatalogueApplications() {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteCatalogueApplications', {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORECATALOGUES, action: 'listeApplications', ajouterCertificat: true}
  )
}
function requeteInfoApplications(params) {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteInfoApplications', params, 
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORECATALOGUES, action: 'infoApplication', ajouterCertificat: true}
  )
}
// function requeteRapportBackup(params) {
//   return connexionClient.emitBlocking('coupdoeil/requeteRapportBackup', params)
// }
function requeteConfigurationApplication(params) {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteConfigurationApplication', 
    params, 
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: 'instance', 
      action: 'requeteConfigurationApplication', 
      partition: params.instanceId, 
      exchange: params.exchange, 
      ajouterCertificat: true
    }
  )
}
function requeteCompterClesNonDechiffrables() {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteCompterClesNonDechiffrables', 
    {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_MAITREDESCLES, action: 'compterClesNonDechiffrables', ajouterCertificat: true}
  )
}
// function getCertificatsMaitredescles() {
//   return connexionClient.emitBlocking('coupdoeil/getCertificatsMaitredescles')
// }
function getUploadsEnCours() {
  return connexionClient.emitBlocking('coupdoeil/getUploadsEnCours')
}
function getDocumentParFuuid(params) {
  return connexionClient.emitBlocking('coupdoeil/getDocumentParFuuid', params)
}

function getConfigurationAcme(instanceId) {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteConfigurationAcme', 
    {instanceId}, 
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: 'instance', 
      action: 'configurationAcme', 
      partition: instanceId,
      exchange: '1.public',
      ajouterCertificat: true
    }
  )
}

function configurerDomaineAcme(commande) {
  const partition = commande.instanceId
  return connexionClient.emitBlocking(
    'coupdoeil/configurerDomaineAcme', 
    commande,
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: 'instance', 
      action: 'configurerDomaine', 
      partition,
      ajouterCertificat: true
    }
  )
}

function verifierClesSymmetriques() {
  return connexionClient.emitBlocking(
    'verifierClesSymmetriques', 
    {},
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: 'MaitreDesCles', 
      action: 'verifierCleSymmetrique', 
      ajouterCertificat: true
    }
  )
}

// Commandes

function restaurationChargerCles(params) {
  return connexionClient.emitBlocking('coupdoeil/restaurationChargerCles', params)
}
function restaurationDomaines(params) {
  let domaine = 'global.restaurerTransactions'
  if(params.domaine) {
    domaine = params.domaine + '.restaurerTransactions'
  }
  // console.debug("Demarrer restaurationDomaines domaine = %s : %O", domaine, params)
  return connexionClient.emitBlocking('coupdoeil/restaurationDomaines', params, {domaine})
}
function restaurationGrosfichiers(params) {
  throw new Error('connexion.worker restaurationGrosfichiers obsolete')
  // return connexionClient.emitBlocking('coupdoeil/restaurationGrosfichiers', params)
}
// function backupApplication(params) {
//   return connexionClient.emitBlocking('coupdoeil/backupApplication', params)
// }
// function restaurerApplication(params) {
//   return connexionClient.emitBlocking('coupdoeil/restaurerApplication', params)
// }
function soumettreCleRechiffree(commandes) {
  return connexionClient.emitBlocking('coupdoeil/transactionCleRechiffree', commandes)
}
function soumettreConfigurationApplication(configuration) {
  // return connexionClient.emit('coupdoeil/ajouterCatalogueApplication', configuration)
  return connexionClient.emitBlocking(
    'coupdoeil/ajouterCatalogueApplication', 
    configuration, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'ajouterCatalogueApplication', partition: configuration.instance_id, exchange: configuration.exchange, ajouterCertificat: true}
  )
}
async function installerApplication(params) {
  try {
    return await connexionClient.emitBlocking(
      'coupdoeil/installerApplication', 
      params, 
      {kind: MESSAGE_KINDS.KIND_COMMANDE, partition: params.instance_id, domaine: 'instance', action: 'installerApplication', partition: params.instance_id, exchange: params.exchange, ajouterCertificat: true}
    )
  } catch(err) {
    console.error("Erreur InstallerApplication %O", err)
    return {ok: false, err: ''+err}
  }
}
function supprimerApplication(commande) {
  // console.debug("supprimer application %O", commande)
  return connexionClient.emitBlocking(
    'coupdoeil/supprimerApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'supprimerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function installerDomaine(params) {
  return connexionClient.emit('coupdoeil/installerDomaine', params)
}
// function lancerBackupSnapshot(params) {
//   const domaine = params.domaine || 'global', action = 'declencherBackupHoraire'
//   return connexionClient.emit(
//     'coupdoeil/lancerBackupSnapshot',
//     params,
//     {domaine, action, ajouterCertificat: true}
//   )
// }
// function resetBackup(params) {
//   let domaine = 'global.resetBackup'
//   if(params.domaine) {
//     domaine = params.domaine + '.resetBackup'
//   }
//   // console.debug("Reset backup domaine = %s : %O", domaine, params)
//   return connexionClient.emitBlocking('coupdoeil/resetBackup', params, {domaine})
// }
function genererCertificatNoeud(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/genererCertificatNoeud',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CorePki', action: 'signerCsr', attacherCertificat: true}
  )
}
function configurerApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/configurerApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'configurerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function demarrerApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/demarrerApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'demarrerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function arreterApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/arreterApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'arreterApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function regenererPreviews() {
  return connexionClient.emitBlocking('coupdoeil/regenererPreviews', {})
}
function configurerConsignationWeb(configuration) {
  return connexionClient.emitBlocking('coupdoeil/configurerConsignationWeb', configuration)
}
function soumettreTransactionMaitredescles(transaction) {
  return connexionClient.emitBlocking('coupdoeil/soumettreTransactionMaitredescles', transaction)
}
function clearFichierPublie(commande) {
  throw new Error('connexion.worker clearFichierPublie obsolete')
  // return connexionClient.emitBlocking('coupdoeil/clearFichierPublie', commande)
}
function uploadCollectionsPubliques(commande) {
  throw new Error('connexion.worker uploadCollectionsPubliques obsolete')
  // return connexionClient.emitBlocking('coupdoeil/uploadCollectionsPubliques', commande)
}
function commandeTransmettreCatalogues() {
  return connexionClient.emitBlocking(
    'coupdoeil/transmettreCatalogues', 
    {},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'transmettreCatalogues', attacherCertificat: true}
  )
}
function commandeSoumettreCatalogueApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/commandeSoumettreCatalogueApplication', 
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreCatalogues', action: 'catalogueApplication', attacherCertificat: true}
  )
}
function genererCertificatNavigateur(params) {
  return connexionClient.emitBlocking(
    'genererCertificatNavigateur', 
    params,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'signerCompteUsager', attacherCertificat: true}
  )
}
function resetWebauthn(userId, resetWebauthn, resetActivations, evictAllSessions) {
  return connexionClient.emitBlocking(
    'maitrecomptes/resetWebauthnUsager',
    {userId, resetWebauthn, resetActivations, evictAllSessions},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'resetWebauthnUsager', attacherCertificat: true}
  )
}
function majDelegations(params) {
  return connexionClient.emitBlocking(
    'maitrecomptes/majDelegations',
    params,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'majUsagerDelegations', attacherCertificat: true}
  )
}
function regenererDomaine(domaine) {
  return connexionClient.emitBlocking('coupdoeil/regenererDomaine', {}, {domaine})
}

function majMonitor(params) {
  return connexionClient.emitBlocking(
    'coretopologie/majMonitor',
    params,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'instance', attacherCertificat: true}
  )
}

function supprimerInstance(instanceId) {
  return connexionClient.emitBlocking(
    'coretopologie/supprimerInstance',
    {instance_id: instanceId},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'supprimerInstance', attacherCertificat: true}
  )
}

function getRecoveryCsr(code, nomUsager) {
  return connexionClient.emitBlocking(
    'getRecoveryCsr',
    {nom_usager: nomUsager, code},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'getCsrRecoveryParcode', attacherCertificat: true}
  )
}

function signerRecoveryCsr(commande) {
  return connexionClient.emitBlocking(
    'signerRecoveryCsr', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'signerCompteUsager', attacherCertificat: true}
  )
}

function signerRecoveryCsrParProprietaire(commande) {
  return connexionClient.emitBlocking(
    'signerRecoveryCsrParProprietaire', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'signerCompteParProprietaire', attacherCertificat: true}
  )
}

function resetClesNonDechiffrables(commande) {
  commande = commande || {}
  return connexionClient.emitBlocking(
    'resetClesNonDechiffrables', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'MaitreDesCles', action: 'resetNonDechiffrable', attacherCertificat: true}
  )
}

function rechiffrerClesBatch(contenuChiffre, dechiffrage) {
  return connexionClient.emitBlocking(
    'rechiffrerClesBatch', 
    contenuChiffre, 
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE_INTER_MILLEGRILLE, 
      domaine: 'MaitreDesCles', 
      action: 'rechiffrerBatch', 
      attacherCertificat: true,
      dechiffrage,
    }
  )
}

function getConfigurationFichiers() {
  const requete = {}
  return connexionClient.emitBlocking(
    'getConfigurationFichiers',
    requete ,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'CoreTopologie', action: 'getConfigurationFichiers', attacherCertificat: true}
  )
}

function getPublicKeySsh() {
  const requete = {}
  return connexionClient.emitBlocking(
    'getPublicKeySsh',
    requete ,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'fichiers', action: 'getPublicKeySsh', attacherCertificat: true}
  )
}

async function modifierConfigurationConsignation(commande, commandeMaitredescles) {
  let attachements = null
  if(commandeMaitredescles) {
    attachements = {cle: commandeMaitredescles}
  }
  return connexionClient.emitBlocking(
    'modifierConfigurationConsignation', commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'configurerConsignation', attacherCertificat: true, attachements}
  )
}

function setFichiersPrimaire(commande) {
  return connexionClient.emitBlocking(
    'setFichiersPrimaire',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'setFichiersPrimaire', attacherCertificat: true}
  )
}

function declencherSync() {
  return connexionClient.emitBlocking(
    'declencherSync',
    {},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'fichiers', action: 'declencherSync', attacherCertificat: true}
  )
}

function demarrerBackupTransactions(commande) {
  return connexionClient.emitBlocking(
    'demarrerBackupTransactions',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'backup', action: 'demarrerBackupTransactions', attacherCertificat: true}
  )
}

function reindexerConsignation(commande) {
  commande = commande || {}
  return connexionClient.emitBlocking(
    'reindexerConsignation',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'GrosFichiers', action: 'reindexerConsignation', attacherCertificat: true}
  )
}

function getCles(liste_hachage_bytes, opts) {
  opts = opts || {}
  return connexionClient.emitBlocking(
    'getCles',
    {liste_hachage_bytes, domaine: opts.domaine},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'MaitreDesCles', action: 'dechiffrage', attacherCertificat: true}
  )
}

function getConfigurationNotifications(opts) {
  opts = opts || {}
  return connexionClient.emitBlocking(
    'getConfigurationNotifications',
    {inclure_cles: true, ...opts},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'Messagerie', action: 'getConfigurationNotifications', attacherCertificat: true}
  )
}

function conserverConfigurationNotifications(commande, cles) {
  return connexionClient.emitBlocking(
    'conserverConfigurationNotifications',
    commande,
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: 'Messagerie', action: 'conserverConfigurationNotifications', 
      attachements: cles,
      attacherCertificat: true}
  )
}

function genererClewebpushNotifications(opts) {
  opts = opts || {}
  return connexionClient.emitBlocking(
    'genererClewebpushNotifications',
    opts,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'Messagerie', action: 'genererClewebpushNotifications', attacherCertificat: true}
  )
}

function transmettreCleSymmetrique(commande) {
  return connexionClient.emitBlocking(
    'transmettreCleSymmetrique',
    commande,
    {
      kind: MESSAGE_KINDS.KIND_COMMANDE, 
      domaine: 'MaitreDesCles', 
      action: 'cleSymmetrique', 
      partition: commande.fingerprint, 
      attacherCertificat: true
    }
  )
}

function setConsignationPourInstance(instance_id, consignation_id) {
  const commande = {instance_id, consignation_id}
  return connexionClient.emitBlocking(
    'setConsignationInstance',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'setConsignationInstance', attacherCertificat: true}
  )
}

// Listeners
function enregistrerCallbackEvenementsPresenceDomaine(cb) { 
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsPresenceDomaines', cb) 
}

function retirerCallbackEvenementsPresenceDomaine(cb) { 
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsPresenceDomaines', cb) 
}

function enregistrerCallbackEvenementsNoeuds(cb) { 
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsPresenceNoeuds', cb) 
}

function retirerCallbackEvenementsNoeuds(cb) { 
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsPresenceNoeuds', cb) 
}

function enregistrerCallbackEvenementsInstances(cb) { 
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsInstances', cb) 
}

function retirerCallbackEvenementsInstances(cb) { 
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsInstances', cb) 
}

function enregistrerCallbackEvenementsConsignation(cb) { 
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsConsignation', cb) 
}

function retirerCallbackEvenementsConsignation(cb) { 
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsConsignation', cb) 
}

function enregistrerCallbackEvenementsApplications(instanceId, securite, cb) {
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsApplications', cb, {instanceId, exchange: securite})
}
async function retirerCallbackEvenementsApplications(instanceId, securite, cb) {
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsApplications', cb, {instanceId, exchange: securite})
}

function enregistrerEvenementsAcme(instanceId, securite, cb) {
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsAcme', cb, {instanceId, exchange: securite})
}
async function retirerEvenementsAcme(instanceId, securite, cb) {
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsAcme', cb, {instanceId, exchange: securite})
}

async function ecouterEvenementsRechiffageCles(params, cb) { 
  return connexionClient.subscribe('ecouterEvenementsRechiffageCles', cb, params)
}

async function retirerEvenementsRechiffageCles(params, cb) {
  return connexionClient.unsubscribe('retirerEvenementsRechiffageCles', cb, params) 
}

async function ecouterEvenementsBackup(params, cb) { 
  return connexionClient.subscribe('ecouterEvenementsBackup', cb, params)
}

async function retirerEvenementsBackup(params, cb) {
  return connexionClient.unsubscribe('retirerEvenementsBackup', cb, params) 
}


comlinkExpose({
  ...connexionClient,
  // connecter,  // Override de connexionClient.connecter

  testWorker,

  getClesChiffrage,

  requeteListeNoeuds, requeteListeDomaines, requeteCatalogueDomaines,
  requeteClesNonDechiffrables, getCatalogueApplications, requeteInfoApplications,
  requeteConfigurationApplication, requeteCompterClesNonDechiffrables,
  getUploadsEnCours, getDocumentParFuuid,
  restaurationChargerCles, restaurationDomaines, restaurationGrosfichiers,
  // backupApplication, restaurerApplication, 
  soumettreCleRechiffree,
  soumettreConfigurationApplication, installerApplication, installerDomaine,
  //lancerBackupSnapshot, 
  genererCertificatNoeud, supprimerApplication,
  configurerApplication, demarrerApplication, arreterApplication, regenererPreviews,
  configurerConsignationWeb, soumettreTransactionMaitredescles, clearFichierPublie,
  uploadCollectionsPubliques, commandeTransmettreCatalogues, commandeSoumettreCatalogueApplication,

  regenererDomaine,
  requeteListeUsagers, requeteUsager, genererCertificatNavigateur, resetWebauthn,
  majDelegations, signerRecoveryCsrParProprietaire,
  // requeteRapportBackup, resetBackup, 
  majMonitor, supprimerInstance,
  getConfigurationAcme, configurerDomaineAcme, getRecoveryCsr, signerRecoveryCsr, 
  resetClesNonDechiffrables, rechiffrerClesBatch, getConfigurationFichiers, getPublicKeySsh,
  modifierConfigurationConsignation, setFichiersPrimaire, declencherSync, demarrerBackupTransactions,
  getCles, getConfigurationNotifications, conserverConfigurationNotifications, genererClewebpushNotifications,
  transmettreCleSymmetrique, verifierClesSymmetriques,
  reindexerConsignation, setConsignationPourInstance,


  enregistrerCallbackEvenementsPresenceDomaine, retirerCallbackEvenementsPresenceDomaine,
  enregistrerCallbackEvenementsNoeuds, retirerCallbackEvenementsNoeuds,
  enregistrerCallbackEvenementsInstances, retirerCallbackEvenementsInstances,
  enregistrerCallbackEvenementsApplications, retirerCallbackEvenementsApplications,
  enregistrerEvenementsAcme, retirerEvenementsAcme,
  enregistrerCallbackEvenementsConsignation, retirerCallbackEvenementsConsignation,
  ecouterEvenementsRechiffageCles, retirerEvenementsRechiffageCles,
  ecouterEvenementsBackup, retirerEvenementsBackup,
})
