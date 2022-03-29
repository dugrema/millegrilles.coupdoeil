import {expose as comlinkExpose} from 'comlink'

// import connexionClient from '@dugrema/millegrilles.common/lib/connexionClient'
import * as connexionClient from '@dugrema/millegrilles.reactjs/src/connexionClient'
// import '@dugrema/millegrilles.reactjs/src/hachage'  // Init hachage optimise (WASM)

const URL_SOCKET = '/coupdoeil/socket.io'

function connecter(opts) {
  opts = opts || {}
  var url = opts.url
  if(!url) {
    // Utiliser le serveur local mais remplacer le pathname par URL_SOCKET
    const urlLocal = new URL(opts.location)
    urlLocal.pathname = URL_SOCKET
    urlLocal.hash = ''
    urlLocal.search = ''
    url = urlLocal.href
  }
  console.debug("Connecter socket.io sur url %s", url)
  return connexionClient.connecter(url, opts)
}

function requeteListeNoeuds(params) {
  console.debug("Requete liste noeuds, params : %O", params)
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
function requeteClesNonDechiffrables(tailleBatch, pageBatch) {
  return connexionClient.emitBlocking('coupdoeil/requeteClesNonDechiffrables', {
    limite: tailleBatch, page: pageBatch})
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
      domaine: 'monitor', 
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
function getCertificatsMaitredescles() {
  return connexionClient.emitBlocking('coupdoeil/getCertificatsMaitredescles')
}
function getUploadsEnCours() {
  return connexionClient.emitBlocking('coupdoeil/getUploadsEnCours')
}
function getDocumentParFuuid(params) {
  return connexionClient.emitBlocking('coupdoeil/getDocumentParFuuid', params)
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
  console.debug("Demarrer restaurationDomaines domaine = %s : %O", domaine, params)
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
    {domaine: 'monitor', action: 'ajouterCatalogueApplication', partition: configuration.noeud_id, exchange: configuration.exchange, ajouterCertificat: true}
  )
}
async function installerApplication(params) {
  try {
    return await connexionClient.emitBlocking(
      'coupdoeil/installerApplication', 
      params, 
      {domaine: 'monitor', action: 'installerApplication', partition: params.noeudId, exchange: params.exchange, ajouterCertificat: true}
    )
  } catch(err) {
    console.error("Erreur InstallerApplication %O", err)
    return {ok: false, err: ''+err}
  }
}
function supprimerApplication(commande) {
  console.debug("supprimer application %O", commande)
  return connexionClient.emitBlocking(
    'coupdoeil/supprimerApplication', 
    commande, 
    {domaine: 'monitor', action: 'supprimerApplication', partition: commande.noeudId, exchange: commande.exchange, ajouterCertificat: true}
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
  console.debug("Reset backup domaine = %s : %O", domaine, params)
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
    {domaine: 'monitor', action: 'configurerApplication', partition: commande.noeud_id, exchange: commande.exchange, ajouterCertificat: true}
  )
}
function demarrerApplication(commande) {
  return connexionClient.emitBlocking(
    'coupdoeil/demarrerApplication', 
    commande, 
    {domaine: 'monitor', action: 'demarrerApplication', partition: commande.noeud_id, exchange: commande.exchange, ajouterCertificat: true}
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
    {domaine: 'monitor', action: 'transmettreCatalogues', attacherCertificat: true}
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
function resetWebauthn(userId) {
  return connexionClient.emitBlocking(
    'maitrecomptes/resetWebauthn',
    {userId},
    {domaine: 'CoreMaitreDesComptes', action: 'supprimerCles', attacherCertificat: true}
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
  console.debug("MAJ Monitor")
  return connexionClient.emitBlocking(
    'coretopologie/majMonitor',
    params,
    {domaine: 'CoreTopologie', action: 'monitor', attacherCertificat: true}
  )
}

function supprimerInstance(instanceId) {
  return connexionClient.emitBlocking(
    'coretopologie/supprimerInstance',
    {noeud_id: instanceId},
    {domaine: 'CoreTopologie', action: 'supprimerInstance', attacherCertificat: true}
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

function enregistrerCallbackEvenementsApplications(instanceId, securite, cb) {
  return connexionClient.subscribe('coupdoeil/ecouterEvenementsApplications', cb, {instanceId, exchange: securite})
}
async function retirerCallbackEvenementsApplications(instanceId, securite, cb) {
  return connexionClient.unsubscribe('coupdoeil/retirerEvenementsApplications', cb, {instanceId, exchange: securite})
}

comlinkExpose({
  ...connexionClient,
  connecter,  // Override de connexionClient.connecter

  requeteListeNoeuds, requeteListeDomaines, requeteCatalogueDomaines,
  requeteClesNonDechiffrables, getCatalogueApplications, requeteInfoApplications,
  requeteConfigurationApplication, requeteCompterClesNonDechiffrables,
  getCertificatsMaitredescles, getUploadsEnCours, getDocumentParFuuid,
  restaurationChargerCles, restaurationDomaines, restaurationGrosfichiers,
  backupApplication, restaurerApplication, soumettreCleRechiffree,
  soumettreConfigurationApplication, installerApplication, installerDomaine,
  lancerBackupSnapshot, genererCertificatNoeud, supprimerApplication,
  configurerApplication, demarrerApplication, regenererPreviews,
  configurerConsignationWeb, soumettreTransactionMaitredescles, clearFichierPublie,
  uploadCollectionsPubliques, commandeTransmettreCatalogues, commandeSoumettreCatalogueApplication,

  regenererDomaine,
  requeteListeUsagers, requeteUsager, genererCertificatNavigateur, resetWebauthn,
  majDelegations, requeteRapportBackup, resetBackup, majMonitor, supprimerInstance,

  enregistrerCallbackEvenementsPresenceDomaine, retirerCallbackEvenementsPresenceDomaine,
  enregistrerCallbackEvenementsNoeuds, retirerCallbackEvenementsNoeuds,
  enregistrerCallbackEvenementsInstances, retirerCallbackEvenementsInstances,
  enregistrerCallbackEvenementsApplications, retirerCallbackEvenementsApplications,
})
