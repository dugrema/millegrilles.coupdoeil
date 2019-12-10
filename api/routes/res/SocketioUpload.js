const fs = require('fs');
const path = require('path');

// Classe qui supporte un upload par stream a partir d'un navigateur
// via socket.io. Genere transactions nouvelleCle et metadata pour GrosFichiers.
class SocketIoUpload {

  constructor(socket) {
    this.socket = socket;
    this.streamWriter = null;

    this.infoFichier = null;
  }

  enregistrer(socket) {
    socket.on('upload.nouveauFichier', this.nouveauFichier.bind(this));
    socket.on('upload.paquet', this.paquet.bind(this));
    socket.on('upload.fin', this.fin.bind(this));
    socket.on('upload.annuler', this.annulerTransfert.bind(this));
    socket.on('disconnect', this.annulerTransfert.bind(this));
  }

  nouveauFichier(infoFichier, callback) {
    console.debug("Demande de preparation d'upload de nouveau fichier");
    console.debug(msg);
    this.infoFichier = infoFichier;

    // Ouvrir un streamWriter avec consignation.grosfichiers
    this.streamWriter = null;

    // Transmettre les transactions metadata et cles
    this.transmettreTransactionMetadata(infoFichier)
    .then(()=>{
      return this.transmettreInformationCle(infoFichier);
    })
    .then(()=>{
      callback({pret: true});
    })
    .catch(err=>{
      console.error("Erreur transmission metadata, on annule le transfert");

      // Annuler transfert
      callback({pret: false, erreur: err});

      annulerTransfert();
    });

  }

  paquet(msg) {
    console.debug("Paquet " + msg.length);
    this.streamWriter.write(msg);
  }

  fin(msg) {
    console.debug("Fin");
    console.debug(msg);
    this.streamWriter.close();

    // Cleanup
    this.streamWriter = null;
    this.infoFichier = null;
  }

  annulerTransfert() {
    if(this.streamWriter) {
      try {
        this.streamWriter.destroy(err);
      } catch (err2) {
        console.warn("Erreur destroy");
        console.warn(err2);
      }
    }

    this.infoFichier = null;
    this.streamWriter = null;

    socket.emit('upload.annule');
  }

  transmettreTransactionMetadata(infoFichier) {
    // let transactionNouvelleVersion = {
    //   fuuid: fileUuid,
    //   securite: securite,
    //   nom: fichier.originalname,
    //   taille: fichier.size,
    //   mimetype: fichier.mimetype,
    //   sha256: fichier.hash,
    //   reception: {
    //     methode: "coupdoeil",
    //     "noeud": "public1.maple.mdugre.info"
    //   }
    // }
    // if(documentuuid) {
    //   transactionNouvelleVersion.documentuuid = documentuuid;
    // }
  }

  transmettreInformationCle(infoFichier) {
    // let transactionInformationCryptee = {
    //   domaine: 'millegrilles.domaines.GrosFichiers',
    //   'identificateurs_document': {
    //     fuuid: fileUuid,
    //   },
    //   fingerprint: 'abcd',
    //   cle: fichier.encryptedSecretKey,
    //   iv: fichier.iv,
    // };
  }

}

const ioUpload = new IoUpload();
module.exports = ioUpload;
