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

router.get('/asymetricDecrypt', function(req, res, next) {

  var mq_key = '/opt/millegrilles/dev2/pki/keys/dev2_middleware.key.pem';
  if(mq_key !== undefined) {
    fs.readFile(mq_key, (err, privateKey) =>{
      if(err) {
        console.error("Erreur");
        console.error(err);
        res.sendStatus(500);
      }

      console.log(privateKey);

      const encryptedSecretKey = Buffer.from('v2oS1YZsX7+aCWfzf0DQtsmlSDrR/YuuFIUxiuwJIz6kXGHI8S9OBs0w1dw/oJvcHDWlcNcNDIENs9mtaSRnNgQQgD+x12dFHxsGL8kWiW0QNGugFVMf9J/8fcfkVXUibbsKK/QwkEfdiBO+rN4yX1aXWqm35V0hL9FEDVUlb/JDJ+2l9sNvutw+1D5paFWOI+fYEzKae/29gW2O4QILw0wvF7deZc6LjU4LoG4kXkNlDGL+RwPK17OuXU6zrRf5ZBKE+CiUFvpRUqttCv7kC3shvQ6JSVI8c4J5hgSNWL6fpx9WJFaPEu+ItK5TF6GIZ/x4Tjxbwf1lP1Wah/bFRg==', 'base64');
      // encryptedSecretKey = forge.util.decode64(encryptedSecretKey);

      // Node Forge
      var rsa = forge.pki.rsa;
      var privateKey = forge.pki.privateKeyFromPem(privateKey);
      var decryptedSecretKey = privateKey.decrypt(encryptedSecretKey, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create()
        }
      });
      console.log(decryptedSecretKey);

      var affichage =
      '<html><body>' +
      '<p>Secret: '+decryptedSecretKey+'</p>'+
      '<br/>' +
      '</body></html>';

      res.send(affichage);
    });

  }

});

module.exports = router;
