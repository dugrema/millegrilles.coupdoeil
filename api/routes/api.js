var rabbitMQ = require('./res/rabbitMQ');
var express = require('express');
var router = express.Router();
var amqp = require('amqplib');
var fs = require('fs');

let mqConnectionUrl = 'amqps://dev2:dev2@dev2:5673/dev2';
rabbitMQ.singleton.connect(mqConnectionUrl);

/* Sample. */
router.get('/', function(req, res, next) {
  res.json({'doc_json': true, 'dict': {'value': 1, 'autre': 'Poutine'}});
});

/* Authentification */
router.get('/authentifier', function(req, res, next) {
  res.json({'doc_json': true, 'dict': {'value': 1, 'autre': 'Poutine'}});
});

/* Requete */
router.post('/requete', function(req, res, next) {
  // Formater la requete et transmettre a RabbitMQ
  console.log("POST /requete: ")
  console.log(req.body);

  // Attendre la reponse - callback apres 1 seconde si erreur (timeout)
  reponse = {
    'doc_json': true,
    'dict': {'value': 1, 'autre': 'Poutine'},
    'requete': req.body
  };

  var repondu = false;
  reponse_fonction = function() {
    if(!repondu) {
      repondu = true;
      res.json(reponse);
    } else {
      console.log("Reponse redondante");
    }
  }
  setTimeout(reponse_fonction, 1000);

  reponse_serveur = rabbitMQ.singleton.transmettreRequete(
    'test.routing',
    {'requete': req.body}
  )
  .then((msg) => {
    console.log("Message on the way back!");
    let correlationId = msg.properties.correlationId;
    let messageContent = decodeURIComponent(escape(msg.content));
    let routingKey = msg.fields.routingKey;

    reponse['correlationId'] = correlationId;
    reponse_fonction();
  })
  .catch(err => {
    console.error("Erreur!");
    console.error(err);
  });

});

module.exports = router;
