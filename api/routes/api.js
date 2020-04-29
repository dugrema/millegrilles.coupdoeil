var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

// var {SessionManagement} = require('./res/sessionManagement');
// var amqp = require('amqplib');
// var rabbitMQ = require('./res/rabbitMQ');
// var router = express.Router();

const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');

class SocketSession {
  constructor() {
  }
}

function APIRouteurInitialiser(sessionManagement) {

  const router = express.Router();

  // const sessionManagement = SessionManagement(rabbitMQ);
  // sessionManagement.start();
  var challenge_conserve = null;

  router.use(bodyParser.json());

  /* Sample. */
  router.get('/', function(req, res, next) {
    res.json({'doc_json': true, 'dict': {'value': 1, 'autre': 'Poutine'}});
  });

  /* Authentification */
  router.post('/initialiser-empreinte', (req, res) => {
      const { idmg, email } = req.body;
      console.log("initialiser-empreinte: Id " + id + ", email " + email);

      const rabbitMQ = sessionManagement.rabbitMQParIdmg[idmg];
      if(!rabbitMQ) {
        console.error("RabbitMQ n'existe pas pour idmg " + idmg);
        res.sendStatus(403);
      }

      // Verifier que la MilleGrille n'a pas deja d'empreinte usager
      let filtre = {"_mg-libelle": "cles"};
      rabbitMQ.get_document(
        'millegrilles.domaines.Principale', filtre)
      .then( doc => {
        // console.log(doc);

        if(doc['empreinte_absente'] !== true) {
          return res.sendStatus(400);
        }

        // Transmettre le challenge
        const challengeResponse = generateRegistrationChallenge({
            relyingParty: { name: 'coupdoeil' },
            user: { id, name: email }
        });
        // challenge_conserve = challengeResponse.challenge;
        sessionManagement.conserverChallenge(idmg, challengeResponse.challenge);

        res.send(challengeResponse);
      })
      .catch( err => {
        console.error("Erreur initialiser-empreinte");
        console.error(err);
        return res.sendStatus(500);
      });

  });

  // router.post('/effectuer-empreinte', (req, res) => {
  //
  //   const {idmg} = req.body;
  //   const challenge_conserve = sessionManagement.consommerChallenge(idmg);
  //
  //   if(challenge_conserve) {
  //     console.log("Effectuer empreinte");
  //
  //     const { key, challenge } = parseRegisterRequest(req.body);
  //
  //     console.log("Parsed: key, challenge");
  //     console.log(key);
  //     console.log(challenge);
  //
  //     // Note: MilleGrilles fonctionne avec un seul usager. Pas besoin
  //     // de matcher l'usager autrement que par le challenge.
  //     if (challenge_conserve !== challenge) {
  //       return res.sendStatus(400); // Erreur dans le matching du challenge
  //     }
  //
  //     empreinte = {
  //         'cle': key
  //     }
  //
  //     const rabbitMQ = sessionManagement.rabbitMQParIdmg[idmg];
  //     if(!rabbitMQ) {
  //       console.error("RabbitMQ n'existe pas pour idmg " + idmg);
  //       res.sendStatus(403);
  //     }
  //
  //     // Noter que la transaction va echouer si l'empreinte a deja ete creee.
  //     rabbitMQ.transmettreTransactionFormattee(
  //         empreinte, 'millegrilles.domaines.Principale.creerEmpreinte')
  //       .then( msg => {
  //         console.log("Recu confirmation de creation d'empreinte");
  //         console.log(msg);
  //       })
  //       .catch( err => {
  //         console.error("Erreur message");
  //         console.error(err);
  //         return res.sendStatus(500);
  //       });
  //
  //     return res.send({ loggedIn: true });
  //   } else {
  //     // On n'est pas en processus d'ajout de token
  //     return res.sendStatus(403);
  //   }
  //
  // });

  /* Authentification */
  router.post('/initialiser-ajout-token', (req, res) => {
      const { id, email, pin } = req.body;
      console.log("initialiser-ajout-token: Id " + id + ", email " + email);

      // Verifier que le pin est correct
      let pinCorrect = sessionManagement.consommerPinTemporaireDevice(pin);
      if(pinCorrect) {
        // Transmettre le challenge
        const challengeResponse = generateRegistrationChallenge({
            relyingParty: { name: 'coupdoeil' },
            user: { id, name: email }
        });
        challenge_conserve = challengeResponse.challenge;
        res.send(challengeResponse);
      }
      else {
        return res.sendStatus(403);
      }

  });

  router.post('/effectuer-ajout-token', (req, res) => {

      if(challenge_conserve) {

        console.log("Effectuer ajout token");

        const { key, challenge } = parseRegisterRequest(req.body);

        console.log("Parsed: key, challenge");
        console.log(key);
        console.log(challenge);

        // Note: MilleGrilles fonctionne avec un seul usager. Pas besoin
        // de matcher l'usager autrement que par le challenge.
        if (challenge_conserve !== challenge) {
          return res.sendStatus(400); // Erreur dans le matching du challenge
        }

        infoToken = {
            'cle': key
        }

        // Noter que la transaction va echouer si l'empreinte a deja ete creee.
        rabbitMQ.transmettreTransactionFormattee(
            infoToken, 'millegrilles.domaines.Principale.ajouterToken')
          .then( msg => {
            console.log("Recu confirmation d'ajout de nouveau token");
            console.log(msg);
          })
          .catch( err => {
            console.error("Erreur message");
            console.error(err);
            return res.sendStatus(500);
          });

        challenge_conserve = null;
        return res.send({ loggedIn: true });
      } else {
        // On n'est pas en processus d'ajout de token
        return res.sendStatus(403);
      }
  });

  router.post('/generercertificat', (req, res) => {

    // Verifier que le pin est correct
    const { pin, cle_publique, sujet } = req.body;
    let pinCorrect = sessionManagement.consommerPinTemporaireDevice(pin);

    if(pinCorrect) {
      console.log("generercertificat: sujet " + sujet + ", cle_publique " + cle_publique);

      // Creer la transaction pour creer le certificat de navigateur
      const transaction = {
        'sujet': sujet,
        'cle_publique': cle_publique,
      };

      rabbitMQ.transmettreTransactionFormattee(
        transaction, 'millegrilles.domaines.MaitreDesCles.genererCertificatNavigateur'
      )
      .then( msg => {
        console.log("Recu certificat pour navigateur");
        let messageContent = decodeURIComponent(escape(msg.content));
        let certificatInfo = JSON.parse(messageContent);
        console.log(messageContent);
        res.send(messageContent);
      })
      .catch( err => {
        console.error("Erreur message");
        console.error(err);
        res.sendStatus(500);
      });

    } else {
      console.warn("generercertificat pin incorrect: " + pin);
      res.sendStatus(403);
    }

  });

  return router;

}

module.exports = {APIRouteurInitialiser};
