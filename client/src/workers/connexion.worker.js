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
function requeteRapportBackup(params) {
  return connexionClient.emitBlocking('coupdoeil/requeteRapportBackup', params)
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
function resetWebauthn(userId) {
  return connexionClient.emitBlocking('maitrecomptes/resetWebauthn', {userId})
}
function majDelegations(params) {
  return connexionClient.emitBlocking(
    'maitrecomptes/majDelegations',
    params,
    {domaine: 'MaitreDesComptes.majUsagerDelegations'}
  )
}

// Listeners
async function enregistrerCallbackEvenementsPresenceDomaine(cb) {
  connexionClient.socketOn('evenement.presence.domaine', cb)
  const resultat = await connexionClient.emitBlocking('coupdoeil/ecouterEvenementsPresenceDomaines', {}, {})
  if(!resultat) {
    throw new Error("Erreur enregistrerCallbackTopologie")
  }
}

function retirerCallbackEvenementsPresenceDomaine() {
  connexionClient.socketOff('evenement.presence.domaine')
  connexionClient.emitBlocking('coupdoeil/retirerEvenementsPresenceDomaines', {}, {})
}

async function enregistrerCallbackEvenementsNoeuds(cb) {
  connexionClient.socketOn('evenement.presence.monitor', cb)
  const resultat = await connexionClient.emitBlocking('coupdoeil/ecouterEvenementsPresenceNoeuds', {}, {})
  if(!resultat) {
    throw new Error("Erreur enregistrerCallbackEvenementsNoeuds")
  }
}

function retirerCallbackEvenementsNoeuds() {
  connexionClient.socketOff('evenement.presence.monitor')
  connexionClient.emit('coupdoeil/retirerEvenementsPresenceNoeuds', {}, {})
}

async function enregistrerCallbackEvenementsApplications(noeudId, cb) {
  connexionClient.socketOn('evenement.servicemonitor.applicationDemarree', cb)
  connexionClient.socketOn('evenement.servicemonitor.applicationArretee', cb)
  connexionClient.socketOn('evenement.servicemonitor.erreurDemarrageApplication', cb)
  const resultat = await connexionClient.emitBlocking('coupdoeil/ecouterEvenementsApplications', {noeudId}, {})
  if(!resultat) {
    throw new Error("Erreur enregistrerCallbackEvenementsNoeuds")
  }
}

function retirerCallbackEvenementsApplications(noeudId) {
  connexionClient.emit('coupdoeil/retirerEvenementsPresenceNoeuds', {noeudId}, {})
  connexionClient.socketOff('evenement.servicemonitor.applicationDemarree')
  connexionClient.socketOff('evenement.servicemonitor.applicationArretee')
  connexionClient.socketOff('evenement.servicemonitor.erreurDemarrageApplication')
}

async function enregistrerCallbackEvenementsBackup(cb) {
  connexionClient.socketOn('evenement.Backup.backupMaj', cb)
  connexionClient.socketOn('evenement.backup.backupApplication', cb)
  connexionClient.socketOn('evenement.backup.restaurationTransactions', cb)
  const resultat = await connexionClient.emitBlocking('coupdoeil/ecouterEvenementsBackup', {}, {})
  if(!resultat) {
    throw new Error("Erreur enregistrerCallbackEvenementsNoeuds")
  }
}

function retirerCallbackEvenementsBackup() {
  connexionClient.emit('coupdoeil/retirerEvenementsBackup', {}, {})
  connexionClient.socketOff('evenement.Backup.backupMaj')
  connexionClient.socketOff('evenement.backup.backupApplication')
  connexionClient.socketOff('evenement.backup.restaurationTransactions')
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

  requeteListeUsagers, requeteUsager, genererCertificatNavigateur, resetWebauthn,
  majDelegations, requeteRapportBackup,

  enregistrerCallbackEvenementsPresenceDomaine, retirerCallbackEvenementsPresenceDomaine,
  enregistrerCallbackEvenementsNoeuds, retirerCallbackEvenementsNoeuds,
  enregistrerCallbackEvenementsApplications, retirerCallbackEvenementsApplications,
  enregistrerCallbackEvenementsBackup, retirerCallbackEvenementsBackup,
})
