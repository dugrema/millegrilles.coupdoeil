// Source de depart:
// https://github.com/expressjs/multer/blob/master/StorageEngine.md
const fs = require('fs')
const { PassThrough } = require('stream')
const pathModule = require('path');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');

class HashPipe extends PassThrough {
  // Classe utilisee pour calculer le hash du fichier durant la sauvegarde.

  constructor(opts) {
    super(opts);
    this.hashAlgo = opts.hashAlgo || 'sha256';
    this.hashcalc = crypto.createHash(this.hashAlgo);
    this.hashResult = null;

    this.on('data', chunk=>{
      this.hashcalc.update(chunk);
    });

    this.on('end', ()=>{
      this.hashResult = this.hashcalc.digest('hex');
      console.debug("HASH (" + this.hashAlgo + "): " + this.hashResult)
    });
  }

  getHash() {
    return this.hashResult;
  }

}

class CryptoEncryptPipe {

  constructor(opts) {
    // super();
    this.algorithm = opts.algorithm || 'aes256';
  }

  createStream() {

    const promise = new Promise((resolve, reject) => {
      try {
        var keyIv = this._genererKeyAndIV((err, {key, iv})=>{
          if(err) reject(err);
          // console.debug("IV");
          // console.debug(iv);
          var cipher = crypto.createCipheriv(this.algorithm, key, iv);
          resolve({cipher: cipher, key: key, iv: iv});
        });
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  _genererKeyAndIV(cb) {

    // const password = 'Password used to generate key';
    // Key length is dependent on the algorithm. In this case for aes192, it is
    // 24 bytes (192 bits).
    // Use async `crypto.scrypt()` instead.
    // const key = crypto.scryptSync(password, 'salt', 24);
    // Use `crypto.randomBytes()` to generate a random iv instead of the static iv
    // shown here.
    var lenBuffer = 16 + 32;
    crypto.pseudoRandomBytes(lenBuffer, (err, pseudoRandomBytes) => {
      // Creer deux buffers, iv (16 bytes) et password (24 bytes)
      var iv = pseudoRandomBytes.slice(0, 16);
      var key = pseudoRandomBytes.slice(16, pseudoRandomBytes.length);
      cb(err, {key: key, iv: iv});
    });

    // crypto.pseudoRandomBytes(16, (err, ivBuffer) => {
    //     var keyBuffer = (key instanceof Buffer) ? key : new Buffer(key) ;
    //     callback({
    //         iv: ivBuffer,
    //         key: keyBuffer
    //     });
    // });

    // CIPHERS: {
    //   "AES_128": "aes128",          //requires 16 byte key
    //   "AES_128_CBC": "aes-128-cbc", //requires 16 byte key
    //   "AES_192": "aes192",          //requires 24 byte key
    //   "AES_256": "aes256"           //requires 32 byte key
    // },
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
    this.getDestination(req, file, function (err, path, fileUuid) {
      if (err) return cb(err);

      // let pathServeur = serveurConsignation + '/' + path.join('grosfichiers', 'local', 'nouveauFichier', fileUuid);
      // console.log("File object: ");
      // console.log(file);
      var pipes = file.stream;

      // Verifier si on doit crypter le fichier, ajouter pipe au besoin.
      const cryptoPipe = new CryptoEncryptPipe({});
      cryptoPipe.createStream().then(({cipher, key, iv})=>{

        console.log("Stream key, iv:");
        // console.debug(key);
        console.debug(iv);

        pipes = pipes.pipe(cipher);

        // Pipe caclul du hash (on hash le contenu crypte quand c'est applicable)
        const hashPipe = new HashPipe({});
        pipes = pipes.pipe(hashPipe);

        // Finaliser avec l'outputstream
        const outStream = fs.createWriteStream(path);
        pipes = pipes.pipe(outStream);

        outStream.on('error', cb);
        outStream.on('finish', function () {

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

          cb(null, {
            path: path,
            size: outStream.bytesWritten,
            nomfichier: file.originalname,
            mimetype: file.mimetype,
            fileuuid: fileUuid,
            hash: hashResult,
            decryptPublicKey: null,
          });
        });
      })
      .catch(err=>{
        var message = "Erreur traitement fichier " + file.originalname;
        console.error();
        console.error(err);
        cb(message);
      })

    });
  }

  _removeFile (req, file, cb) {
    fs.unlink(file.path, cb)
  }

}

module.exports = function (opts) {
  return new MulterCryptoStorage(opts)
}
