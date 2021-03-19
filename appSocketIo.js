// Gestion evenements socket.io pour /millegrilles
const debug = require('debug')('millegrilles:grosfichiers:appSocketIo');

const routingKeysPrive = [
  // 'transaction.SenseursPassifs.#.majNoeud',
  // 'transaction.SenseursPassifs.#.majSenseur',
  // 'evenement.SenseursPassifs.#.lecture',
  'appSocketio.nodejs',  // Juste pour trouver facilement sur exchange - debug
]

function configurerEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
      {eventName: 'grosfichiers/getDocumentsParUuid', callback: (params, cb) => {getDocumentsParUuid(socket, params, cb)}},
      {eventName: 'grosfichiers/getClesChiffrage', callback: cb => {getClesChiffrage(socket, cb)}},
      {eventName: 'grosfichiers/getActivite', callback: (params, cb) => {getActivite(socket, params, cb)}},
      {eventName: 'grosfichiers/getCorbeille', callback: (params, cb) => {getCorbeille(socket, params, cb)}},
      {eventName: 'grosfichiers/getCleFichier', callback: (requete, cb) => {getCleFichier(socket, requete, cb)}},
      {eventName: 'grosfichiers/getCollections', callback: cb => {getCollections(socket, cb)}},
      {eventName: 'grosfichiers/getFavoris', callback: cb => {getFavoris(socket, cb)}},
      {eventName: 'grosfichiers/getSites', callback: cb => {getSites(socket, cb)}},
      {eventName: 'grosfichiers/getContenuCollection', callback: (params, cb) => {getContenuCollection(socket, params, cb)}},
    ],
    listenersProteges: [
      {eventName: 'grosfichiers/ajouterDocumentsDansCollection', callback: (params, cb) => {ajouterDocumentsDansCollection(socket, params, cb)}},
      {eventName: 'grosfichiers/creerCollection', callback: (params, cb) => {creerCollection(socket, params, cb)}},
      {eventName: 'grosfichiers/changerFavoris', callback: (params, cb) => {changerFavoris(socket, params, cb)}},
      {eventName: 'grosfichiers/supprimerDocuments', callback: (params, cb) => {supprimerDocuments(socket, params, cb)}},
      {eventName: 'grosfichiers/retirerDocuments', callback: (params, cb) => {retirerDocuments(socket, params, cb)}},
      {eventName: 'grosfichiers/recupererDocuments', callback: (params, cb) => {recupererDocuments(socket, params, cb)}},
      {eventName: 'grosfichiers/renommerDocument', callback: (params, cb) => {renommerDocument(socket, params, cb)}},
      {eventName: 'grosfichiers/decrireCollection', callback: (params, cb) => {decrireCollection(socket, params, cb)}},
      {eventName: 'grosfichiers/decrireFichier', callback: (params, cb) => {decrireFichier(socket, params, cb)}},
      {eventName: 'grosfichiers/transcoderVideo', callback: (params, cb) => {transcoderVideo(socket, params, cb)}},
    ]
  }

  return configurationEvenements
}

async function getDocumentsParUuid(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const uuidsDocuments = params.uuids_documents
    debug("Demande documents pas uuid : %O", )
    const documents = await dao.getDocumentsParUuid(uuidsDocuments)
    cb(documents)
  } catch(err) {
    debug("Erreur getDocumentsParUuid\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getClesChiffrage(socket, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Demande cles chiffrage")
    const cles = await dao.getClesChiffrage()
    cb(cles)
  } catch(err) {
    debug("Erreur getClesChiffrage\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getActivite(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Demande fichiers activite")
    const fichiers = await dao.getActivite(params)
    cb(fichiers)
  } catch(err) {
    debug("Erreur getActivite\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getCorbeille(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Demande fichiers corbeille")
    const fichiers = await dao.getCorbeille(params)
    cb(fichiers)
  } catch(err) {
    debug("Erreur getCorbeille\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getCleFichier(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Demande cle pour fichier %O", params)
    const cle = await dao.getCleFichier(params.fuuid, params.certificat)
    cb(cle)
  } catch(err) {
    debug("Erreur getCleFichier\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getFavoris(socket, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Get favoris")
    const collections = await dao.getFavoris()
    cb(collections)
  } catch(err) {
    debug("Erreur getFavoris\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getSites(socket, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Get sites")
    const sites = await dao.getSites()
    cb(sites)
  } catch(err) {
    debug("Erreur getSites\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getCollections(socket, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("Get collections")
    const collections = await dao.getCollections()
    cb(collections)
  } catch(err) {
    debug("Erreur getCollections\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function getContenuCollection(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const uuid_collection = params.uuid_collection
    debug("Get contenu collection : %s", uuid_collection)
    const contenuCollection = await dao.getContenuCollection(uuid_collection, params)
    debug("Recu contenu collection : %O", contenuCollection)
    cb(contenuCollection)
  } catch(err) {
    debug("Erreur getCollections\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function ajouterDocumentsDansCollection(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.ajouterFichiersCollection') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.ajouterDocumentsDansCollection(transaction)
    debug("Recu confirmation ajouterDocumentsDansCollection : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur getCollections\n%O", err)
    cb({err: 'Erreur: ' + err})
  }
}

async function creerCollection(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.nouvelleCollection') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.creerCollection(transaction)
    debug("Recu confirmation creerCollection : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur getCollections\n%O", err)
    cb({err: err})
  }
}

async function changerFavoris(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.changerFavoris') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.changerFavoris(transaction)
    debug("Recu confirmation changerFavoris : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur changerFavoris\n%O", err)
    cb({err: err})
  }
}

async function supprimerDocuments(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.supprimerDocuments') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.supprimerDocuments(transaction)
    debug("Recu confirmation supprimerDocuments : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur supprimerDocuments\n%O", err)
    cb({err: err})
  }
}

async function retirerDocuments(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.retirerDocumentsCollection') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.relayerTransaction(transaction)
    debug("Recu confirmation retirerDocuments : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur retirerDocuments\n%O", err)
    cb({err: err})
  }
}

async function recupererDocuments(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.recupererDocuments') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.relayerTransaction(transaction)
    debug("Recu confirmation recupererDocuments : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur recupererDocuments\n%O", err)
    cb({err: err})
  }
}

async function renommerDocument(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.renommerDocument') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.relayerTransaction(transaction)
    debug("Recu confirmation recupererDocuments : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur renommerDocument\n%O", err)
    cb({err: err})
  }
}

async function decrireCollection(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.decrireCollection') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.relayerTransaction(transaction)
    debug("Recu confirmation decrireCollection : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur decrireCollection\n%O", err)
    cb({err: err})
  }
}

async function decrireFichier(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    const transaction = params.transaction
    debug("Transmettre transaction : %O", params)

    // Sanity check, empecher mauvais type de transaction
    if(transaction['en-tete'].domaine !== 'GrosFichiers.decrireFichier') {
      return cb({err: 'Mauvais type de transaction : ' + transaction['en-tete'].domaine})
    }

    const confirmation = await dao.relayerTransaction(transaction)
    debug("Recu confirmation decrireFichier : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur decrireFichier\n%O", err)
    cb({err: err})
  }
}

async function transcoderVideo(socket, params, cb) {
  const dao = socket.grosFichiersDao
  try {
    debug("transcoderVideo: Transmettre commande : %O", params)
    const commande = params.commande

    // Sanity check, empecher mauvais type de transaction
    if(commande['en-tete'].domaine !== 'GrosFichiers.transcoderVideo') {
      return cb({err: 'Mauvais type de commande : ' + commande['en-tete'].domaine})
    }

    const confirmation = await dao.relayerCommande(commande)
    debug("Recu confirmation transcoderVideo : %O", confirmation)
    cb(confirmation)
  } catch(err) {
    debug("Erreur transcoderVideo\n%O", err)
    cb({err: err, message: "Erreur transcoderVideo"})
  }
}

async function executerRequete(socket, domaineAction, params, cb) {
  const amqpdao = socket.amqpdao
  try {
    const options = {decoder: true}
    if(params['_signature']) {
      options.noformat = true
    }
    const reponse = await amqpdao.transmettreRequete(domaineAction, params, options)
    cb(reponse)
  } catch(err) {
    debug("Erreur executerRequete %s\n%O", domaineAction, err)
    cb({err: 'Erreur: ' + err})
  }
}

function getCleFichier(socket, requete, cb) {
  const domaineAction = 'MaitreDesCles.dechiffrage'
  debug("Requete dechiffrage cle : %O", requete)
  // Valider type de requete
  if(requete['en-tete'].domaine !== domaineAction) {
    throw new Error(`Domaine requete invalide : ${requete['en-tete'].domaine}`)
  }
  executerRequete(socket, domaineAction, requete, cb)
}

module.exports = {
  configurerEvenements
}
