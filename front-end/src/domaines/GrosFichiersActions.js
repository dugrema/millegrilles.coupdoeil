import axios from 'axios';

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

export class ActionsCarnet {

  constructor(reactModule) {
    this.reactModule = reactModule;
  }

  toggle(uuid, opt) {
    let carnet = this.reactModule.state.carnet;

    // Le carnet genere une nouvelle instance a chaque operation
    carnet = carnet.toggle(uuid, opt);

    this.reactModule.setState({carnet});
  }

}

export class ActionsFichiers {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  renommer = (uuid, nouveauNom) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.renommerFichier';
    let transaction = {
        uuid: uuid,
        nom: nouveauNom,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  supprimer = (uuid) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.supprimerFichier';
    let transaction = {
        uuid: uuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  recuperer = (uuid) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.recupererFichier';
    let transaction = {
        uuid: uuid,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);
  }

  modifierCommentaire = (uuid, commentaires) => {
    let domaine = 'millegrilles.domaines.GrosFichiers.commenterFichier';
    let transaction = {
        uuid: uuid,
        commentaires: commentaires,
    }
    return this.webSocketManager.transmettreTransaction(domaine, transaction);  }

}

export class ActionsCollections {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
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
      opts.fuuid_version = dataset.fuuid;
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

    // Mettre timer pour donner 30 secondes au backend pour finir le traitement,
    // sans quoi on considere le fichier incomplet avec erreur au back-end.
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

      // Demander un token (OTP) via websockets
      this.webSocketManager.demanderTokenTransfert()
      .then(token=>{
        let uploadInfo = this.reactModule.state.uploadsCourants[0];
        console.debug("Token obtenu, debut de l'upload de " + uploadInfo.path);

        let data = new FormData();
        data.append('securite', uploadInfo.securite);
        data.append('grosfichier', uploadInfo.acceptedFile);
        let config = {
          headers: {
            'authtoken': token,
          },
          onUploadProgress: this.uploadProgress,
          //cancelToken: new CancelToken(function (cancel) {
          // }),
        }

        return axios.put('/grosFichiers/nouveauFichier', data, config);
      })
      .then(msg=>{
        this.uploadEnCours = false;  // Permet d'enchainer les uploads
        this.uploadTermine(msg);
      })
      .catch(err=>{
        console.error("Erreur upload, on va reessayer plus tard");
        console.debug(err);
        this.uploadRetryTimer = setTimeout(()=>{
          this.uploadEnCours = false;   // Reset flag pour permettre l'upload
          this.uploaderProchainFichier();
        }, 10000);
      })
      .finally(()=>{
        this.uploadEnCours = false;
      });
    } else {
      this.uploadEnCours = false;
      console.debug("Il n'y a rien a uploader.");
    }

  }

}
