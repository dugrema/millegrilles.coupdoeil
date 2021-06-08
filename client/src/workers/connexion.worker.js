import {expose as comlinkExpose} from 'comlink'

import connexionClient from '@dugrema/millegrilles.common/lib/connexionClient'

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
  return connexionClient.emitBlocking('coupdoeil/requeteCatalogueDomaines')
}
function requeteClesNonDechiffrables(tailleBatch, listeHachageIgnorer) {
  return connexionClient.emitBlocking('coupdoeil/requeteClesNonDechiffrables', {
    taille: tailleBatch, hachage_ignorer: listeHachageIgnorer})
}
function getCatalogueApplications() {
  return connexionClient.emitBlocking('coupdoeil/requeteCatalogueApplications')
}
function requeteInfoApplications(params) {
  return connexionClient.emitBlocking('coupdoeil/requeteInfoApplications', params)
}
function requeteConfigurationApplication(params) {
  return connexionClient.emitBlocking('coupdoeil/requeteConfigurationApplication', params)
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
  return connexionClient.emitBlocking('coupdoeil/restaurationDomaines', params)
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
  return connexionClient.emit('coupdoeil/ajouterCatalogueApplication', configuration)
}
function installerApplication(params) {
  return connexionClient.emit('coupdoeil/installerApplication', params)
}
function installerDomaine(params) {
  return connexionClient.emit('coupdoeil/installerDomaine', params)
}
function lancerBackupSnapshot(params) {
  return connexionClient.emit('coupdoeil/lancerBackupSnapshot', params)
}
function genererCertificatNoeud(commande) {
  return connexionClient.emitBlocking('coupdoeil/genererCertificatNoeud', commande)
}
function desinstallerApplication(commande) {
  return connexionClient.emitBlocking('coupdoeil/desinstallerApplication', commande)
}
function configurerApplication(commande) {
  return connexionClient.emitBlocking('coupdoeil/configurerApplication', commande)
}
function demarrerApplication(commande) {
  return connexionClient.emitBlocking('coupdoeil/demarrerApplication', commande)
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
function commandeTransmettreCatalogues(commande) {
  return connexionClient.emitBlocking('coupdoeil/commandeTransmettreCatalogues', commande)
}
function genererCertificatNavigateur(params) {
  return connexionClient.emitBlocking('genererCertificatNavigateur', params)
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
  lancerBackupSnapshot, genererCertificatNoeud, desinstallerApplication,
  configurerApplication, demarrerApplication, regenererPreviews,
  configurerConsignationWeb, soumettreTransactionMaitredescles, clearFichierPublie,
  uploadCollectionsPubliques, commandeTransmettreCatalogues,

  requeteListeUsagers, requeteUsager, genererCertificatNavigateur,
})
