import {expose as comlinkExpose} from 'comlink'
import { MESSAGE_KINDS } from '@dugrema/millegrilles.utiljs/src/constantes'

// import * as connexionClient from '@dugrema/millegrilles.reactjs/src/connexionClient'
import connexionClient from '@dugrema/millegrilles.reactjs/src/connexionClientV2'

const DOMAINE_CORETOPOLOGIE = 'CoreTopologie',
      DOMAINE_CORECATALOGUES = 'CoreCatalogues',
      DOMAINE_COREMAITREDESCOMPTES = 'CoreMaitreDesComptes',
      DOMAINE_MAITREDESCLES = 'MaitreDesCles',
      DOMAINE_INSTANCE = 'instance',
      DOMAINE_HEBERGEMENT = 'Hebergement'

function testWorker() {
  // console.debug("connexion worker ok")
  return true
}

function getClesChiffrage() {
  return connexionClient.emitWithAck('getClesChiffrage', {})
}

function requeteListeNoeuds(params) {
  // console.debug("Requete liste noeuds, params : %O", params)
  return connexionClient.emitWithAck(
    'requeteListeNoeuds', params,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORETOPOLOGIE, action: 'listeNoeuds', ajouterCertificat: true}
  )
}
function requeteListeDomaines() {
  return connexionClient.emitWithAck(
    'coupdoeil/requeteListeDomaines', {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORETOPOLOGIE, action: 'listeDomaines', ajouterCertificat: true}
  )
}
function requeteListeUsagers(params) {
  params = params || {}
  return connexionClient.emitWithAck(
    'maitrecomptes/requeteListeUsagers', params,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_COREMAITREDESCOMPTES, action: 'getListeUsagers', ajouterCertificat: true}
  )
}
function requeteUsager(params) {
  return connexionClient.emitWithAck(
    'maitrecomptes/requeteUsager', params,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_COREMAITREDESCOMPTES, action: 'chargerUsager', ajouterCertificat: true}
  )
}
function requeteCatalogueDomaines() {
  throw new Error("deprecated")
  // return connexionClient.emitWithAck('coupdoeil/requeteCatalogueDomaines')
}
function requeteClesNonDechiffrables(tailleBatch, nombreClesRechiffrees) {
  return connexionClient.emitWithAck(
    'coupdoeil/requeteClesNonDechiffrables', 
    {
      limite: tailleBatch, 
      // skip: nombreClesRechiffrees,
      // date_creation_min: dateCreationMin,
      // exclude_hachage_bytes: excludeHachageBytes,
    },
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_MAITREDESCLES, action: 'clesNonDechiffrables', ajouterCertificat: true}
  )
}
function getCatalogueApplications() {
  return connexionClient.emitWithAck(
    'coupdoeil/requeteCatalogueApplications', {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORECATALOGUES, action: 'listeApplications', ajouterCertificat: true}
  )
}
function requeteInfoApplications(params) {
  return connexionClient.emitWithAck(
    'coupdoeil/requeteInfoApplications', params, 
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORECATALOGUES, action: 'infoApplication', ajouterCertificat: true}
  )
}
function requeteVersionsApplications(params) {
  return connexionClient.emitWithAck(
    'listeVersionsApplication', params, 
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_CORECATALOGUES, action: 'listeVersionsApplication', ajouterCertificat: true}
  )
}
// function requeteRapportBackup(params) {
//   return connexionClient.emitWithAck('coupdoeil/requeteRapportBackup', params)
// }
function requeteConfigurationApplication(params) {
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
    'coupdoeil/requeteCompterClesNonDechiffrables', 
    {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_MAITREDESCLES, action: 'compterClesNonDechiffrables', ajouterCertificat: true}
  )
}

function requeteListeClientsHebergement() {
  return connexionClient.emitWithAck(
    'getListeClientsHebergement', 
    {},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: DOMAINE_HEBERGEMENT, action: 'getListeClients', ajouterCertificat: true}
  )
}


// function getCertificatsMaitredescles() {
//   return connexionClient.emitWithAck('coupdoeil/getCertificatsMaitredescles')
// }
function getUploadsEnCours() {
  return connexionClient.emitWithAck('coupdoeil/getUploadsEnCours')
}
function getDocumentParFuuid(params) {
  return connexionClient.emitWithAck('coupdoeil/getDocumentParFuuid', params)
}

function getConfigurationAcme(instanceId) {
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck('coupdoeil/restaurationChargerCles', params)
}
function restaurationDomaines(params) {
  let domaine = 'global.restaurerTransactions'
  if(params.domaine) {
    domaine = params.domaine + '.restaurerTransactions'
  }
  // console.debug("Demarrer restaurationDomaines domaine = %s : %O", domaine, params)
  return connexionClient.emitWithAck('coupdoeil/restaurationDomaines', params, {domaine})
}
function restaurationGrosfichiers(params) {
  throw new Error('connexion.worker restaurationGrosfichiers obsolete')
  // return connexionClient.emitWithAck('coupdoeil/restaurationGrosfichiers', params)
}
// function backupApplication(params) {
//   return connexionClient.emitWithAck('coupdoeil/backupApplication', params)
// }
// function restaurerApplication(params) {
//   return connexionClient.emitWithAck('coupdoeil/restaurerApplication', params)
// }
function soumettreCleRechiffree(commandes) {
  return connexionClient.emitWithAck('coupdoeil/transactionCleRechiffree', commandes)
}
function soumettreConfigurationApplication(configuration) {
  // return connexionClient.emit('coupdoeil/ajouterCatalogueApplication', configuration)
  return connexionClient.emitWithAck(
    'coupdoeil/ajouterCatalogueApplication', 
    configuration, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'ajouterCatalogueApplication', partition: configuration.instance_id, exchange: configuration.exchange, ajouterCertificat: true}
  )
}
async function installerApplication(params) {
  try {
    return await connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
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
//   return connexionClient.emitWithAck('coupdoeil/resetBackup', params, {domaine})
// }
function genererCertificatNoeud(commande) {
  return connexionClient.emitWithAck(
    'coupdoeil/genererCertificatNoeud',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CorePki', action: 'signerCsr', attacherCertificat: true}
  )
}
function configurerApplication(commande) {
  return connexionClient.emitWithAck(
    'coupdoeil/configurerApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'configurerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function demarrerApplication(commande) {
  return connexionClient.emitWithAck(
    'coupdoeil/demarrerApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'demarrerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function arreterApplication(commande) {
  return connexionClient.emitWithAck(
    'coupdoeil/arreterApplication', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'arreterApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function regenererPreviews() {
  return connexionClient.emitWithAck('coupdoeil/regenererPreviews', {})
}
function configurerConsignationWeb(configuration) {
  return connexionClient.emitWithAck('coupdoeil/configurerConsignationWeb', configuration)
}
function soumettreTransactionMaitredescles(transaction) {
  return connexionClient.emitWithAck('coupdoeil/soumettreTransactionMaitredescles', transaction)
}
function clearFichierPublie(commande) {
  throw new Error('connexion.worker clearFichierPublie obsolete')
  // return connexionClient.emitWithAck('coupdoeil/clearFichierPublie', commande)
}
function uploadCollectionsPubliques(commande) {
  throw new Error('connexion.worker uploadCollectionsPubliques obsolete')
  // return connexionClient.emitWithAck('coupdoeil/uploadCollectionsPubliques', commande)
}
function commandeTransmettreCatalogues() {
  return connexionClient.emitWithAck(
    'coupdoeil/transmettreCatalogues', 
    {},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'instance', action: 'transmettreCatalogues', attacherCertificat: true}
  )
}
function commandeSoumettreCatalogueApplication(commande) {
  return connexionClient.emitWithAck(
    'coupdoeil/commandeSoumettreCatalogueApplication', 
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreCatalogues', action: 'catalogueApplication', attacherCertificat: true}
  )
}
function genererCertificatNavigateur(params) {
  return connexionClient.emitWithAck(
    'genererCertificatNavigateur', 
    params,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'signerCompteUsager', attacherCertificat: true}
  )
}
function resetWebauthn(userId, resetWebauthn, evictAllSessions) {
  return connexionClient.emitWithAck(
    'maitrecomptes/resetWebauthnUsager',
    {userId, resetWebauthn, evictAllSessions},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'resetWebauthnUsager', attacherCertificat: true}
  )
}
function majDelegations(params) {
  return connexionClient.emitWithAck(
    'maitrecomptes/majDelegations',
    params,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'majUsagerDelegations', attacherCertificat: true}
  )
}
function regenererDomaine(domaine) {
  return connexionClient.emitWithAck('coupdoeil/regenererDomaine', {}, {domaine})
}

function majMonitor(params) {
  return connexionClient.emitWithAck(
    'coretopologie/majMonitor',
    params,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'instance', attacherCertificat: true}
  )
}

function supprimerInstance(instanceId) {
  return connexionClient.emitWithAck(
    'coretopologie/supprimerInstance',
    {instance_id: instanceId},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'supprimerInstance', attacherCertificat: true}
  )
}

function getRecoveryCsr(code, nomUsager) {
  return connexionClient.emitWithAck(
    'getRecoveryCsr',
    {nom_usager: nomUsager, code},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'getCsrRecoveryParcode', attacherCertificat: true}
  )
}

function signerRecoveryCsr(commande) {
  return connexionClient.emitWithAck(
    'signerRecoveryCsr', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'signerCompteUsager', attacherCertificat: true}
  )
}

function signerRecoveryCsrParProprietaire(commande) {
  return connexionClient.emitWithAck(
    'signerRecoveryCsrParProprietaire', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreMaitreDesComptes', action: 'signerCompteParProprietaire', attacherCertificat: true}
  )
}

function resetClesNonDechiffrables(commande) {
  commande = commande || {}
  return connexionClient.emitWithAck(
    'resetClesNonDechiffrables', 
    commande, 
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'MaitreDesCles', action: 'resetNonDechiffrable', attacherCertificat: true}
  )
}

function rechiffrerClesBatch(contenuChiffre, dechiffrage) {
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
    'getConfigurationFichiers',
    requete ,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'CoreTopologie', action: 'getConfigurationFichiers', attacherCertificat: true}
  )
}

function getPublicKeySsh() {
  const requete = {}
  return connexionClient.emitWithAck(
    'getPublicKeySsh',
    requete ,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'fichiers', action: 'getPublicKeySsh', attacherCertificat: true}
  )
}

function getPasskeysUsager(userId) {
  const requete = {userId}
  return connexionClient.emitWithAck(
    'getPasskeysUsager',
    requete ,
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'CoreMaitreDesComptes', action: 'getPasskeysUsager', attacherCertificat: true}
  )
}

async function modifierConfigurationConsignation(commande, commandeMaitredescles) {
  let attachements = null
  if(commandeMaitredescles) {
    attachements = {cle: commandeMaitredescles}
  }
  return connexionClient.emitWithAck(
    'modifierConfigurationConsignation', commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'configurerConsignation', attacherCertificat: true, attachements}
  )
}

function setFichiersPrimaire(commande) {
  return connexionClient.emitWithAck(
    'setFichiersPrimaire',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'setFichiersPrimaire', attacherCertificat: true}
  )
}

function declencherSync() {
  return connexionClient.emitWithAck(
    'declencherSync',
    {},
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'fichiers', action: 'declencherSync', attacherCertificat: true}
  )
}

function demarrerBackupTransactions(commande) {
  return connexionClient.emitWithAck(
    'demarrerBackupTransactions',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'backup', action: 'demarrerBackupTransactions', attacherCertificat: true}
  )
}

function reindexerConsignation(commande) {
  commande = commande || {}
  return connexionClient.emitWithAck(
    'reindexerConsignation',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'GrosFichiers', action: 'reindexerConsignation', attacherCertificat: true}
  )
}

function resetTransfertsSecondaires(commande) {
  commande = commande || {}
  return connexionClient.emitWithAck(
    'resetTransfertsSecondaires',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'fichiers', action: 'resetTransfertsSecondaires', attacherCertificat: true}
  )
}

function getCles(liste_hachage_bytes, opts) {
  opts = opts || {}
  return connexionClient.emitWithAck(
    'getCles',
    {cle_ids: liste_hachage_bytes, domaine: opts.domaine},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'MaitreDesCles', action: 'dechiffrageV2', attacherCertificat: true}
  )
}

function getConfigurationNotifications(opts) {
  opts = opts || {}
  return connexionClient.emitWithAck(
    'getConfigurationNotifications',
    {inclure_cles: true, ...opts},
    {kind: MESSAGE_KINDS.KIND_REQUETE, domaine: 'Messagerie', action: 'getConfigurationNotifications', attacherCertificat: true}
  )
}

function conserverConfigurationNotifications(commande, cles) {
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
    'genererClewebpushNotifications',
    opts,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'Messagerie', action: 'genererClewebpushNotifications', attacherCertificat: true}
  )
}

function transmettreCleSymmetrique(commande) {
  return connexionClient.emitWithAck(
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
  return connexionClient.emitWithAck(
    'setConsignationInstance',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'setConsignationInstance', attacherCertificat: true}
  )
}

async function sauvegarderClientHebergement(commande, commandeMaitredescles) {
  let attachements = null
  if(commandeMaitredescles) {
    attachements = {cle: commandeMaitredescles}
  }
  return connexionClient.emitWithAck(
    'sauvegarderClientHebergement', commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'Hebergement', action: 'sauvegarderClient', attacherCertificat: true, attachements}
  )
}

async function ajouterConsignationHebergee(url) {
  const commande = {url}
  return connexionClient.emitWithAck(
    'ajouterConsignationHebergee',
    commande,
    {kind: MESSAGE_KINDS.KIND_COMMANDE, domaine: 'CoreTopologie', action: 'ajouterConsignationHebergee', attacherCertificat: true}
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
  return connexionClient.subscribe('ecouterEvenementsPresenceNoeuds', cb)
}

function retirerCallbackEvenementsNoeuds(cb) { 
  return connexionClient.unsubscribe('retirerEvenementsPresenceNoeuds', cb)
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

function enregistrerCallbackEvenementsUsager(cb) { 
  const params = {}
  return connexionClient.subscribe('ecouterEvenementsUsager', cb, params) 
}

function retirerCallbackEvenementsUsager(cb) { 
  const params = {}
  return connexionClient.unsubscribe('retirerEvenementsUsager', cb, params) 
}

function enregistrerCallbackEvenementsHebergement(cb) { 
  const params = {}
  return connexionClient.subscribe('ecouterEvenementsHebergement', cb, params) 
}

function retirerCallbackEvenementsHebergement(cb) { 
  const params = {}
  return connexionClient.unsubscribe('retirerEvenementsHebergement', cb, params) 
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
  getPasskeysUsager, 
  
  requeteListeClientsHebergement, sauvegarderClientHebergement,
  enregistrerCallbackEvenementsHebergement, retirerCallbackEvenementsHebergement,

  majDelegations, signerRecoveryCsrParProprietaire,
  // requeteRapportBackup, resetBackup, 
  majMonitor, supprimerInstance,
  getConfigurationAcme, configurerDomaineAcme, getRecoveryCsr, signerRecoveryCsr, 
  resetClesNonDechiffrables, rechiffrerClesBatch, getConfigurationFichiers, getPublicKeySsh,
  modifierConfigurationConsignation, setFichiersPrimaire, declencherSync, demarrerBackupTransactions,
  getCles, getConfigurationNotifications, conserverConfigurationNotifications, genererClewebpushNotifications,
  transmettreCleSymmetrique, verifierClesSymmetriques,
  reindexerConsignation, setConsignationPourInstance, requeteVersionsApplications, resetTransfertsSecondaires,

  ajouterConsignationHebergee,

  enregistrerCallbackEvenementsPresenceDomaine, retirerCallbackEvenementsPresenceDomaine,
  enregistrerCallbackEvenementsNoeuds, retirerCallbackEvenementsNoeuds,
  enregistrerCallbackEvenementsInstances, retirerCallbackEvenementsInstances,
  enregistrerCallbackEvenementsApplications, retirerCallbackEvenementsApplications,
  enregistrerEvenementsAcme, retirerEvenementsAcme,
  enregistrerCallbackEvenementsConsignation, retirerCallbackEvenementsConsignation,
  ecouterEvenementsRechiffageCles, retirerEvenementsRechiffageCles,
  ecouterEvenementsBackup, retirerEvenementsBackup,
  enregistrerCallbackEvenementsUsager, retirerCallbackEvenementsUsager,
})
