import {MilleGrillesCryptoHelper} from '../mgcomponents/CryptoSubtle';

const crypto = require('crypto');
const cryptoHelper = new MilleGrillesCryptoHelper();

export class UploadFichierSocketio {

  uploadFichier(socket, uploadInfo) {
    // console.debug("Upload fichier avec");
    // console.debug(uploadInfo);

    // Verifier s'il faut chiffrer le telechargement
    // Si les donnes sont publiques ou privees on ne chiffre pas
    const chiffrer = uploadInfo.securite !== '1.public' && uploadInfo.securite !== '2.prive';

    const clePubliqueMaitredescles = sessionStorage.clePubliqueMaitredescles;
    if(!clePubliqueMaitredescles) {
      throw new Error("Cle publique du maitre des cles n'est pas disponible, on ne peut pas crypter le fichier.");
    }

    return new Promise((resolve, reject)=>{

      const fichier = uploadInfo.acceptedFile;
      var promise;
      if(fichier.stream) {
        if(chiffrer) {
          // console.debug("On peut streamer le fichier, on prend crypto");
          promise = cryptoHelper.creerCipherCrypterCleSecrete(clePubliqueMaitredescles);
        } else {
          // On ne chiffre pas, rien a faire
          console.debug("Chargement fichier avec streaming, sans chiffrage");
          promise = Promise.resolve({});
        }
      } else {
        // On doit preparer un buffer du fichier en memoire
        if(chiffrer) {
          // console.debug("On ne peut pas streamer le fichier, on prend subtle");
          promise = cryptoHelper.crypterFichier(clePubliqueMaitredescles, fichier);
        } else {
          console.debug("Chargement fichier sans streaming, ni chiffrage");
          // Charger le fichier
          var reader = new FileReader();
          promise = new Promise((resolve, reject)=>{
            reader.onload = () => {
              var buffer = reader.result;
              console.debug("Ficher charge dans buffer, taille " + buffer.byteLength);
              resolve({buffer});
            }
            reader.onerror = err => {
              reject(err);
            }
            reader.readAsArrayBuffer(fichier);
          });
        }
      }

      return promise.then(infoCryptage=>{

        // console.debug("InfoCryptage fichier");
        // console.debug(infoCryptage);

        let nomFichier = fichier.name;
        let typeFichier = fichier.type;
        let tailleFichier = fichier.size;
        let fuuid = uploadInfo.fuuid;
        let securite = uploadInfo.securite;

        // let cipher = infoCryptage.cipher;
        const transaction = {
          nomFichier, typeFichier, tailleFichier, fuuid, securite,
        }
        if(chiffrer) {
          transaction.iv = infoCryptage.iv;
          transaction.cleSecreteCryptee = infoCryptage.cleSecreteCryptee;
        }
        if(uploadInfo.documentuuid) {
          transaction.documentuuid = uploadInfo.documentuuid;
        }

        // console.debug("Debut");
        // console.debug(transaction);
        return new Promise((resolve, reject) => {

          setTimeout(()=>{
            console.debug("Uploader avec delai de reconnexion");
            socket.emit('upload.nouveauFichier', transaction, reponse=>{
              if(reponse.pret) {
                resolve({infoCryptage});
              } else {
                reject(reponse.erreur);
              }
            });
          }, 2000);

          // Tenter de transmettre upload
          // socket.emit('upload.nouveauFichier', transaction, reponse=>{
          //   // console.debug("_executerUploadFichier, reponse serveur");
          //   // console.debug(reponse);
          //
          //   if(reponse.pret) {
          //     resolve({infoCryptage});
          //   } else {
          //     reject(reponse.erreur);
          //   }
          // });
        })
      })
      .then(({infoCryptage})=>{
        // Demarrer upload
        return this._executerUploadFichier(socket, uploadInfo, infoCryptage)
      })
      .then(()=>{
        // console.debug("Fin _executerUploadFichier");
        resolve();
      })
      .catch(err=>{
        console.error("Erreur _executerUploadFichier");
        reject(err);
      });

    });

  }

  // Execute l'upload.
  _executerUploadFichier(socket, uploadInfo, infoCryptage) {

    const fichier = uploadInfo.acceptedFile;

    // L'upload a 2 modes d'operation: si le .stream() est disponible, on
    // executer la lecture du fichier par blocks et on l'encrypte avec un cipher.
    // Pour les appareils mobiles, .stream() n'est pas disponible sur acceptedFile -
    // le bufferCrypte est prepare a l'avance via subtle et il ne reste qu'a le transmettre.
    const cipher = infoCryptage.cipher; // Peut etre null
    let reader;
    if(infoCryptage.bufferCrypte) {
      reader = new BufferReader(infoCryptage.bufferCrypte);
    } else if(infoCryptage.stream) {
      // Le fichier a ete charge en memoire - aucun chiffrage
      reader = new BufferReader(infoCryptage.stream);
    } else {
      // On fonctionne avec le mode streaming
      reader = fichier.stream().getReader();
    }

    const sha256Calc = crypto.createHash('sha256');

    return new Promise((resolve, reject)=> {

      var compteurPaquets = 0;
      const batchSize = 15;

      function terminer() {
        var hashResult = sha256Calc.digest('hex');
        // console.log("Upload termine, sha256: " + hashResult);
        socket.emit('upload.fin', {sha256: hashResult, fuuid: uploadInfo.fuuid});
        resolve();
      };

      function read() {
        // console.debug("Read invoque");

        compteurPaquets++;
        if( compteurPaquets % batchSize === 0 ) {

          // console.debug("Paquet sync " + compteurPaquets);
          socket.binary(true).emit('upload.sync', {}, read);
          // setTimeout(read, 4000);
        } else {

          reader.read().then(({value, done})=>{
            if(done) {
              // console.debug("Dernier paquet");
              let contenuCrypte = value;
              if(cipher) { // Crypter le contenu
                contenuCrypte = cipher.final();
              }
              if(contenuCrypte && contenuCrypte.length > 0) {
                socket.emit('upload.paquet', contenuCrypte.buffer);
                sha256Calc.update(contenuCrypte);
              }
              terminer();
              return;
            }

            // console.debug("Paquet " + contenuCrypte.length);
            // console.log("Contenu original");
            // console.log(value);

            let contenuCrypte;
            if(cipher) { // Crypter le contenu
              let valueString = String.fromCharCode.apply(null, new Uint8Array(value));
              contenuCrypte = cipher.update(valueString, 'binary');
            } else { // Contenu deja crypte ou non crypte
              contenuCrypte = new Uint8Array(value); //{buffer: value};
            }

            // console.log("Contenu crypte");
            // console.debug("Paquet " + contenuCrypte.length);

            // console.log("Paquet de " + value.length + " bytes");
            sha256Calc.update(contenuCrypte);

            // Emettre paquet sans attendre le callback
            // console.debug("Paquet " + compteurPaquets + " taille " + contenuCrypte.length);
            socket.binary(true).emit('upload.paquet', contenuCrypte.buffer);
            read();
          })
        };
      }

      // console.debug("Demarrer lecture fichier a uploader");
      read();
    });

  }

}

// Simule un streamReader pour les besoins du transfert
class BufferReader {

  constructor(buffer) {
    this.buffer = new Uint8Array(buffer);
    this.position = 0;
    this.blockSize = 64 * 1024;

    if(!buffer.byteLength) {
      throw new Error("Buffer n'a pas de taille ou invalide");
    }
  }

  read() {
    // Changer la position avant l'execution de la Promise
    const tailleFichier = this.buffer.byteLength;
    const position = this.position;
    this.position += this.blockSize;
    const positionFin = this.position;
    // console.debug("Lecture block " + position + " a " + positionFin + " (taille " + tailleFichier + ")");

    return new Promise((resolve, reject) => {
      // console.debug("Lecture position " + position);

      if(position < tailleFichier) {
        let buffer = this.buffer.slice(position, positionFin);
        // console.debug("Sliced buffer");
        // console.debug(buffer);
        let termine = positionFin >= tailleFichier;

        // console.debug("Termine? " + termine);
        // buffer = new Uint8Array(buffer);
        resolve({value: buffer, done: termine});
      } else {
        reject(new Error("BufferReader deja ferme."));
      }

    });
  }

}
