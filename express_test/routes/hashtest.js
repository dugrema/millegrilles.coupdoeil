const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const stringify = require('json-stable-stringify');

router.get('/', function(req, res, next) {
  console.log('hashtest/')

  let message1 = {
    'texte': 'Pas de carateres speciaux, juste du anglais.',
  }
  console.log(message1);

  let hash1 = hacherTransaction(message1);
  console.log('Hash 1: ');
  console.log(hash1);

  let message2 = {
    'texte': 'àé La cabane à sucre, cest génial.',
  }
  console.log(message2);

  let hash2 = hacherTransaction(message2);
  console.log('Hash 2: ');
  console.log(hash2);

  let output =
    '<html><body>' +
    'Message 1 JSON.stringify: ' + JSON.stringify(message1) + '<br/>' +
    'Message 1 json-stable-stringify: ' + stringify(message1) + '<br/>' +
    'Hash 1: ' + hash1 + '<br/>' +
    '<br/>' +
    'Message 2 JSON.stringify: ' + JSON.stringify(message2) + '<br/>' +
    'Message 2 json-stable-stringify: ' + stringify(message2) + '<br/>' +
    'Hash 2: ' + hash2 + '<br/>' +
    '</html></body>';

  res.send(output);
});

function hacherTransaction(transaction) {
  let hachage_transaction = 'N/A';
  const hash = crypto.createHash('sha256');

  // Copier transaction sans l'entete
  let copie_transaction = {};
  for(let elem in transaction) {
    if (elem != 'en-tete') {
      copie_transaction[elem] = transaction[elem];
    }
  }

  // Stringify en json trie
  let transactionJson = stringify(copie_transaction);
  // console.log("Message utilise pour hachage: " + transactionJson);
  let bufferTransaction = Buffer.from(transactionJson);
  console.log(bufferTransaction);

  // Creer algo signature et signer
  hash.write(bufferTransaction);
  //hash.end();

  hachage_transaction = hash.digest('base64')

  return hachage_transaction;
}

module.exports = router;
