import {expose as comlinkExpose} from 'comlink'

import * as connexionClient from '@dugrema/millegrilles.reactjs/src/connexionClient'

function testWorker() {
  // console.debug("connexion worker ok")
  return true
}

function getClesChiffrage() {
  return connexionClient.emitBlocking('getClesChiffrage', {})
}

function requeteListeNoeuds(params) {
  // console.debug("Requete liste noeuds, params : %O", params)
  return connexionClient.emitBlocking('coupdoeil/requeteListeNoeuds', params)
}
function requeteListeDomaines() {
  return connexionClient.emitBlocking('coupdoeil/requeteListeDomaines')
}
function requeteListeUsagers(params) {
  params = params || {}
  return connexionClient.emitBlocking('maitrecomptes/requeteListeUsagers', params)
}
function requeteUsager(params) {
  return connexionClient.emitBlocking('maitrecomptes/requeteUsager', params)
}
function requeteCatalogueDomaines() {
  throw new Error("deprecated")
  // return connexionClient.emitBlocking('coupdoeil/requeteCatalogueDomaines')
}
function requeteClesNonDechiffrables(tailleBatch, dateCreationMin, excludeHachageBytes) {
  return connexionClient.emitBlocking('coupdoeil/requeteClesNonDechiffrables', {
    limite: tailleBatch, 
    date_creation_min: dateCreationMin,
    exclude_hachage_bytes: excludeHachageBytes,
  })
}
function getCatalogueApplications() {
  return connexionClient.emitBlocking('coupdoeil/requeteCatalogueApplications')
}
function requeteInfoApplications(params) {
  return connexionClient.emitBlocking('coupdoeil/requeteInfoApplications', params)
}
function requeteRapportBackup(params) {
  return connexionClient.emitBlocking('coupdoeil/requeteRapportBackup', params)
}
function requeteConfigurationApplication(params) {
  return connexionClient.emitBlocking(
    'coupdoeil/requeteConfigurationApplication', 
    params, 
    {
      domaine: 'instance', 
      action: 'requeteConfigurationApplication', 
      partition: params.instanceId, 
      exchange: params.exchange, 
      ajouterCertificat: true
    }
  )
}
function requeteCompterClesNonDechiffrables() {
  return connexionClient.emitBlocking('coupdoeil/requeteCompterClesNonDechiffrables', {})
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
      domaine: 'instance', 
      action: 'configurerDomaine', 
      partition,
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
  return connexionClient.emitBlocking('coupdoeil/restaurationGrosfichiers', params)
}
function backupApplication(params) {
  return connexionClient.emitBlocking('coupdoeil/backupApplication', params)
}
function restaurerApplication(params) {
  return connexionClient.emitBlocking('coupdoeil/restaurerApplication', params)
}
function soumettreCleRechiffree(commandes) {
  return connexionClient.emitBlocking('coupdoeil/transactionCleRechiffree', commandes)
}
function soumettreConfigurationApplication(configuration) {
  // return connexionClient.emit('coupdoeil/ajouterCatalogueApplication', configuration)
  return connexionClient.emitBlocking(
    'coupdoeil/ajouterCatalogueApplication', 
    configuration, 
    {domaine: 'instance', action: 'ajouterCatalogueApplication', partition: configuration.instance_id, exchange: configuration.exchange, ajouterCertificat: true}
  )
}
async function installerApplication(params) {
  try {
    return await connexionClient.emitBlocking(
      'coupdoeil/installerApplication', 
      params, 
      {domaine: 'instance', action: 'installerApplication', partition: params.instance_id, exchange: params.exchange, ajouterCertificat: true}
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
    {domaine: 'instance', action: 'supprimerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function installerDomaine(params) {
  return connexionClient.emit('coupdoeil/installerDomaine', params)
}
function lancerBackupSnapshot(params) {
  const domaine = params.domaine || 'global', action = 'declencherBackupHoraire'
  return connexionClient.emit(
    'coupdoeil/lancerBackupSnapshot',
    params,
    {domaine, action, ajouterCertificat: true}
  )
}
function resetBackup(params) {
  let domaine = 'global.resetBackup'
  if(params.domaine) {
    domaine = params.domaine + '.resetBackup'
  }
  // console.debug("Reset backup domaine = %s : %O", domaine, params)
  return connexionClient.emitBlocking('coupdoeil/resetBackup', params, {domaine})
}
function genererCertificatNoeud(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/genererCertificatNoeud',
    commande,
    {domaine: 'CorePki', action: 'signerCsr', attacherCertificat: true}
  )
}
function configurerApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/configurerApplication', 
    commande, 
    {domaine: 'instance', action: 'configurerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function demarrerApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/demarrerApplication', 
    commande, 
    {domaine: 'instance', action: 'demarrerApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function arreterApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/arreterApplication', 
    commande, 
    {domaine: 'instance', action: 'arreterApplication', partition: commande.instance_id, exchange: commande.exchange, ajouterCertificat: true}
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
  return connexionClient.emitBlocking('coupdoeil/clearFichierPublie', commande)
}
function uploadCollectionsPubliques(commande) {
  return connexionClient.emitBlocking('coupdoeil/uploadCollectionsPubliques', commande)
}
function commandeTransmettreCatalogues() {
  return connexionClient.emitBlocking(
    'coupdoeil/transmettreCatalogues', 
    {},
    {domaine: 'instance', action: 'transmettreCatalogues', attacherCertificat: true}
  )
}
function commandeSoumettreCatalogueApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/commandeSoumettreCatalogueApplication', 
    commande,
    {domaine: 'CoreCatalogues', action: 'catalogueApplication', attacherCertificat: true}
  )
}
function genererCertificatNavigateur(params) {
  return connexionClient.emitBlocking(
    'genererCertificatNavigateur', 
    params,
    {domaine: 'CoreMaitreDesComptes', action: 'signerCompteUsager', attacherCertificat: true}
  )
}
function resetWebauthn(userId, resetWebauthn, resetActivations, evictAllSessions) {
  return connexionClient.emitBlocking(
    'maitrecomptes/resetWebauthnUsager',
    {userId, resetWebauthn, resetActivations, evictAllSessions},
    {domaine: 'CoreMaitreDesComptes', action: 'resetWebauthnUsager', attacherCertificat: true}
  )
}
function majDelegations(params) {
  return connexionClient.emitBlocking(
    'maitrecomptes/majDelegations',
    params,
    {domaine: 'CoreMaitreDesComptes', action: 'majUsagerDelegations', attacherCertificat: true}
  )
}
function regenererDomaine(domaine) {
  return connexionClient.emitBlocking('coupdoeil/regenererDomaine', {}, {domaine})
}

function majMonitor(params) {
  return connexionClient.emitBlocking(
    'coretopologie/majMonitor',
    params,
    {domaine: 'CoreTopologie', action: 'instance', attacherCertificat: true}
  )
}

function supprimerInstance(instanceId) {
  return connexionClient.emitBlocking(
    'coretopologie/supprimerInstance',
    {instance_id: instanceId},
    {domaine: 'CoreTopologie', action: 'supprimerInstance', attacherCertificat: true}
  )
}

function getRecoveryCsr(code, nomUsager) {
  return connexionClient.emitBlocking(
    'getRecoveryCsr',
    {nom_usager: nomUsager, code},
    {domaine: 'CoreMaitreDesComptes', action: 'getCsrRecoveryParcode', attacherCertificat: true}
  )
}

function signerRecoveryCsr(commande) {
  return connexionClient.emitBlocking(
    'signerRecoveryCsr', 
    commande, 
    {domaine: 'CoreMaitreDesComptes', action: 'signerCompteUsager', attacherCertificat: true}
  )
}

function resetClesNonDechiffrables(commande) {
  commande = commande || {}
  return connexionClient.emitBlocking(
    'resetClesNonDechiffrables', 
    commande, 
    {domaine: 'MaitreDesCles', action: 'resetNonDechiffrable', attacherCertificat: true}
  )
}

function rechiffrerClesBatch(commande) {
  commande = commande || {}
  return connexionClient.emitBlocking(
    'rechiffrerClesBatch', 
    commande, 
    {domaine: 'MaitreDesCles', action: 'rechiffrerBatch', attacherCertificat: true}
  )
}

function getConfigurationFichiers() {
  const requete = {}
  return connexionClient.emitBlocking(
    'getConfigurationFichiers',
    requete ,
    {domaine: 'CoreTopologie', action: 'getConfigurationFichiers', attacherCertificat: true}
  )
}

function getPublicKeySsh() {
  const requete = {}
  return connexionClient.emitBlocking(
    'getPublicKeySsh',
    requete ,
    {domaine: 'fichiers', action: 'getPublicKeySsh', attacherCertificat: true}
  )
}

function modifierConfigurationConsignation(commande) {
  return connexionClient.emitBlocking(
    'modifierConfigurationConsignation',
    commande,
    {domaine: 'CoreTopologie', action: 'configurerConsignation', attacherCertificat: true}
  )
}

function setFichiersPrimaire(commande) {
  return connexionClient.emitBlocking(
    'setFichiersPrimaire',
    commande,
    {domaine: 'CoreTopologie', action: 'setFichiersPrimaire', attacherCertificat: true}
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
  backupApplication, restaurerApplication, soumettreCleRechiffree,
  soumettreConfigurationApplication, installerApplication, installerDomaine,
  lancerBackupSnapshot, genererCertificatNoeud, supprimerApplication,
  configurerApplication, demarrerApplication, arreterApplication, regenererPreviews,
  configurerConsignationWeb, soumettreTransactionMaitredescles, clearFichierPublie,
  uploadCollectionsPubliques, commandeTransmettreCatalogues, commandeSoumettreCatalogueApplication,

  regenererDomaine,
  requeteListeUsagers, requeteUsager, genererCertificatNavigateur, resetWebauthn,
  majDelegations, requeteRapportBackup, resetBackup, majMonitor, supprimerInstance,
  getConfigurationAcme, configurerDomaineAcme, getRecoveryCsr, signerRecoveryCsr, 
  resetClesNonDechiffrables, rechiffrerClesBatch, getConfigurationFichiers, getPublicKeySsh,
  modifierConfigurationConsignation, setFichiersPrimaire,

  enregistrerCallbackEvenementsPresenceDomaine, retirerCallbackEvenementsPresenceDomaine,
  enregistrerCallbackEvenementsNoeuds, retirerCallbackEvenementsNoeuds,
  enregistrerCallbackEvenementsInstances, retirerCallbackEvenementsInstances,
  enregistrerCallbackEvenementsApplications, retirerCallbackEvenementsApplications,
  enregistrerEvenementsAcme, retirerEvenementsAcme,
  enregistrerCallbackEvenementsConsignation, retirerCallbackEvenementsConsignation,
})
