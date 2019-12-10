import axios from 'axios';
import {MilleGrillesCryptoHelper} from '../mgcomponents/CryptoSubtle';

const cryptoHelper = new MilleGrillesCryptoHelper();

export class ActionsFavoris {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  ajouterFavori = event => {
    let uuidFavori = event.currentTarget.value;
    console.debug("Ajouter favori " + uuidFavori);

    let transaction = {
      "uuid": uuidFavori,
    }

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.ajouterFavori', transaction)
    .then(msg=>{
      console.debug("Favori ajoute: " + uuidFavori);
    }).catch(err=>{
      console.error("Erreur ajout favori");
      console.error(err);
    });

  }

  supprimerFavori = event => {
    let uuidFavori = event.currentTarget.value;
    console.debug("Supprimer favori " + uuidFavori);

    let transaction = {
      "uuid": uuidFavori,
    }

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.supprimerFavori', transaction)
    .then(msg=>{
      console.debug("Favori supprime: " + uuidFavori);
    }).catch(err=>{
      console.error("Erreur suppression favori");
      console.error(err);
    });

  }

}

export class ActionsRecherche {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

}

export class ActionsDownload {
  constructor(reactModule, webSocketManager, refFormulaireDownload) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
    this.refFormulaireDownload = refFormulaireDownload;
  }

  telechargerEvent = event => {
    let uuidfichier = event.currentTarget.value;
    let dataset = event.currentTarget.dataset;

    let opts = {};
    if(dataset.notarget) {
      console.debug("DOWNLOAD NO TARGET");
      opts.target = 'none';
    }
    if(dataset.fuuid) {
      opts.fuuid = dataset.fuuid;
    }

    // Aller chercher l'information sur le fichier
    // L'information est peut-etre deja en memoire
    this.reactModule.chargerDocument({
      requetes: [{'filtre': {'_mg-libelle': 'fichier', 'uuid': uuidfichier}}]
    })
    .then(resultats=>{
      console.debug("Resultats requete fichier " + uuidfichier);
      console.debug(resultats);
      let fichier = resultats[0][0];

      this.telecharger({
        fichier,
        opts,
      });

    })
    .catch(err=>{
      console.error("Erreur initialisation telechargement fichier " + uuidfichier);
      console.error(err);
    })

  }

  telecharger = ({fichier, opts}) => {
    let uuidfichier = fichier.uuid;
    console.debug("Telecharger fichier uuid: " + uuidfichier + ": " + fichier);
    if(!fichier) {
      throw new Error("Erreur fichier inconnu: " + uuidfichier)
    }

    // Verifier si on a une version particuliere a telecharger
    let fuuid;
    if(opts && opts.fuuid) {
      fuuid = opts.fuuid;
    } else {
      fuuid = fichier.fuuid_v_courante;
    }

    let securite = fichier.securite;
    let nomFichier = fichier.nom;
    let contentType = fichier.mimetype;

    console.debug("1. Bouton clique pour fichier " + nomFichier);
    let form = this.refFormulaireDownload.current;
    let downloadUrl = this.reactModule.state.downloadUrl;

    console.debug("2. fuuide: " + fuuid);
    // Demander un OTP pour telecharger le fichier
    this.webSocketManager.demanderTokenTransfert()
    .then(token=>{
      form.action = downloadUrl + "/" + nomFichier;
      form.fuuid.value = fuuid;
      form.nomfichier.value = nomFichier;
      form.contenttype.value = contentType;
      form.authtoken.value = token;
      form.securite.value = securite;

      if(opts) {
        if(opts.target || opts.target === 'none') {
          console.log("Form Target null");
          form.target = '_self';
        }
      }

      console.debug("2. Submit preparation, download " + form.action + ", recu token " + form.authtoken.value);
      form.submit(); // Token pret, submit.

    })
    .catch(err=>{
      console.error("Erreur preparation download");
      console.error(err);
    })

  }


}

export class ActionsUpload {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;

    this.uploadEnCours = false;
  }

  ajouterUpload = (acceptedFile, fileInfo) => {
    console.debug("Commencer upload");
    console.debug(fileInfo);

    // Copier array d'uploads courants, ajouter copie d'info fichiers
    let uploadsCourants = [...this.reactModule.state.uploadsCourants];
    uploadsCourants.push({acceptedFile, ...fileInfo, progres: 0, path: acceptedFile.path});

    // Mettre a jour la liste des uploads;
    this.reactModule.setState({uploadsCourants});

    if(!this.uploadEnCours) {
      // Lance l'upload du fichier
      this.uploaderProchainFichier();
    }
  }

  annulerUpload = event => {
    console.debug("Annuler upload");
    console.debug(event);

  }

  uploadProgress = event => {
    let loaded = event.loaded, total = event.total;
    let pourcent = (Math.ceil(loaded/total*100));
    console.debug("Progres upload: " + pourcent + '%');

    let uploadCourant = {...this.reactModule.state.uploadsCourants[0]};
    uploadCourant.loaded = event.loaded;
    uploadCourant.total = event.total;
    uploadCourant.progres = pourcent;

    let uploadsCourants = [uploadCourant, ...this.reactModule.state.uploadsCourants.slice(1)];
    this.reactModule.setState({uploadsCourants});
  }

  uploadTermine = msg => {
    // L'upload est termine sur le navigateur, mais on attend toujours la
    // confirmation via un update MQ (document fichier).
    console.debug("Upload termine");
    console.debug(msg);

    let uploadComplete = {...this.reactModule.state.uploadsCourants[0]};
    uploadComplete.state = msg.status;

    let uploadsCompletes = [...this.reactModule.state.uploadsCompletes];
    uploadsCompletes.push(uploadComplete);

    let uploadsCourants = this.reactModule.state.uploadsCourants.slice(1); // Enlever premier item
    this.reactModule.setState({uploadsCompletes, uploadsCourants}, ()=>{
      // Enchainer le prochain upload (si applicable)
      if(uploadsCourants.length > 0) {
        console.debug("Prochain upload: " + uploadsCourants[0].path);
        this.uploaderProchainFichier();
      }
    });

  }

  clearUploadsCompletes = event => {
    this.reactModule.setState({uploadsCompletes: []});  // Nouvelle liste
  }

  uploaderProchainFichier = () => {
    // Utilise l'upload Q pour initialiser le prochain upload
    if(this.uploadEnCours) {
      console.error("Upload deja en cours");
      return;
    }

    if(this.reactModule.state.uploadsCourants.length > 0){
      this.uploadEnCours = true;

      const uploadInfo = this.reactModule.state.uploadsCourants[0];

      this.webSocketManager.uploadFichier(uploadInfo)
      .then(confirmation=>{
        console.debug("Upload fichier termine");
      })
      .catch(err=>{
        // Attendre avant de poursuivre au prochain fichier
        this.uploadTermine({
          status: 'echec',
        })
        this.uploadRetryTimer = setTimeout(()=>{
          this.uploadEnCours = false;   // Reset flag pour permettre l'upload
          this.uploaderProchainFichier();
        }, 10000);
      });

    } else {
      this.uploadEnCours = false;
      console.debug("Il n'y a rien a uploader.");
    }

  }

}
