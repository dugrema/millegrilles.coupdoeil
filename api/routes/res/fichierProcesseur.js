const fs = require('fs');
const uuidv4 = require('uuid/v4');

class ProcesseurUpload {

  ajouterFichier(fichier) {
    var promise = new Promise((resolve, reject)=>{
      console.debug('Traitement fichier');
      console.debug(fichier);

      // Creer le uuid de fichier, pour cette version.
      let fuuide = uuidv4();

      let params = {
        nomFichier: fichier.originalname,
        mimetype: fichier.mimetype,
        taille: fichier.size,
        fuuide: fuuide,
      };

      try {
        // Encrypter fichiers

        // Transmettre information au serveur via MQ

        // Uploader fichier vers central via PUT

        resolve(params);

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
