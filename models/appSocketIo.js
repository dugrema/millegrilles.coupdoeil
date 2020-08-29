// const debug = require('debug')('millegrilles:coupdoeil:appSocketIo');
// // const {WebSocketApp} = require('millegrilles.common/lib/websocketsapp')
//
// addSocketConnection(socket) {
//
//   // Authentification privee
//   // Doit s'assurer que la connexion est pour le bon IDMG
//   // et que c'est le proprietaire
//   const estProprietaire = socket.request.headers['est-proprietaire'] || process.env.DEV
//   const idmgClient = socket.request.headers['idmg-compte'] || socket.request.headers['idmg'] || process.env.IDMG
//   debug("Request headers socket WSS :\n%O", socket.request.headers)
//   const rabbitMQ = this.fctRabbitMQParIdmg(idmgClient);
//
//   return new Promise(async (resolve, reject)=>{
//     const params = {
//       idMillegrille: idmgClient
//     }
//
//     if(!estProprietaire) {
//       debug("Usager n'est pas proprietaire")
//       socket.emit('erreur.login', {'erreur': 'erreur pas proprietaire'});
//       return reject(new Error("Usager n'est pas proprietaire de la millegrille sur socket " + socket.id))
//     } else if(!rabbitMQ) {
//       // La MilleGrille est inconnue
//       debug("MilleGrille non initialisee")
//       socket.emit('erreur.login', {'erreur': 'erreur init rabbitmq'});
//       return reject(new Error("L'identificateur MilleGrille '" + idmgClient + "' n'est pas connu"))
//     } else {
//       debug("Connexion Socket.IO prete")
//       socket.emit("pret", {login: true})
//       return resolve(rabbitMQ)
//     }
//   })
//
// }
//
// function addSocket(socket) {
//   enregistrerPrive(socket)
// }
//
// // Enregistre les evenements prive sur le socket
// async function enregistrerPrive(socket) {
//   debug("Enregistrer evenements prives sur socket %s", socket.id)
//   socket.on('disconnect', ()=>{deconnexion(socket)})
// }
//
// // Enregistre les evenements proteges sur le socket d'un usager prive
// function enregistrerEvenementsProtegesUsagerPrive(socket) {
//   debug("Enregistrer evenements proteges usager prive")
//
//   socket.listenersProteges = []
//   function ajouterListenerProtege(listenerName, cb) {
//     socket.listenersProteges.push(listenerName)
//     socket.on(listenerName, cb)
//   }
//
//   // ajouterListenerProtege('associerIdmg', params => {
//   //   debug("Associer idmg")
//   // })
//
// }
//
// // Enregistre les evenements proteges sur le socket du proprietaire
// function enregistrerEvenementsProtegesProprietaire(socket) {
//   debug("Enregistrer evenements proteges proprietaire")
//
//   if(!socket.listenersProteges) {
//     socket.listenersProteges = []
//   }
//   function ajouterListenerProtege(listenerName, cb) {
//     socket.listenersProteges.push(listenerName)
//     socket.on(listenerName, cb)
//   }
//
//   // ajouterListenerProtege('ajouterMotdepasse', params => {
//   //   debug("Ajouter mot de passe")
//   // })
// }
//
// function deconnexion(socket) {
//   debug("Deconnexion coupdoeil %s", socket.id)
// }
//
// module.exports = {addSocket}
