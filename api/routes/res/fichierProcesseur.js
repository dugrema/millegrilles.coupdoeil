const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');
const request = require('request');
const crypto = require('crypto');
const rabbitMQ = require('./rabbitMQ');
const pki = require('./pki')
const forge = require('node-forge');

class ProcesseurUpload {

  ajouterFichier(fichier, repertoire_uuid, serveurConsignation) {
    var promise = new Promise((resolve, reject)=>{
      // console.debug('Traitement fichier');
      // console.debug(fichier);

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
        // console.debug("Put complete, sending record to MQ");
        let transactionNouvelleVersion = {
          fuuid: fileUuid,
          securite: '3.protege',
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
        if(crypte) {
          // Le ficheir est crypte, on transmet la cle en premier
          // (condition blocking pour le processus de traitement du fichier)
          let transactionInformationCryptee = {
            domaine: 'millegrilles.domaines.GrosFichiers',
            fuuid: fileUuid,
            fingerprint: 'abcd',
            cle: fichier.encryptedSecretKey,
            iv: fichier.iv,
          };
          // console.debug("Document crypte, on transmet l'info au MaitreDesCles");
          // console.debug(transactionInformationCryptee);

          // Transmettre information au serveur via MQ
          rabbitMQ.singleton.transmettreTransactionFormattee(
              transactionInformationCryptee,
              'millegrilles.domaines.MaitreDesCles.nouvelleCle.grosFichier')
          .then(msg=>{
            // console.debug("Recu confirmation cle");
            // console.debug(msg);
            this._transmettreMetadata(resolve, reject, transactionNouvelleVersion);
          })
          .catch(err=>{
            console.error("Erreur message");
            console.error(err);
            reject(err);
          });
        } else {
          // Le fichier n'est pas crypte - on transmet juste le message
          // de metadata.
          this._transmettreMetadata(resolve, reject, transactionNouvelleVersion);
        }

      } catch (err) {
        console.error("Erreur preparation fichier " + fichier.originalname);
        console.error(err);
        reject(err);
      } finally {
        // Supprimer fichier temporaire dans staging
        // Note: Le fichier n'est plus cree, on stream via PUT directement.
        // fs.unlink(fichier.path, msg => {
          // console.debug("Unlink fichier complete " + fichier.path);
          // if(msg) console.debug(msg);
        // });
      }

    });

    return promise;
  } // ajouterFichier

  _transmettreMetadata(resolve, reject, transactionNouvelleVersion) {
    return rabbitMQ.singleton.transmettreTransactionFormattee(
      transactionNouvelleVersion,
      'millegrilles.domaines.GrosFichiers.nouvelleVersion.metadata')
    .then( msg => {
      /// console.debug("Recu confirmation de nouvelleVersion metadata");
      // console.debug(msg);
      resolve();
    })
    .catch( err => {
      console.error("Erreur message");
      console.error(err);
      reject(err);
    });

  }

}

class ProcesseurDownloadCrypte {

  constructor(props) {
    this.key = null;

    this._charger_key(key=>{
      this.key = key;
    })
  }

  getDecipherPipe4fuuid(fuuid) {
    // On doit commencer par demander une cle pour decrypte le fichier
    // Ensuite on prepare un decipher pipe pour decrypter le contenu.

    let routing = 'requete.millegrilles.domaines.MaitreDesCles.decryptageGrosFichier';
    let requete = {
      fuuid: fuuid
    }

    return rabbitMQ.singleton.transmettreRequete(routing, requete)
    .then(reponse=>{
      console.debug("Recu message pour decrypter fuuid: " + fuuid);
      let messageContent = decodeURIComponent(escape(reponse.content));
      let json_message = JSON.parse(messageContent);
      let cleSecrete = Buffer.from(json_message.cle);
      let iv = json_message.iv;

      // Decrypter la cle secrete avec notre cle privee
      var decryptedSecretKey = privateKey.decrypt(cleSecrete, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create()
        }
      });

      // Creer un decipher stream
      var decipher = crypto.createDecipheriv('aes256', decryptedSecretKey, iv);
      return decipher;
    })
  }

  _charger_key(cb) {
    console.debug("Chargement cle privee pour traitement fichiers encryptes")
    var mq_key = process.env.PRIVKEY;
    if(mq_key !== undefined) {
      fs.readFile(mq_key, (err, data)=>{
        var key = forge.pki.privateKeyFromPem(data);
        console.debug("Cle privee chargee")
        cb(key);
      });
    }
  }

}

module.exports = {
  ProcesseurUpload: ProcesseurUpload,
  ProcesseurDownloadCrypte: ProcesseurDownloadCrypte,
}
