const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const request = require('request');

class ProcesseurUpload {

  ajouterFichier(fichier, serveurConsignation) {
    var promise = new Promise((resolve, reject)=>{
      // console.debug('Traitement fichier');
      // console.debug(fichier);

      // Creer le uuid de fichier, pour cette version.
      let fileUuid = uuidv1();
      let pathServeur = serveurConsignation + '/' + path.join('grosfichiers', 'local', 'nouveauFichier', fileUuid);
      // let fuuide = this.formatterPath(fileUuid, 'dat');

      let options = {
        url: pathServeur,
        headers: {
          nomfichier: fichier.originalname,
          mimetype: fichier.mimetype,
          taille: fichier.size,
          fileuuid: fileUuid,
          encrypte: false,
        }
      };

      try {
        // Encrypter fichiers

        // Transmettre information au serveur via MQ

        // Uploader fichier vers central via PUT
        console.debug("PUT file " + fichier.path);
        fs.createReadStream(fichier.path)
        .pipe(
          request.put(options, (err, httpResponse, body) => {
            if(err) throw err; // Attrapper erreur dans le catch plus bas

            console.log("Put complete");
            // console.log(err);
            // console.log(body);
            resolve(options);
          })
        );

      } catch (err) {
        console.error("Erreur preparation fichier " + fichier.originalname);
        console.error(err);
        reject(err);
      } finally {
        // Supprimer fichier temporaire dans staging
        fs.unlinkSync(fichier.path);
      }

    });

    return promise;
  } // ajouterFichier

}

const processeur = new ProcesseurUpload();
module.exports = processeur;
