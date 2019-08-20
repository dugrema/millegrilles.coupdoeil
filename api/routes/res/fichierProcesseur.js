const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const request = require('request');
const crypto = require('crypto');
const rabbitMQ = require('./rabbitMQ');
const pki = require('./pki')

class ProcesseurUpload {

  ajouterFichier(fichier, repertoire_uuid, serveurConsignation) {
    var promise = new Promise((resolve, reject)=>{
      console.debug('Traitement fichier');
      console.debug(fichier);

      // Creer le uuid de fichier, pour cette version.
      let fileUuid = fichier.fileuuid;
      let pathServeur = serveurConsignation + '/' + path.join('grosfichiers', 'local', 'nouveauFichier', fileUuid);
      // let fuuide = this.formatterPath(fileUuid, 'dat');
      let crypte = (fichier.encryptedSecretKey)?true:false;

      let options = {
        url: pathServeur,
        headers: {
          fileuuid: fileUuid,
          encrypte: crypte,
        },
        agentOptions: {ca: pki.ca},  // Utilisation certificats SSL internes
      };

      try {

        // Encrypter fichiers, calculer SHA256 avant et apres
        // var sha256Clear = crypto.createHash('sha256');

        // Uploader fichier vers central via PUT
        console.debug("PUT file " + fichier.path);
        fs.createReadStream(fichier.path)
        .pipe(
          request.put(options, (err, httpResponse, body) => {
            if(err) throw err; // Attrapper erreur dans le catch plus bas

            // console.debug("Put complete, sending record to MQ");
            let transactionNouvelleVersion = {
              fuuid: fileUuid,
              securite: '2.prive',
              repertoire_uuid: repertoire_uuid,
              nom: fichier.originalname,
              taille: fichier.size,
              mimetype: fichier.mimetype,
              sha256: fichier.hash,
              reception: {
                methode: "coupdoeil",
                "noeud": "public1.maple.mdugre.info"
              }
            }

            // console.debug("Transaction pour MQ");
            // console.debug(transactionNouvelleVersion);

            // Transmettre information au serveur via MQ
            rabbitMQ.singleton.transmettreTransactionFormattee(
              transactionNouvelleVersion,
              'millegrilles.domaines.GrosFichiers.nouvelleVersion.metadata')
            .then( msg => {
              console.debug("Recu confirmation de nouvelleVersion metadata");
              console.debug(msg);
            })
            .then(()=>{
              if(crypte) {
                let transactionInformationCryptee = {
                  domaine: 'millegrilles.domaines.GrosFichiers',
                  fuuid: fileUuid,
                  fingerprint: 'abcd',
                  cle: fichier.encryptedSecretKey,
                  iv: fichier.iv,
                };
                console.debug("Document crypte, on transmettre info au MaitreDesCles");
                console.debug(transactionInformationCryptee);

                // Transmettre information au serveur via MQ
                rabbitMQ.singleton.transmettreTransactionFormattee(
                  transactionInformationCryptee,
                  'millegrilles.domaines.MaitreDesCles.nouvelleCle')
                .then( msg => {
                  console.debug("Recu confirmation de nouvelleCle");
                  console.debug(msg);
                })
                .catch( err => {
                  console.error("Erreur message");
                  console.error(err);
                });
              } else {
                resolve();
              }
            })
            .catch( err => {
              console.error("Erreur message");
              console.error(err);
            });

          })
        )

      } catch (err) {
        console.error("Erreur preparation fichier " + fichier.originalname);
        console.error(err);
        reject(err);
      } finally {
        // Supprimer fichier temporaire dans staging
        fs.unlink(fichier.path, msg => {
          console.debug("Unlink fichier complete " + fichier.path);
          // if(msg) console.debug(msg);
        });
      }

    });

    return promise;
  } // ajouterFichier

}

const processeur = new ProcesseurUpload();
module.exports = processeur;
