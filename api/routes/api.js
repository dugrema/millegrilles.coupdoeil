var rabbitMQ = require('./res/rabbitMQ');
var express = require('express');
var router = express.Router();
var amqp = require('amqplib');
var fs = require('fs');
var sessionManagement = require('./res/sessionManagement');
var bodyParser = require('body-parser');

const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');

router.use(bodyParser.json());

/* Sample. */
router.get('/', function(req, res, next) {
  res.json({'doc_json': true, 'dict': {'value': 1, 'autre': 'Poutine'}});
});

var challenge_conserve = null;

class SocketSession {
  constructor() {
  }
}

/* Authentification */
router.post('/initialiser-empreinte', (req, res) => {
    const { id, email } = req.body;
    console.debug("initialiser-empreinte: Id " + id + ", email " + email);

    // Verifier que la MilleGrille n'a pas deja d'empreinte usager
    let filtre = {"_mg-libelle": "profil.usager"};
    rabbitMQ.singleton.get_document(
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
      challenge_conserve = challengeResponse.challenge;

      res.send(challengeResponse);
    })
    .catch( err => {
      console.error("Erreur initialiser-empreinte");
      console.error(err);
      return res.sendStatus(500);
    });

});

router.post('/effectuer-empreinte', (req, res) => {

    console.log("Effectuer empreinte");

    const { key, challenge } = parseRegisterRequest(req.body);

    console.log("Parsed: key, challenge");
    console.log(key);
    console.log(challenge);

    // Note: MilleGrilles fonctionne avec un seul usager. Pas besoin
    // de matcher l'usager autrement que par le challenge.
    if (challenge_conserve !== challenge) {
      return res.sendStatus(400); // Erreur dans le matching du challenge
    }

    empreinte = {
        'cle': key
    }

    // Noter que la transaction va echouer si l'empreinte a deja ete creee.
    rabbitMQ.singleton.transmettreTransactionFormattee(
        empreinte, 'millegrilles.domaines.Principale.creerEmpreinte')
      .then( msg => {
        console.log("Recu confirmation de creation d'empreinte");
        console.log(msg);
      })
      .catch( err => {
        console.error("Erreur message");
        console.error(err);
        return res.sendStatus(500);
      });

    return res.send({ loggedIn: true });
});

/* Authentification */
router.post('/initialiser-ajout-token', (req, res) => {
    const { id, email, pin } = req.body;
    console.debug("initialiser-ajout-token: Id " + id + ", email " + email);

    // Verifier que le pin est correct
    let pinCorrect = true; //sessionManagement.consommerPinTemporaireDevice(pin);
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
    rabbitMQ.singleton.transmettreTransactionFormattee(
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

    return res.send({ loggedIn: true });
});

module.exports = router;
