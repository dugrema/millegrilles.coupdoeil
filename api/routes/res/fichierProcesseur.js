const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const request = require('request');
// const {uuidToDate} = require('./UUIDUtils')

class ProcesseurUpload {

  ajouterFichier(fichier, serveurConsignation) {
    var promise = new Promise((resolve, reject)=>{
      console.debug('Traitement fichier');
      console.debug(fichier);

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
        fs.createReadStream(fichier.path).pipe(request.put(options, (err, httpResponse, body) => {
          console.log("Put complete");
          console.log(err);
          console.log(body);
        }));

        resolve(options);

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

  // formatterPath(fileUuid, extension) {
  //   // Extrait la date du fileUuid, formatte le path en fonction de cette date.
  //   let timestamp = uuidToDate.extract(fileUuid);
  //   // console.debug("Timestamp " + timestamp);
  //
  //   let year = timestamp.getUTCFullYear();
  //   let month = timestamp.getUTCMonth() + 1; if(month < 10) month = '0'+month;
  //   let day = timestamp.getUTCDate(); if(day < 10) day = '0'+day;
  //   let hour = timestamp.getUTCHours(); if(hour < 10) hour = '0'+hour;
  //   let minute = timestamp.getUTCMinutes(); if(minute < 10) day = '0'+minute;
  //   let fuuide =
  //     '/' + year + '/' + month + '/' + day + '/' +
  //     hour + '/' + minute + '/' +
  //     fileUuid + '.' + extension;
  //
  //   return fuuide;
  // }

}

const processeur = new ProcesseurUpload();
module.exports = processeur;
