const fs = require('fs');
const path = require('path');
const pki = require('./pki')
const request = require('request');
const crypto = require('crypto');
const { Readable } = require('stream');

const serveurConsignation = process.env.MG_CONSIGNATION_HTTP || 'https://consignationfichiers';

// Classe qui supporte un upload par stream a partir d'un navigateur
// via socket.io. Genere transactions nouvelleCle et metadata pour GrosFichiers.
class SocketIoUpload {

  constructor(rabbitMQ) {
    this.rabbitMQ = rabbitMQ;
    this.socket = null;
    this.sha256Client = {}; // Dict de resultats SHA256 recus
    this.chunkInput = null;
  }

  enregistrer(socket) {
    // console.debug("Enregistrer events SocketIoUpload");
    this.socket = socket;

    this.socket.on('upload.nouveauFichier', this.nouveauFichier.bind(this));
    this.socket.on('upload.paquet', this.paquet.bind(this));
    this.socket.on('upload.sync', this.sync.bind(this));
    this.socket.on('upload.fin', this.fin.bind(this));
    this.socket.on('upload.annuler', this.annulerTransfert.bind(this));
    this.socket.on('disconnect', this.annulerTransfert.bind(this));
  }

  nouveauFichier(infoFichier, callback) {
    // console.debug("Demande de preparation d'upload de nouveau fichier");
    // console.debug(infoFichier);
    // this.infoFichier[infoFichier.fuuid] = infoFichier;
    this.chunkInput = new ChunkInput()

    // Ouvrir un streamWriter avec consignation.grosfichiers
    const crypte = infoFichier.cleSecreteCryptee !== undefined;
    this.creerOutputStream(infoFichier, crypte);
    this.transmettreInformationCle(infoFichier);
    callback({pret: true});
  }

  paquet(chunk, callback) {
    if(chunk && chunk.length) {
      // console.debug("Paquet " + chunk.length);
      this.chunkInput.ajouterChunk(chunk)

      // Transmettre une notification de paquet sauvegarde
      // Permet de synchroniser l'upload (style ACK)
      if(callback) {
        // console.debug('Callback, chunk ' + chunk.length);
        callback();
      } else {
        // console.debug('Sans callback, chunk ' + chunk.length);
      }

    }
  }

  sync(chunk, callback) {
    // console.debug('Sync');
    callback();
  }

  fin(msg) {
    // Conserver le SHA256, il va etre recupere par la Promise sous creerOutputStream()
    this.sha256Client[msg.fuuid] = msg.sha256;
    this.chunkInput.terminer();
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

    if(uuidInfoFichier) {
      delete this.sha256Client[uuidInfoFichier];
    }

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
      var tailleFichier = 0;
      const sha256Calc = crypto.createHash('sha256');
      const outStream = request.put(options, (err, httpResponse, body) =>{
        const sha256Client = this.sha256Client[fileuuid]; // infoFichier.sha256Remote;
        console.debug("Cleanup SHA256 Client pour " + fileuuid);
        delete this.sha256Client[fileuuid];

        if(err) {
          reject(err);
          return;
        }
        // console.debug("Upload PUT complete pour " + fileuuid);
        // console.debug(httpResponse);
        // console.debug("Response status " + httpResponse.statusCode);
        // console.debug("Response body");
        // console.debug(body);

        const responseBody = JSON.parse(body);
        const sha256consignation = responseBody.sha256Hash;
        const sha256Local = infoFichier.sha256Local; // Place par chunkInput 'end'

        let compMessage = "SHA256 client : " + sha256Client +
          ", local : " + sha256Local + ", consignation " + sha256consignation;
        // console.debug(compMessage);

        // Verifier le hachage client vs consignation (local n'est pas
        // important sauf pour diagnostiquer des problemes)
        if(sha256Client !== sha256consignation) {
          let err = "SHA256 fichiers ne correspondent pas : " + compMessage;
          reject(err);
          return;
        }

        // Transmettre les transactions metadata
        // Cette action est asynchrone, le prochain fichier peut commencer a
        // uploader immediatement.
        return this.transmettreTransactionMetadata(infoFichier, sha256Client)
        .then(()=>{
          // console.debug("Transaction fin complete");
          resolve();
        })
        .catch(err=>{
          console.error("Erreur transmission metadata");
          console.error(err);
          reject(err);
        })

      })

      this.chunkInput.pipe(outStream);
      this.chunkInput.on('data', chunk=>{
        sha256Calc.update(chunk);
        tailleFichier += chunk.length;
      })
      this.chunkInput.on('end', chunk=>{
        var hashResult = sha256Calc.digest('hex');
        infoFichier.sha256Local = hashResult;
        // console.debug("Digest SHA256 recalcule " + hashResult);
        console.debug("Taille fichier " + tailleFichier);
      })

      outStream.on('error', reject);

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
    this.reading = false;
  }

  ajouterChunk(chunk) {
    // console.debug("Ajout chunk sur buffer")
    this.chunks.push(chunk);

    // Essayer push a nouveau
    this._push();

  }

  _push(size) {
    while(this.reading && this.chunks.length > 0) {
      let chunk = this.chunks.shift();
      // console.debug("Push chunk " + chunk.length);
      if(chunk.length > 0) {
        // this.reading = this.push(chunk);
        this.push(chunk);
        if(!this.reading) {
          this.chunks.unshift(chunk);
          break;
        }
      }
    }
  }

  terminer() {
    this.termine = true;
    this.push(null);
  }

  // _read() will be called when the stream wants to pull more data in.
  _read(size) {
    // console.debug("_read invoque");
    this.reading = true;
    // console.debug("_read push");
    this._push(size);

    if(this.termine) {
      this.push(null);
    }
  }
}

module.exports = {SocketIoUpload};
