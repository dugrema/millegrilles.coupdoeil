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

      cryptoHelper.creerCipherCrypterCleSecrete(clePubliqueMaitredescles)
      .then(infoCryptage=>{

        const fichier = uploadInfo.acceptedFile;
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
            this._executerUploadFichier(socket, uploadInfo, cipher)
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

  _executerUploadFichier(socket, uploadInfo, cipher) {

    const fichier = uploadInfo.acceptedFile;
    let reader = fichier.stream().getReader();

    const sha256Calc = crypto.createHash('sha256');

    return new Promise((resolve, reject)=> {

      function terminer() {
        var hashResult = sha256Calc.digest('hex');
        console.log("Upload termine, sha256: " + hashResult);
        socket.emit('upload.fin', {sha256: hashResult});
        resolve();
      };

      function read() {
        console.debug("Read invoque");
        //return
        reader.read().then(({value, done})=>{
          if(done) {
            console.debug("Dernier paquet");
            let contenuCrypte = cipher.final();
            if(contenuCrypte.length > 0) {
              socket.emit('upload.paquet', contenuCrypte.buffer);
              sha256Calc.update(contenuCrypte);
            }
            terminer();
            return;
          }

          // console.debug("Paquet");
          // console.log("Contenu original");
          // console.log(value);
          let valueString = String.fromCharCode.apply(null, new Uint8Array(value));

          let contenuCrypte = cipher.update(valueString, 'binary');

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
