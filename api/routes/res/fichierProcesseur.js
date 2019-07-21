const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const request = require('request');
const crypto = require('crypto');
const rabbitMQ = require('./rabbitMQ');

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

        console.log("allo " + crypto.createHash('sha256').update('allo').digest('hex'));
        console.log("bonsoir " + crypto.createHash('sha256').update('bonsoir').digest('hex'));
        console.log("bonnenuit " + crypto.createHash('sha256').update('bonnenuit').digest('hex'));

        // Encrypter fichiers, calculer SHA256 avant et apres
        var sha256Clear = crypto.createHash('sha256');
        // sha256Clear.setEncoding('binary');

        // Transmettre information au serveur via MQ

        // Uploader fichier vers central via PUT
        console.debug("PUT file " + fichier.path);
        fs.createReadStream(fichier.path)
        .on('data', chunk=>{
          sha256Clear.update(chunk);
          console.log("------------");
          process.stdout.write(chunk);
          console.log("------------");
        })
        .pipe(
          request.put(options, (err, httpResponse, body) => {
            if(err) throw err; // Attrapper erreur dans le catch plus bas
          })
        )
        .on('end', ()=>{
          let sha256ClearHash = sha256Clear.digest('hex');

          console.log("Put complete, sending record to MQ");
          let transactionNouvelleVersion = {
            fuuid: fileUuid,
            securite: 'prive',
            repertoire: '/',
            nom: fichier.originalname,
            taille: fichier.size,
            sha256: sha256ClearHash,
            reception: {
              methode: "coupdoeil",
              "noeud": "public1.maple.mdugre.info"
            }
          }
          console.debug("Transaction pour MQ");
          console.debug(transactionNouvelleVersion);

          resolve({transaction: transactionNouvelleVersion});

          // rabbitMQ.singleton.transmettreTransactionFormattee(
          //     transactionNouvelleVersion, 'millegrilles.domaines.GrosFichiers.nouvelleVersion')
          //   .then( msg => {
          //     console.log("Recu confirmation de transaction nouvelleVersion");
          //     console.log(msg);
          //
          //     resolve({transaction: transactionNouvelleVersion, reponse: msg});
          //   })
          //   .catch( err => {
          //     console.error("Erreur message");
          //     console.error(err);
          //     reject(err);
          //   });
        })

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
