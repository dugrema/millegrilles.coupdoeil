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

export class ActionsFichiers {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

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
