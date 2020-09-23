var fs = require('fs');
const debug = require('debug')('millegrilles:coupdoeil:coupdoeilSocketApp')

function configurationEvenements(socket) {
  const configurationEvenements = {
    listenersPrives: [
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
      {eventName: 'requete', callback: (enveloppe, cb) => {
         debug("Enveloppe de requete recue");
         debug(enveloppe);
        const domaineAction = enveloppe.domaineAction;
        const requete = enveloppe.requete;
        const opts = enveloppe.opts || {};

        socket.amqpdao.transmettreRequete(domaineAction, requete)
        .then( reponse => {
          debug("Reponse recue : %O", reponse)
          cb(reponse.resultats || reponse)
        })
        .catch( err => {
          console.error("Erreur requete");
          console.error(err);
          cb(); // Callback sans valeurs
        });
      }},
      {eventName: 'requeteMultiDomaines', callback: (enveloppe, cb) => {
        // console.debug("Enveloppe de requete recue");
        // console.debug(enveloppe);
        const domaineAction = enveloppe.domaineAction;
        const requete = enveloppe.requete;
        const opts = enveloppe.opts || {};

        socket.amqpdao.transmettreRequeteMultiDomaines(domaineAction, requete)
        .then( reponse => {
          cb(reponse.resultats || reponse)
        })
        .catch( err => {
          console.error("Erreur requete multi-domaines");
          console.error(err);
          cb(); // Callback sans valeurs
        });
      }}
    ],
    listenersProteges: [
      {eventName: 'transaction', callback: (message, cb) => {
        traiterTransaction(socket.amqpdao, message, cb)
      }},
      {eventName: 'commande', callback: (message, cb) => {
        traiterCommande(socket.amqpdao, message, cb)
      }}
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

module.exports = {configurationEvenements};
