var rabbitMQ = require('./res/rabbitMQ');
var express = require('express');
var router = express.Router();
var amqp = require('amqplib');
var fs = require('fs');

const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');

/* Sample. */
router.get('/', function(req, res, next) {
  res.json({'doc_json': true, 'dict': {'value': 1, 'autre': 'Poutine'}});
});

var challenge = null;

/* Authentification */
router.post('/initialiser-empreinte', (req, res) => {
    const { id, email } = req.body;

    const challengeResponse = generateRegistrationChallenge({
        relyingParty: { name: 'coupdoeil' },
        user: { id, name: email }
    });
    challenge = challengeResponse.challenge;

    res.send(challengeResponse);
});

router.post('/effectuer-empreinte', (req, res) => {

    console.log("Effectuer empreinte");
    console.log(req);

    const { key, challenge } = parseRegisterRequest(req.body);

    console.log("Parsed: key, challenge");
    console.log(key);
    console.log(challenge);

    /* const user = userRepository.findByChallenge(challenge);

    if (!user) {
        return res.sendStatus(400);
    }

    userRepository.addKeyToUser(user, key); */

    return res.send({ loggedIn: true });
});



/* Requete */
router.post('/requete', function(req, res, next) {
  // Formater la requete et transmettre a RabbitMQ
  console.log("POST /requete: ")
  console.log(req.body);

  reponse_serveur = rabbitMQ.singleton.transmettreRequete(
    'test.routing',
    {'requete': req.body}
  )
  .then((msg) => {
    let correlationId = msg.properties.correlationId;
    let messageContent = decodeURIComponent(escape(msg.content));
    let routingKey = msg.fields.routingKey;

    // Attendre la reponse - callback apres 1 seconde si erreur (timeout)
    reponse = {
      'doc_json': true,
      'dict': {'value': 1, 'autre': 'Poutine'},
      'requete': req.body,
      'correlationId': correlationId,
    };

    reponse['correlationId'] = correlationId;
    res.json(reponse);
  })
  .catch(err => {
    console.error("Erreur!");
    console.error(err);

    // Transmettre message erreur de traitement
    res.status(500);
    res.json(err);
  });

});

// Initialisation, connexions
// Creer les connexions
let mqConnectionUrl = process.env.MG_MQ_URL || 'amqps://mq:5673/';
rabbitMQ.singleton.connect(mqConnectionUrl);

module.exports = router;
