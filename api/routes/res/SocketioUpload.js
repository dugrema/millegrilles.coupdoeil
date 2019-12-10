const fs = require('fs');
const path = require('path');
const pki = require('./pki')
const request = require('request');
const { Readable } = require('stream');

const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

// Classe qui supporte un upload par stream a partir d'un navigateur
// via socket.io. Genere transactions nouvelleCle et metadata pour GrosFichiers.
class SocketIoUpload {

  constructor(rabbitMQ) {
    this.rabbitMQ = rabbitMQ;
    this.socket = null;
    this.infoFichier = null;
    this.chunkInput = null;
  }

  enregistrer(socket) {
    console.debug("Enregistrer events SocketIoUpload");
    this.socket = socket;

    this.socket.on('upload.nouveauFichier', this.nouveauFichier.bind(this));
    this.socket.on('upload.paquet', this.paquet.bind(this));
    this.socket.on('upload.fin', this.fin.bind(this));
    this.socket.on('upload.annuler', this.annulerTransfert.bind(this));
    this.socket.on('disconnect', this.annulerTransfert.bind(this));
  }

  nouveauFichier(infoFichier, callback) {
    console.debug("Demande de preparation d'upload de nouveau fichier");
    console.debug(infoFichier);
    this.infoFichier = infoFichier;
    this.chunkInput = new ChunkInput()

    // Ouvrir un streamWriter avec consignation.grosfichiers
    const crypte = infoFichier.encryptedSecretKey !== undefined;
    this.creerOutputStream(infoFichier.fuuid, crypte);

    this.transmettreInformationCle(infoFichier)
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

  paquet(chunk, callback) {
    console.debug("Paquet " + chunk.length);

    this.chunkInput.ajouterChunk(chunk)

    // Transmettre une notification de paquet sauvegarde
    // Permet de synchroniser l'upload (style ACK)
    if(callback) callback();
  }

  fin(msg) {
    console.debug("Fin");
    console.debug(msg);

    this.chunkInput.terminer()

    const sha256 = msg.sha256;

    // Transmettre les transactions metadata
    return this.transmettreTransactionMetadata(this.infoFichier, sha256)
    .then(()=>{
      console.log("Transaction fin complete");
    })
    .finally(()=>{
      // Cleanup
      this.infoFichier = null;
    });

  }

  annulerTransfert(err) {
    console.error("Annuler transfert fichier");
    if(err) {
      console.error(err);
    }

    // if(this.streamWriter) {
    //   try {
    //     this.streamWriter.destroy(err);
    //   } catch (err2) {
    //     console.warn("Erreur destroy");
    //     console.warn(err2);
    //   }
    // }

    this.infoFichier = null;
    // this.streamWriter = null;

    if(this.socket) {
      this.socket.emit('upload.annule');
    }
  }

  creerOutputStream(fileUuid, crypte, paquet) {
    let pathServeur = serveurConsignation + '/' +
      path.join('grosfichiers', 'local', 'nouveauFichier', fileUuid);
    let options = {
      url: pathServeur,
      headers: {
        fileuuid: fileUuid,
        encrypte: crypte,
      },
      agentOptions: {ca: pki.ca},  // Utilisation certificats SSL internes
    };

    new Promise((resolve, reject)=>{

      const outStream = request.put(options, (err, httpResponse, body) =>{
        console.debug("Upload PUT complete pour " + fileUuid);
        // console.debug(httpResponse);
        console.debug("Response body");
        console.debug(body);

      });
      this.chunkInput.pipe(outStream);

      outStream.on('error', reject);

      outStream.on('end', resolve);

    });

    console.debug("Oustream cree + promise");
  }

  transmettreTransactionMetadata(infoFichier, sha256) {
    let transactionNouvelleVersion = {
      fuuid: infoFichier.fuuid,
      securite: infoFichier.securite,
      nom: infoFichier.nomFichier,
      taille: infoFichier.tailleFichier,
      mimetype: infoFichier.typeFichier,
      sha256: sha256,
      reception: {
        methode: "coupdoeil.navigateur",
        "noeud": "public1.maple.mdugre.info"
      }
    }
    if(infoFichier.documentuuid) {
      transactionNouvelleVersion.documentuuid = infoFichier.documentuuid;
    }
    console.debug("Transaction metadata:");
    console.debug(transactionNouvelleVersion);

    let domaine = 'millegrilles.domaines.GrosFichiers.nouvelleVersion.metadata';

    return this.rabbitMQ.transmettreTransactionFormattee(transactionNouvelleVersion, domaine);

  }

  transmettreInformationCle(infoFichier) {
    let transactionInformationCryptee = {
      domaine: 'millegrilles.domaines.GrosFichiers',
      'identificateurs_document': {
        fuuid: infoFichier.fuuid,
      },
      cle: infoFichier.cleSecreteCryptee,
      iv: infoFichier.iv,
    };

    console.debug("Information fichier cle ");
    console.debug(transactionInformationCryptee);
    let domaine = 'millegrilles.domaines.MaitreDesCles.nouvelleCle.grosFichier';

    return this.rabbitMQ.transmettreTransactionFormattee(transactionInformationCryptee, domaine);
  }

}

class ChunkInput extends Readable {
  constructor(options) {
    super(options);

    // Buffer de reception pour les chunks, au besoin.
    this.chunks = [];
    this.termine = false;
  }

  ajouterChunk(chunk) {
    if (!this.push(chunk)) {
      console.debug("Ajout chunk au buffer");
      this.chunks.push(chunk);
    }
  }

  terminer() {
    this.termine = true;
    this.push(null);
  }

  // _read() will be called when the stream wants to pull more data in.
  // The advisory size argument is ignored in this case.
  _read(size) {
    if(this.termine) {
      this.push(null);
    }
    if(this.chunks.length > 0) {
      this.push(this.chunks.shift());
    }
  }
}

module.exports = {SocketIoUpload};
