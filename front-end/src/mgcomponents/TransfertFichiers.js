import {MilleGrillesCryptoHelper} from '../mgcomponents/CryptoSubtle';

const cryptoHelper = new MilleGrillesCryptoHelper();

export class UploadFichierSocketio {

  uploadFichier(socket, uploadInfo) {
    return cryptoHelper.creerCipherCrypterCleSecrete()
    .then(infoCryptage=>{

      const fichier = uploadInfo.acceptedFile;
      let nomFichier = fichier.name;
      let typeFichier = fichier.type;
      let tailleFichier = fichier.size;

      let cipher = infoCryptage.cipher;

      socket.emit('upload.nouveauFichier', {
        nomFichier, typeFichier, tailleFichier,
        iv: infoCryptage.iv, cleSecrete: infoCryptage.cleSecrete,
      });

      let reader = fichier.stream().getReader();

      function read() {
        return reader.read().then(({value, done})=>{
          if(done) {
            let contenuCrypte = cipher.final();
            if(contenuCrypte.length > 0) {
              socket.emit('upload.paquet', contenuCrypte.buffer);
            }
            return;
          }

          // console.log("Contenu original");
          // console.log(value);
          let valueString = String.fromCharCode.apply(null, new Uint8Array(value));

          let contenuCrypte = cipher.update(valueString, 'binary');

          // console.log("Contenu crypte");
          // console.log(contenuCrypte);

          // console.log("Paquet de " + value.length + " bytes");
          socket.emit('upload.paquet', contenuCrypte.buffer);

          return read();
        });
      } read(); // Demarrer boucle execution data

    })
    .catch(err=>{
      console.error("Erreur upload, on marque le fichier en erreur");
      console.debug(err);
      this.uploadEnCours = false;  // Permet d'enchainer les uploads
      // this.uploadTermine({
      //   status: 'echec',
      // })
      socket.emit('upload.annuler', {message: "Hourra!"});

      // Attendre avant de poursuivre au prochain fichier
      // this.uploadTermine({
      //   status: 'echec',
      // })
      // this.uploadRetryTimer = setTimeout(()=>{
      //   this.uploadEnCours = false;   // Reset flag pour permettre l'upload
      //   this.uploaderProchainFichier();
      // }, 10000);
      throw(err);
    })
    .finally(()=>{
      console.log("Fini!");
      socket.emit('upload.fin', {message: "Hourra!"});
      this.uploadEnCours = false;
    })
  }

}
