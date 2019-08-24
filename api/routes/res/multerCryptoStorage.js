// Source de depart:
// https://github.com/expressjs/multer/blob/master/StorageEngine.md
const fs = require('fs')
const { PassThrough } = require('stream')
const pathModule = require('path');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const forge = require('node-forge');
const request = require('request');
const pki = require('./pki')
const rabbitMQ = require('./rabbitMQ');

const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

class HashPipe extends PassThrough {
  // Classe utilisee pour calculer le hash du fichier durant la sauvegarde.

  constructor(opts) {
    super(opts);
    this.hashAlgo = opts.hashAlgo || 'sha256';
    this.hashcalc = crypto.createHash(this.hashAlgo);
    this.hashResult = null;
    this.fileSize = 0;

    this.on('data', chunk=>{
      this.hashcalc.update(chunk);
      this.fileSize += chunk.length;
    });

    this.on('end', ()=>{
      this.hashResult = this.hashcalc.digest('hex');
      // console.debug("HASH (" + this.hashAlgo + "): " + this.hashResult)
    });
  }

  getHash() {
    return this.hashResult;
  }

}

class CryptoEncryptPipe {
  // Node-forge est utilise pour crypte la cle publique. Permet de matcher
  // l'algorithme avec Python.
  // Pour cryptage symmetrique, on utilise la librairie crypto (native a node.JS)

  constructor(certificat, opts) {
    // super();
    this.certificat = certificat;
    this.algorithm = opts.algorithm || 'aes256';
    this.rsaAlgorithm = opts.rsaAlgorithm || 'RSA-OAEP';
  }

  createStream() {
    const promise = new Promise((resolve, reject) => {
      try {
        var keyIv = this._genererKeyAndIV((err, {key, iv})=>{
          if(err) reject(err);

          var cipher = crypto.createCipheriv(this.algorithm, key, iv);

          // Encoder la cle secrete
          // Convertir buffer en bytes string pour node-forge
          var keyByteString = forge.util.bytesToHex(key);
          var encryptedSecretKey = this.certificat.publicKey.encrypt(keyByteString, this.rsaAlgorithm, {
            md: forge.md.sha256.create(),
            mgf1: {
              md: forge.md.sha256.create()
            }
          });
          encryptedSecretKey = forge.util.encode64(encryptedSecretKey);
          // console.debug("Cle secrete cryptee, len:" + encryptedSecretKey.length);
          // console.debug(encryptedSecretKey);

          resolve({
            cipher: cipher,
            encryptedSecretKey: encryptedSecretKey,
            iv: iv.toString('base64'),
          });
        });
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  _genererKeyAndIV(cb) {
    var lenBuffer = 16 + 32;
    crypto.pseudoRandomBytes(lenBuffer, (err, pseudoRandomBytes) => {
      // Creer deux buffers, iv (16 bytes) et password (24 bytes)
      var iv = pseudoRandomBytes.slice(0, 16);
      var key = pseudoRandomBytes.slice(16, pseudoRandomBytes.length);
      cb(err, {key: key, iv: iv});
    });
  }

}

class MulterCryptoStorage {

  constructor (opts) {
    this.stagingFolder = opts.stagingFolder || "/tmp/coupdoeilStaging";
    this.hashOpts = opts.hashOpts || {};
    this.cryptoOpts = opts.cryptoOpts || {};
    this.certMaitreDesCles = null;
  }

  getDestination (req, file, cb) {
    // Creer le uuid de fichier, pour cette version.
    let fileUuid = uuidv1();
    var filePath = pathModule.join(this.stagingFolder, fileUuid)
    cb(null, filePath, fileUuid);
  }

  // _charger_certificat(cb) {
  //   var mq_cert = process.env.MG_MQ_CERTFILE;
  //   if(mq_cert !== undefined) {
  //     fs.readFile(mq_cert, (err, data)=>{
  //       var cert = forge.pki.certificateFromPem(publicKey);
  //       cb(cert);
  //     });
  //   }
  // }

  _handleFile (req, file, cb) {

    var pipes = file.stream;
    var securite = req.body.securite;
    console.log("Securite fichier: " + securite);
    var crypte = securite === '3.protege' || securite === '4.secure';

    var params = {
      req: req,
      crypte: crypte,
      file: file,
    };

    let promiseStream = null;
    if(crypte) {
      // Si les fichiers doivent etre cryptes, on doit obtenir le certificat du
      // MaitreDesCles et ouvrir un pipe crypte.
      promiseStream = new Promise((resolve, reject) => {
        this.demanderCertificatMaitreDesCles()
        .then(certificatMaitreDesCles=>{
          params.certificatMaitreDesCles = certificatMaitreDesCles
          let cryptoPipe = new CryptoEncryptPipe(certificatMaitreDesCles, {});
          // console.debug("Creation crypto stream");
          return cryptoPipe.createStream();
        })
        .then(paramsCrypto=>{
          // console.debug("Ouverture CryptoPipe");
          let newPipe = pipes.pipe(paramsCrypto.cipher);
          params.iv = paramsCrypto.iv;
          params.encryptedSecretKey = paramsCrypto.encryptedSecretKey;
          resolve({pipes: newPipe, params: params});
        })
        .catch(err=>{
          console.error("Erreur traitement crypto");
          reject(err);
        })
      });
    } else {
      // Pas de cryptage requis, on passe tout de suite a l'upload.
      promiseStream = new Promise((resolve, reject) => {
        resolve({pipes: pipes, params: params});
      })
    }

    promiseStream.then(({pipes, params}) => {
      this._traiterFichier(pipes, params, cb);
    })
    .catch(err=>{
      console.error("Erreur traitement fichier / obtention cert MaitreDesCles");
      console.error(err);
    })
  }

  _removeFile (req, file, cb) {
    // Note: Le fichier ne devrait meme pas etre cree, PUT au serveur directement.
    // fs.unlink(file.path, cb)
  }

  _traiterFichier(pipes, params, cb) {
    params.fileUuid = uuidv1();
    // console.debug("_Traiter fichier " + params.fileUuid);

    // Pipe caclul du hash (on hash le contenu crypte quand c'est applicable)
    const hashPipe = new HashPipe({});
    pipes = pipes.pipe(hashPipe);

    // Finaliser avec l'outputstream
    // Transmettre directement au serveur grosfichier pour consignation.
    let pathServeur = serveurConsignation + '/' +
      pathModule.join('grosfichiers', 'local', 'nouveauFichier', params.fileUuid);
    let crypte = (params.encryptedSecretKey)?true:false;
    let options = {
      url: pathServeur,
      headers: {
        fileuuid: params.fileUuid,
        encrypte: params.crypte,
      },
      agentOptions: {ca: pki.ca},  // Utilisation certificats SSL internes
    };
    const outStream = request.put(options, (err, httpResponse, body) =>{
      console.debug("Upload PUT complete pour " + params.fileUuid);
      // Tentative de decryter fichier:
      // var decipher = crypto.createDecipheriv('aes256', key, iv);
      // var readStream = fs.createReadStream(path);
      // var writeStream = fs.createWriteStream(path + ".clear");
      // writeStream.on('finish', function() {
      //   console.log("Decryptage termine pour " + path + '.clear');
      // });
      // readStream.pipe(decipher).pipe(writeStream);

      var hashResult = hashPipe.getHash();
      // console.debug("Hash calcule: " + hashResult);

      var file = params.file;
      cb(null, {
        size: hashPipe.fileSize,
        nomfichier: file.originalname,
        mimetype: file.mimetype,
        fileuuid: params.fileUuid,
        hash: hashResult,
        encryptedSecretKey: params.encryptedSecretKey,
        iv: params.iv,
      });

    });
    outStream.on('error', cb);

    // Connecter output.
    pipes = pipes.pipe(outStream);

  }

  demanderCertificatMaitreDesCles() {
    if(this.certificatMaitreDesCles) {
      return new Promise((resolve, reject) => {
        resolve(this.certificatMaitreDesCles);
      });
    } else {
      let objet_crypto = this;
      console.debug("Demander certificat MaitreDesCles");
      var requete = {
        '_evenements': 'certMaitreDesCles'
      }
      var routingKey = 'requete.millegrilles.domaines.MaitreDesCles.certMaitreDesCles';
      return rabbitMQ.singleton.transmettreRequete(routingKey, requete)
      .then(reponse=>{
        let messageContent = decodeURIComponent(escape(reponse.content));
        let json_message = JSON.parse(messageContent);
        // console.debug("Reponse cert maitre des cles");
        // console.debug(messageContent);
        objet_crypto.certificatMaitreDesCles = forge.pki.certificateFromPem(json_message.certificat);
        return objet_crypto.certificatMaitreDesCles;
      })
    }
  }

}

module.exports = function (opts) {
  return new MulterCryptoStorage(opts)
}
