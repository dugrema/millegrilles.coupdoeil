var rabbitMQ = require('./res/rabbitMQ');
var express = require('express');
var router = express.Router();
var amqp = require('amqplib');
var fs = require('fs');

console.log(rabbitMQ);

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

  const options = {};
  var cacert = fs.readFileSync('/home/mathieu/certificates/millegrilles/pki.millegrilles.ssl.CAchain');
  options['ca'] = [cacert];
  var cert = fs.readFileSync('/home/mathieu/certificates/millegrilles/certs/dev2.maple.mdugre.info.cert.pem');
  options['cert'] = cert;
  var key = fs.readFileSync('/home/mathieu/certificates/millegrilles/privkeys/dev2.maple.mdugre.info.pem');
  options['key'] = key;

  let mqConnectionUrl = 'amqps://dev2:dev2@dev2:5673/dev2';

  var open = amqp.connect(mqConnectionUrl, options);
  console.log("OK!");

  // Attendre la reponse - callback?
  reponse = {
    'doc_json': true,
    'dict': {'value': 1, 'autre': 'Poutine'},
    'requete': req.body
  };

  let conn, channel, ch;
  open
    .then( conn_in => {
      console.log("Connexion reussie, ouverture channel");
      conn = conn_in;
      conn.on("error", function(err) {
        console.error("Erreur connexion MQ");
        console.error(err);
      });
      channel = conn.createChannel();
      channel
        .then( (ch) => {
          channel = ch;
          reponse['OK'] = "L'affaire est poutine!";
          console.log("Channel ouvert");
          console.log(ch);

          // Transmettre reponse
          res.json(reponse);

        })
        .catch( (err) => {
          console.log("Erreur ouverture channel!");
          console.error(err);
        })

    })
    .catch((err) => {
      console.log("Erreur!");
      console.error(err);
    });

});

module.exports = router;
