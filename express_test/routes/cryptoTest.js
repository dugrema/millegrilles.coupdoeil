const express = require('express');
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
var forge = require('node-forge');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/asymetricEncrypt', function(req, res, next) {

  var mq_cert = '/opt/millegrilles/dev2/pki/certs/dev2_middleware.cert.pem';
  if(mq_cert !== undefined) {
    fs.readFile(mq_cert, (err, publicKey) =>{
      if(err) {
        console.error("Erreur");
        console.error(err);
        res.sendStatus(500);
      }

      console.log(publicKey);

      const messageSecret = new Buffer('Mon mot de passe, cest un monde de crypto', 'utf8');
      var encryptedSecretKey = crypto.publicEncrypt(publicKey, messageSecret);
      console.log("Type objet crypto: " + encryptedSecretKey.constructor.name);
      encryptedSecretKey = encryptedSecretKey.toString('base64');

      // Node Forge
      var rsa = forge.pki.rsa;
      var cert = forge.pki.certificateFromPem(publicKey);
      var encryptedSecretKey2 = cert.publicKey.encrypt(messageSecret, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create()
        }
      });
      console.log("Bytes cle node-forge: " + encryptedSecretKey2.length);
      console.log("Type objet node-forge: " + encryptedSecretKey2.constructor.name);
      encryptedSecretKey2 = forge.util.encode64(encryptedSecretKey2);
      console.log("Cle secret node-forge (" + encryptedSecretKey2.length + ")");
      console.log(encryptedSecretKey2);

      var affichage =
      '<html><body>' +
      '<p>Secret: '+messageSecret+'</p>'+
      '<p>Secret crypte: '+encryptedSecretKey+'</p>'+
      '<p>Secret2 crypte: '+encryptedSecretKey2+'</p>'+
      '<br/>' +
      '</body></html>';

      res.send(affichage);
    });

  }

});

module.exports = router;
