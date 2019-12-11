const crypto = require('crypto');
const forge = require('node-forge');
const x509 = require('x509');
const stringify = require('json-stable-stringify');
const fs = require('fs');

class PKIUtils {
  // Classe qui supporte des operations avec certificats et cles privees.

  constructor() {
    let mq_cacert = process.env.MG_MQ_CAFILE,
        mq_cert = process.env.MG_MQ_CERTFILE,
        mq_key = process.env.MG_MQ_KEYFILE;

    this.cacertFile = mq_cacert;
    this.certFile = mq_cert;
    this.keyFile = mq_key;

    this.cle = null;
    this.cert = null;
    this.ca = null;

    this.algorithm = 'aes256';
    this.rsaAlgorithm = 'RSA-OAEP';

    this.chargerPEMs();
    this._verifierCertificat();
  }

  chargerPEMs() {
    console.log("PKI: Chargement cle " + this.keyFile + " et cert " + this.certFile);
    this.cle = fs.readFileSync(this.keyFile);
    this.ca = fs.readFileSync(this.cacertFile);

    // Charger le certificat pour conserver commonName, fingerprint
    this.chargerCertificat();
  }

  _verifierCertificat() {
    this.getFingerprint();
  }

  chargerCertificat() {
    let parsedCert = x509.parseCert(this.certFile);
    let fingerprint = parsedCert['fingerPrint'];

    this.cert = parsedCert;

    // Pour correspondre au format Python, enlever les colons (:) et
    // mettre en lowercase.
    fingerprint = fingerprint.replace(/:/g, '').toLowerCase();
    console.log("Certificat fingerprint: " + fingerprint);

    //console.log(parsedCert);
    this.commonName = parsedCert.subject.commonName;
    console.log("Certificat du noeud, sujet CN: " + this.commonName)

    this.fingerprint = fingerprint;
  }

  chargerCertificatPEM(pem) {
    let parsedCert = forge.pki.certificateFromPem(pem);
    return parsedCert;
  }

  getFingerprint() {
    return this.fingerprint;
  }

  getCommonName() {
    return this.commonName;
  }

  signerTransaction(transaction) {

    let signature = 'N/A';
    const sign = crypto.createSign('SHA512');

    // Stringify en json trie
    let transactionJson = stringify(transaction);
    // console.log("Message utilise pour signature: " + transactionJson);

    // Creer algo signature et signer
    sign.write(transactionJson);
    let parametresSignature = {
      "key": this.cle,
      "padding": crypto.constants.RSA_PKCS1_PSS_PADDING
    }
    signature = sign.sign(parametresSignature, 'base64');

    return signature;
  }

  hacherTransaction(transaction) {
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

    // Creer algo signature et signer
    hash.write(transactionJson);
    //hash.end();

    hachage_transaction = hash.digest('base64')

    return hachage_transaction;
  }

  preparerMessageCertificat() {
    // Retourne un message qui peut etre transmis a MQ avec le certificat
    // utilise par ce noeud. Sert a verifier la signature des transactions.
    let certificatBuffer = fs.readFileSync(this.certFile, 'utf8');

    let transactionCertificat = {
        evenement: 'pki.certificat',
        fingerprint: this.fingerprint,
        certificat_pem: certificatBuffer,
    }

    return transactionCertificat;
  }

  crypterContenu(certificat, contenu) {
    // Crypte un dict en JSON et retourne la valeur base64 pour
    // le contenu et la cle secrete cryptee.
    return this._creerCipherKey(certificat).then(({cipher, encryptedSecretKey, iv}) => {
      let contenuString = JSON.stringify(contenu);
      let contenuCrypte = cipher.update(contenuString, 'utf8', 'base64');
      contenuCrypte += cipher.final('base64');

      console.debug("Contenu crypte: ");
      console.debug(contenuCrypte);

      return {contenuCrypte, encryptedSecretKey, iv};
    });
  }

  _creerCipherKey(certificat) {
    let promise = new Promise((resolve, reject) => {
      this.genererKeyAndIV((err, {key, iv})=>{
        if(err) {
          reject(err);
        }

        var cipher = crypto.createCipheriv(this.algorithm, key, iv);

        // Encoder la cle secrete
        // Convertir buffer en bytes string pour node-forge
        // var keyByteString = forge.util.bytesToHex(key);
        // var encryptedSecretKey = certificat.publicKey.encrypt(keyByteString, this.rsaAlgorithm, {
        //   md: forge.md.sha256.create(),
        //   mgf1: {
        //     md: forge.md.sha256.create()
        //   }
        // });

        var encryptedSecretKey = this.crypterContenuAsymetric(certificat.publicKey, key);

        // Encoder en base64
        iv = iv.toString('base64');

        resolve({cipher, encryptedSecretKey, iv});

      });
    });

    return promise;
  }

  crypterContenuAsymetric(publicKey, contentToEncrypt) {
    var keyByteString = forge.util.bytesToHex(contentToEncrypt);
    var encryptedContent = publicKey.encrypt(keyByteString, this.rsaAlgorithm, {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });

    encryptedContent = forge.util.encode64(encryptedContent);
    return encryptedContent;
  }

  genererKeyAndIV(cb) {
    var lenBuffer = 16 + 32;
    crypto.pseudoRandomBytes(lenBuffer, (err, pseudoRandomBytes) => {
      // Creer deux buffers, iv (16 bytes) et password (24 bytes)
      var iv = pseudoRandomBytes.slice(0, 16);
      var key = pseudoRandomBytes.slice(16, pseudoRandomBytes.length);
      cb(err, {key: key, iv: iv});
    });
  }

  extraireClePublique(certificat) {
    const clePubliquePEM = forge.pki.publicKeyToPem(certificat.publicKey);
    console.debug('Cle publique maitredescles ');
    // console.debug(clePubliquePEM);

    var clePublique = clePubliquePEM
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '');
    // Remplacer les \n pour mettre la cle sur une seule ligne
    clePublique = clePublique.split('\n').join('');

    return clePublique;
  }

};

const pki = new PKIUtils();
module.exports = pki;
