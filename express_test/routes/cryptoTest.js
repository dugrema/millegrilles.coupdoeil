const express = require('express');
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
var forge = require('node-forge');
const { PassThrough } = require('stream')

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

      _genererKeyAndIV((err, {key, iv})=>{
        if(err) {
          console.error(err);
          res.sensStatus(500);
        }
        // var encryptedSecretKey = crypto.publicEncrypt(publicKey, messageSecret);
        // var encryptedSecretKey = crypto.publicEncrypt(key, messageSecret);
        // console.log("Type objet crypto: " + encryptedSecretKey.constructor.name);
        // encryptedSecretKey = encryptedSecretKey.toString('base64');
        console.log("Bytes cle secrete: ");
        console.log(key);
        var keyBuffer = forge.util.bytesToHex(key);

        // Node Forge
        var rsa = forge.pki.rsa;
        var cert = forge.pki.certificateFromPem(publicKey);
        var encryptedSecretKey2 = cert.publicKey.encrypt(keyBuffer, 'RSA-OAEP', {
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
        // '<p>Secret crypte: '+encryptedSecretKey+'</p>'+
        '<p>Secret2 crypte: '+encryptedSecretKey2+'</p>'+
        '<br/>' +
        '</body></html>';

        res.send(affichage);
      });
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

      const encryptedSecretKey = Buffer.from('YmAzq6pG/vtd6sJkyNi69H9sYJte71lBR3asubu7MjiFT8N8zJQfNpoMgVUBZ3C9C5MIrLhyzl4hQV9yvSdnM7nT67ZxCRfz9XKYtz5eIsYeqwDbqWHD3GTc5mrkdwn4ZtgMu0glOxL1zgjGn+MMYlG9h6WicUviT7KpZPRi8ywN1ZgWnZvO844SOHExtOxUdmF/homCMUDx8lPdhx3Ykqv+vAHmPcwcEC9nT6vdtZQXsz7hrckPI5UjMXv5ZNiHh7LwupFrOBAaBkU14RQkhSHaDo+EDD1nX2WCcEVv2KFdpCXi6JzQaGP+i5wwwDOiw1auglO0HNinCimtFggMIA==', 'base64');
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

router.get('/symetricEncrypt', function(req, res, next) {

  var mq_cert = '/opt/millegrilles/dev2/pki/certs/dev2_middleware.cert.pem';
  if(mq_cert !== undefined) {
    fs.readFile(mq_cert, (err, publicKey) =>{
      if(err) {
        console.error("Erreur");
        console.error(err);
        res.sendStatus(500);
      }

      console.log(publicKey);

      _genererKeyAndIV((err, {key, iv})=>{
        if(err) reject(err);
        // console.debug("IV");
        // console.debug(iv);
        var cipher = crypto.createCipheriv('aes256', key, iv);

        // Encoder la cle secrete
        // var encryptedSecretKey = crypto.publicEncrypt(publicKey, key);
        // encryptedSecretKey = encryptedSecretKey.toString('base64');
        // console.log("Cle secrete cryptee, len:" + encryptedSecretKey.length);
        // console.log(encryptedSecretKey);

        // resolve({
        //   cipher: cipher,
        //   encryptedSecretKey: encryptedSecretKey,
        //   iv: iv.toString('base64'),
        // });

        // Lire un fichier texte
        var buf = Buffer.alloc(0);
        // var readStream = fs.createReadStream('/opt/millegrilles/etc/dev2.conf');
        var readStream = fs.createReadStream('/home/mathieu/dev2.tar.gz');
        var pipe = readStream.pipe(cipher);
        var longueur = 0;
        readStream.on('data', chunk=>{
          longueur += chunk.length;
        });

        var passThrough = new PassThrough();
        pipe = pipe.pipe(passThrough);

        passThrough.on('data', chunk=>{
          buf = Buffer.concat([buf, chunk]);
        });
        passThrough.on('end', ()=>{

          console.log("Input size: " + longueur);
          console.log("Encrypted buf size: " + buf.length);
          var encryptedMessage = buf.toString('base64');

          var affichage =
          '<html><body>' +
          '<p>Key: ' + key.toString('base64') + '</p>'+
          '<p>IV: ' + iv.toString('base64') + '</p>'+
          '<p>Message crypte: ' + encryptedMessage + '</p>'+
          '<br/>' +
          '</body></html>';

          res.send(affichage);

        })

      });


    });

  }

});

function _genererKeyAndIV(cb) {
  var lenBuffer = 16 + 32;
  crypto.pseudoRandomBytes(lenBuffer, (err, pseudoRandomBytes) => {
    // Creer deux buffers, iv (16 bytes) et password (24 bytes)
    var iv = pseudoRandomBytes.slice(0, 16);
    var key = pseudoRandomBytes.slice(16, pseudoRandomBytes.length);
    cb(err, {key: key, iv: iv});
  });
}

module.exports = router;
