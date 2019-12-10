import {MilleGrillesCryptoHelper} from '../mgcomponents/CryptoSubtle';

const cryptoHelper = new MilleGrillesCryptoHelper();

export class UploadFichierSocketio {

  uploadFichier(socket, uploadInfo) {
    console.debug("Upload fichier avec");
    console.debug(uploadInfo);

    return new Promise((resolve, reject)=>{

      cryptoHelper.creerCipherCrypterCleSecrete()
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
          iv: infoCryptage.iv, cleSecrete: infoCryptage.cleSecrete,
        },
        reponse=>{
          console.debug("_executerUploadFichier, reponse serveur");
          console.debug(reponse);

          if(reponse.pret) {
            // Demarrer upload
            this._executerUploadFichier(socket, uploadInfo, cipher);
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

    return new Promise((resolve, reject)=> {

      function terminer() {
        console.log("Upload termine");
        socket.emit('upload.fin', {sha256: "mon sha est mort"});
        this.uploadEnCours = false;
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
              socket.emit('upload.paquet', contenuCrypte.buffer, terminer);
            }
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
          socket.emit('upload.paquet', contenuCrypte.buffer, read);

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
