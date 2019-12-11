import {MilleGrillesCryptoHelper} from '../mgcomponents/CryptoSubtle';

const crypto = require('crypto');
const cryptoHelper = new MilleGrillesCryptoHelper();

export class UploadFichierSocketio {

  uploadFichier(socket, uploadInfo) {
    console.debug("Upload fichier avec");
    console.debug(uploadInfo);

    const clePubliqueMaitredescles = sessionStorage.clePubliqueMaitredescles;
    if(!clePubliqueMaitredescles) {
      throw new Error("Cle publique du maitre des cles n'est pas disponible, on ne peut pas crypter le fichier.");
    }

    return new Promise((resolve, reject)=>{

      const fichier = uploadInfo.acceptedFile;
      var promise;
      if(fichier.stream) {
        console.debug("On peut streamer le fichier, on prend crypto");
        promise = cryptoHelper.creerCipherCrypterCleSecrete(clePubliqueMaitredescles);
      } else {
        console.debug("On ne peut pas streamer le fichier, on prend subtle");
        promise = cryptoHelper.crypterFichier(clePubliqueMaitredescles, fichier);
      }

      promise.then(infoCryptage=>{

        let nomFichier = fichier.name;
        let typeFichier = fichier.type;
        let tailleFichier = fichier.size;
        let fuuid = uploadInfo.fuuid;
        let securite = uploadInfo.securite;

        let cipher = infoCryptage.cipher;

        console.debug("Debut");
        socket.emit('upload.nouveauFichier', {
          nomFichier, typeFichier, tailleFichier, fuuid, securite,
          iv: infoCryptage.iv,
          cleSecreteCryptee: infoCryptage.cleSecreteCryptee,
        },
        reponse=>{
          console.debug("_executerUploadFichier, reponse serveur");
          console.debug(reponse);

          if(reponse.pret) {
            // Demarrer upload
            this._executerUploadFichier(socket, uploadInfo, infoCryptage)
            .then(()=>{
              console.debug("Fin _executerUploadFichier");
              resolve();
            })
            .catch(err=>{
              console.error("Erreur _executerUploadFichier");
              reject(err);
            });
          } else {
            throw(reponse.erreur);
          }
        });
      })
      .catch(err=>{
        reject(err); // Passer l'erreur
      })

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
    } else {
      reader = fichier.stream().getReader();
    }

    const sha256Calc = crypto.createHash('sha256');

    return new Promise((resolve, reject)=> {

      function terminer() {
        var hashResult = sha256Calc.digest('hex');
        console.log("Upload termine, sha256: " + hashResult);
        socket.emit('upload.fin', {sha256: hashResult});
        resolve();
      };

      function read() {
        // console.debug("Read invoque");

        reader.read().then(({value, done})=>{
          if(done) {
            console.debug("Dernier paquet");
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

          // console.debug("Paquet");
          // console.log("Contenu original");
          // console.log(value);

          let contenuCrypte;
          if(cipher) { // Crypter le contenu
            let valueString = String.fromCharCode.apply(null, new Uint8Array(value));
            contenuCrypte = cipher.update(valueString, 'binary');
          } else { // Contenu deja crypte
            contenuCrypte = new Uint8Array(value); //{buffer: value};
          }

          // console.log("Contenu crypte");
          // console.log(contenuCrypte);

          // console.log("Paquet de " + value.length + " bytes");
          socket.emit('upload.paquet', contenuCrypte.buffer);
          sha256Calc.update(contenuCrypte);

          read();
          // return read();
        });
      }

      read();
    });

    // // Demarrer boucle execution data
    // read().catch(err=>{
    //   console.error("Erreur upload, on marque le fichier en erreur");
    //   console.debug(err);
    //   this.uploadEnCours = false;  // Permet d'enchainer les uploads
    //   socket.emit('upload.annuler', {message: "Hourra!"});
    //
    //   throw(err);
    // })
    // .finally(()=>{
    // function terminer() {
    //   console.log("Upload termine");
    //   socket.emit('upload.fin', {sha256: "mon sha est mort"});
    //   this.uploadEnCours = false;
    // })
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
