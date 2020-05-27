// Source de depart:
// https://github.com/expressjs/multer/blob/master/StorageEngine.md
const fs = require('fs')
const { PassThrough } = require('stream')
const pathModule = require('path');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const forge = require('node-forge');
const request = require('request');
// const pki = require('./pki')
// const rabbitMQ = require('./rabbitMQ');

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

class MulterCryptoStorage {

  constructor (opts) {
    this.stagingFolder = opts.stagingFolder || "/tmp/coupdoeilStaging";
    this.hashOpts = opts.hashOpts || {};
    this.cryptoOpts = opts.cryptoOpts || {};
  }

  getDestination (req, file, cb) {
    // Creer le uuid de fichier, pour cette version.
    let fileUuid = uuidv1();
    var filePath = pathModule.join(this.stagingFolder, fileUuid)
    cb(null, filePath, fileUuid);
  }

  _handleFile (req, file, cb) {

    var pipes = file.stream;
    var securite = req.body.securite;
    // console.log("Securite fichier: " + securite);
    var crypte = securite === '3.protege' || securite === '4.secure';

    if(crypte) {
      throw new Error("Fichier chiffre non supporte - utiliser transfert via websockets");
    }

    var params = {
      req: req,
      crypte: crypte,
      file: file,
    };

    // Pas de cryptage requis, on passe tout de suite a l'upload.
    const promiseStream = new Promise((resolve, reject) => {
      resolve({pipes: pipes, params: params});
    })

    this._traiterFichier(req, pipes, params, cb);
  }

  _removeFile (req, file, cb) {
    // Note: Le fichier ne devrait meme pas etre cree, PUT au serveur directement.
    // fs.unlink(file.path, cb)
  }

  _traiterFichier(req, pipes, params, cb) {
    params.fileUuid = uuidv1();
    // console.debug("_Traiter fichier " + params.fileUuid);
    // console.debug(params);

    const {rabbitMQ} = req.authentification;
    const pki = rabbitMQ.pki;

    // Pipe caclul du hash (on hash le contenu crypte quand c'est applicable)
    const hashPipe = new HashPipe({});
    pipes = pipes.pipe(hashPipe);

    // Finaliser avec l'outputstream
    // Transmettre directement au serveur grosfichier pour consignation.
    let pathServeur = serveurConsignation + '/' +
      pathModule.join('grosfichiers', 'local', 'nouveauFichier', params.fileUuid);
    let crypte = (params.encryptedSecretKey)?true:false;

    if(crypte) {
      throw new Error("Transfert de fichier chiffre non supporte");
    }

    let options = {
      url: pathServeur,
      headers: {
        fileuuid: params.fileUuid,
        encrypte: params.crypte,
        nomfichier: file.originalname,
        mimetype: file.mimetype,
      },
      agentOptions: {
        ca: pki.ca,
      },  // Utilisation certificats SSL internes
      ca: pki.ca,
      key: pki.cle,
      cert: pki.certPEM,
    };
    const outStream = request.put(options, (err, httpResponse, body) =>{
      var hashResult = hashPipe.getHash();
      // console.debug("Hash calcule: " + hashResult);

      var file = params.file;
      cb(err, {
        size: hashPipe.fileSize,
        nomfichier: file.originalname,
        mimetype: file.mimetype,
        fileuuid: params.fileUuid,
        hash: hashResult,
      });

    });
    outStream.on('error', cb);

    // Connecter output.
    pipes = pipes.pipe(outStream);

  }

}

module.exports = {MulterCryptoStorage}
