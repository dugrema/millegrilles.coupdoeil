// Source de depart:
// https://github.com/expressjs/multer/blob/master/StorageEngine.md
var fs = require('fs')
const { PassThrough } = require('stream')
const pathModule = require('path');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');

class HashPipe extends PassThrough {
  // Classe utilisee pour calculer le hash du fichier durant la sauvegarde.

  constructor(opts) {
    super(opts);
    this.hashAlgo = opts.hashAlgo || 'sha256';
    this.sha256calc = crypto.createHash(this.hashAlgo);
    this.sha256HashResult = null;

    this.on('data', chunk=>{
      this.sha256calc.update(chunk);
    });

    this.on('end', ()=>{
      this.sha256HashResult = this.sha256calc.digest('hex');
      console.debug("SHA256: " + this.sha256HashResult)
    });
  }

  getHash() {
    return this.sha256HashResult;
  }

}

class CryptoPipe {
  
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
      console.log("File object: ");
      console.log(file);
      var pipes = file.stream;
      // Pipe caclul du hash
      var hashPipe = new HashPipe({});
      pipes = pipes.pipe(hashPipe);

      // // Verifier si on doit crypter le fichier, ajouter pipe au besoin
      // var crypte = req.security === 'secure' || req.securite === 'protege';
      // if(crypte) {
      //   const cryptopipe = this._cryptopipe();
      //   pipes = pipes.pipe(cryptopipe.getPipe());
      // }

      const outStream = fs.createWriteStream(path);
      pipes = pipes.pipe(outStream);

      outStream.on('error', cb);
      outStream.on('finish', function () {

        var sha256 = hashPipe.getHash();
        console.debug("Hash SHA256 calcule: " + sha256);

        cb(null, {
          path: path,
          size: outStream.bytesWritten,
          nomfichier: file.originalname,
          mimetype: file.mimetype,
          fileuuid: fileUuid,
          sha256: sha256,
          decryptPublicKey: null,
        });
      });
    });
  }

  _removeFile (req, file, cb) {
    fs.unlink(file.path, cb)
  }

}



// MulterCryptoStorage.prototype._hashpipe = function _hashpipe () {
//   // Encrypter fichiers, calculer SHA256 avant et apres
//   var sha256Clear = crypto.createHash('sha256');
//
//   // Uploader fichier vers central via PUT
//   console.debug("PUT file " + fichier.path);
//   fs.createReadStream(fichier.path)
//   .on('data', chunk=>{
//     // Mettre le sha256 directement dans le pipe donne le mauvais
//     // resultat. L'update (avec digest plus bas) fonctionne correctement.
//     sha256Clear.update(chunk);
//   })
//   .pipe(
//     request.put(options, (err, httpResponse, body) => {
//       if(err) throw err; // Attrapper erreur dans le catch plus bas
//
//       let sha256ClearHash = sha256Clear.digest('hex');
//
//       console.log("Put complete, sending record to MQ");
//       let transactionNouvelleVersion = {
//         fuuid: fileUuid,
//         securite: '2.prive',
//         repertoire_uuid: repertoire_uuid,
//         nom: fichier.originalname,
//         taille: fichier.size,
//         mimetype: fichier.mimetype,
//         sha256: sha256ClearHash,
//         reception: {
//           methode: "coupdoeil",
//           "noeud": "public1.maple.mdugre.info"
//         }
//       }
//     })
//   )
// }

module.exports = function (opts) {
  return new MulterCryptoStorage(opts)
}
