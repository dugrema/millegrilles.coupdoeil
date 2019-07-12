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

var challenge_conserve = null;

class SessionManagement {

  constructor() {
    this.auth_tokens = {'12345': '0'};
    this.timer;
    this.session_timeout = process.env.COUPDOEIL_SESSION_TIMEOUT || (600 * 1000);
    this.session_timeout = Number(this.session_timeout);
  }

  start() {
    // Cleanup des sessions expirees aux 5 minutes
    this.timer = setInterval(() => this.clean(), 5 * 60000);
  }

  clean() {
    // console.debug('Session timeout: ' + this.session_timeout);
    // console.debug("Session cleanup start, " + Object.keys(this.auth_tokens).length + " active sessions");

    // Nettoie les sessions expirees
    var tokens_expire = []
    const current_time_ms = (new Date()).getTime();
    for(var idx_token in this.auth_tokens) {
      if(this.auth_tokens[idx_token] < current_time_ms) {
        tokens_expire.push(idx_token);
      }
    }

    var token_expire = tokens_expire.pop();
    while(token_expire) {
      console.debug("Cleanup token expire " + token_expire);
      delete this.auth_tokens[token_expire];
      token_expire = tokens_expire.pop();
    }

  }

  addSession(token) {
    this.auth_tokens[token] = (new Date()).getTime() + this.session_timeout;
  }

  checkUpdateToken(token) {
    var token_timeout = this.auth_tokens[token];

    if(!token_timeout || token_timeout < (new Date()).getTime()) {
      // Token inconnu ou expire
      delete this.auth_tokens[token];
      return false;
    }

    // Token est correct, on met a jour le timeout.
    this.auth_tokens[token] = (new Date()).getTime() + this.session_timeout;
    return true;
  }

}
const sessionManagement = new SessionManagement();
sessionManagement.start();

/* Authentification */
router.post('/initialiser-empreinte', (req, res) => {
    const { id, email } = req.body;

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

router.post('/login', (req, res) => {

  let filtre = {"_mg-libelle": "profil.usager"};
  rabbitMQ.singleton.get_document(
    'millegrilles.domaines.Principale', filtre)
  .then( doc => {
    // console.log(doc);
    if (!doc || doc.empreinte_absente) {
        return res.sendStatus(400);
    }

    let challenge = generateLoginChallenge(doc.cles);
    console.log("Challenge login");
    // console.debug(challenge);

    challenge_conserve = challenge.challenge;
    // console.debug("Challenge conserve login: ");
    // console.debug(challenge_conserve);
    return res.send(challenge);

  }).catch( err => {
    console.error("Erreur login")
    console.error(err);
    return res.sendStatus(500);
  });

});

router.post('/login-challenge', (req, res) => {
  console.log("/login-challenge appele");
  console.log(req.body);

    const { challenge, keyId } = parseLoginRequest(req.body);
    if (!challenge) {
      // console.debug("Challenge pas recu")
      return res.sendStatus(400);
    }

    // console.debug("Challlenge recu login: ");
    // console.debug(challenge);

    if (challenge_conserve !== challenge) {
      console.warn("Challenge ne match pas")
      return res.sendStatus(400);
    }

    let filtre = {"_mg-libelle": "profil.usager"};
    rabbitMQ.singleton.get_document(
      'millegrilles.domaines.Principale', filtre)
    .then( doc => {
      // console.log(doc);
      if (!doc || doc.empreinte_absente) {
        console.warn("Doc absent ou empreinte_absente trouvee");
        return res.sendStatus(400);
      }

      // Trouve la bonne cle a verifier dans la collection de toutes les cles
      var cle_match;
      let cle_id_utilisee = req.body.rawId;
      // console.debug("Document profil, cles");
      // console.debug(doc['cles']);
      // console.debug("\n\n");

      let cles = doc['cles'];
      for(var i_cle in cles) {
        let cle = cles[i_cle];
        let credID = cle['credID'];
        credID = credID.substring(0, cle_id_utilisee.length);
        // console.log("Cle: ");
        // console.log(credID);

        if(credID === cle_id_utilisee) {
          cle_match = cle;
          // console.log("Cle choisie");
          // console.log(cle);
          break;
        }
      }

      if(!cle_match) {
        console.error("Clee inconnue: " + cle_id_utilisee);
        console.error(cle_id_utilisee);
        return res.sendStatus(400);
      }

      const loggedIn = verifyAuthenticatorAssertion(req.body, cle_match);
      // console.debug("Logged in? " + loggedIn);

      if(loggedIn) {
        // Session valid for 5 minutes of inactivity
        sessionManagement.addSession(challenge);
        // auth_tokens[challenge] = (new Date).getTime() + session_timeout;
      }

      return res.send({ loggedIn });
    }).catch( err => {
      console.error("Erreur login")
      console.error(err);
      return res.sendStatus(500);
    });

});

/* Requete */
router.post('/requete', function(req, res, next) {

  // Verifier si le token d'authentification match
  var auth_token = req.headers['auth-token'];
  var sessionValid = sessionManagement.checkUpdateToken(auth_token);
  // var saved_token = auth_tokens[auth_token];
  // console.debug('Session valid?' + sessionValid);
  if(!sessionValid) {
    res.status(403);
    return res.json({'error': 'not logged in or session expired'});
  }

  // Formater la requete et transmettre a RabbitMQ
  console.log("POST /requete: ")
  console.log(req.body);

  reponse_serveur = rabbitMQ.singleton.transmettreRequete(
    'requete.millegrilles.domaines.Principale',
    req.body
  )
  .then((msg) => {
    let correlationId = msg.properties.correlationId;
    let messageContent = decodeURIComponent(escape(msg.content));
    let routingKey = msg.fields.routingKey;

    // Attendre la reponse - callback apres 1 seconde si erreur (timeout)
    reponse = {
      'requete': req.body,
      'reponse': messageContent
    };

    res.json(messageContent);
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
