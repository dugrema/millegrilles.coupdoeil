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
    this.infoFichier = {};
    this.uuidFichierCourant = null;
    this.chunkInput = null;
  }

  enregistrer(socket) {
    // console.debug("Enregistrer events SocketIoUpload");
    this.socket = socket;

    this.socket.on('upload.nouveauFichier', this.nouveauFichier.bind(this));
    this.socket.on('upload.paquet', this.paquet.bind(this));
    this.socket.on('upload.fin', this.fin.bind(this));
    this.socket.on('upload.annuler', this.annulerTransfert.bind(this));
    this.socket.on('disconnect', this.annulerTransfert.bind(this));
  }

  nouveauFichier(infoFichier, callback) {
    // console.debug("Demande de preparation d'upload de nouveau fichier");
    // console.debug(infoFichier);
    this.uuidFichierCourant = infoFichier.fuuid;
    this.infoFichier[this.uuidFichierCourant] = infoFichier;
    this.chunkInput = new ChunkInput()

    // Ouvrir un streamWriter avec consignation.grosfichiers
    const crypte = infoFichier.cleSecreteCryptee !== undefined;
    this.creerOutputStream(infoFichier, crypte);

    this.transmettreInformationCle(infoFichier)
    //.then(()=>{
      callback({pret: true});
    // })
    // .catch(err=>{
    //   console.error("Erreur transmettreInformationCle, on annule le transfert");
    //
    //   // Annuler transfert
    //   callback({pret: false, erreur: err});
    //
    //   this.annulerTransfert();
    // });

  }

  paquet(chunk, callback) {
    if(chunk && chunk.length) {
      // console.debug("Paquet " + chunk.length);
      this.chunkInput.ajouterChunk(chunk)
    } else {
      // console.debug("Paquet vide, on l'ignore");
      // console.debug(chunk);
    }

    // Transmettre une notification de paquet sauvegarde
    // Permet de synchroniser l'upload (style ACK)
    if(callback) callback();
  }

  fin(msg) {
    // console.debug("Fin");
    // console.debug(msg);

    // Conserver le uuid et l'info du fichier qui vient de terminer
    // le reste des actions est asynchrone
    const uuidFichierCourant = this.uuidFichierCourant;
    // console.debug("InfoFichier charger pour fin de " + uuidFichierCourant);

    this.uuidFichierCourant = null;  // Reset pour prochain upload
    const infoFichier = this.infoFichier[uuidFichierCourant];
    const sha256 = msg.sha256;

    // console.debug(infoFichier);

    this.chunkInput.terminer()

    // Transmettre les transactions metadata
    // Cette action est asynchrone, le prochain fichier peut commencer a
    // uploader immediatement.
    return this.transmettreTransactionMetadata(infoFichier, sha256)
    .then(()=>{
      // console.debug("Transaction fin complete");
    })
    .catch(err=>{
      console.error("Erreur transmission metadata");
      console.error(err);
    })
    .finally(()=>{
      // Cleanup
      if(uuidFichierCourant) {
        delete this.infoFichier[uuidFichierCourant];
      }
    });

  }

  annulerTransfert(err, uuidInfoFichier) {
    console.error("Annuler transfert fichier");
    if(err) {
      console.error(err);
    }

    this.chunkInput.terminer()

    if(!uuidInfoFichier) {
      uuidInfoFichier = this.uuidFichierCourant;
    }

    delete this.infoFichier[uuidFichierCourant];

    if(this.socket) {
      this.socket.emit('upload.annule');
    }
  }

  creerOutputStream(infoFichier, crypte, paquet) {
    let fileuuid = infoFichier.fuuid;
    let nomfichier = infoFichier.nomFichier;
    let mimetype = infoFichier.typeFichier;
    // console.debug(infoFichier);
    let pathServeur = serveurConsignation + '/' +
      path.join('grosfichiers', 'local', 'nouveauFichier', fileuuid);
    let options = {
      url: pathServeur,
      headers: {
        encrypte: crypte,
        fileuuid,
        nomfichier,
        mimetype,
      },
      agentOptions: {ca: pki.ca},  // Utilisation certificats SSL internes
    };

    new Promise((resolve, reject)=>{

      const outStream = request.put(options, (err, httpResponse, body) =>{
        // console.debug("Upload PUT complete pour " + fileuuid);
        // console.debug(httpResponse);
        // console.debug("Response body");
        // console.debug(body);
      });
      this.chunkInput.pipe(outStream);

      outStream.on('error', reject);

      outStream.on('end', resolve);

    });

    // console.debug("Oustream cree + promise");
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
    // console.debug("Transaction metadata:");
    // console.debug(transactionNouvelleVersion);

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
      securite: infoFichier.securite,
    };

    // console.debug("Information fichier cle ");
    // console.debug(transactionInformationCryptee);
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
      // console.debug("Ajout chunk au buffer");
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
