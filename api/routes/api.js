var rabbitMQ = require('./res/rabbitMQ');
var express = require('express');
var router = express.Router();
var amqp = require('amqplib');
var fs = require('fs');

let mqConnectionUrl = 'amqps://dev2:5673/dev2';
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

module.exports = router;
