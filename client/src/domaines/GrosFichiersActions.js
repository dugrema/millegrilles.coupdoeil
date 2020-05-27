import axios from 'axios';
import uuidv1 from 'uuid/v1';
import {MilleGrillesCryptoHelper} from '../mgcomponents/CryptoSubtle';

const cryptoHelper = new MilleGrillesCryptoHelper();

export class ActionsFavoris {

  constructor(reactModule, webSocketManager) {
    this.reactModule = reactModule;
    this.webSocketManager = webSocketManager;
  }

  ajouterFavori = event => {
    let uuidFavori = event.currentTarget.value;
    // console.debug("Ajouter favori " + uuidFavori);

    let transaction = {
      "uuid": uuidFavori,
    }

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.ajouterFavori', transaction)
    .then(msg=>{
      // console.debug("Favori ajoute: " + uuidFavori);
    }).catch(err=>{
      console.error("Erreur ajout favori");
      console.error(err);
    });

  }

  supprimerFavori = event => {
    let uuidFavori = event.currentTarget.value;
    // console.debug("Supprimer favori " + uuidFavori);

    let transaction = {
      "uuid": uuidFavori,
    }

    this.webSocketManager.transmettreTransaction(
      'millegrilles.domaines.GrosFichiers.supprimerFavori', transaction)
    .then(msg=>{
      // console.debug("Favori supprime: " + uuidFavori);
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

    var filtre = {'_mg-libelle': 'fichier'};
    if(opts.fuuid) {
      filtre['versions.' + opts.fuuid] = {'$exists': true};
    } else {
      filtre.uuid = uuidfichier;
    }

    // Aller chercher l'information sur le fichier
    // L'information est peut-etre deja en memoire
    this.reactModule.chargerDocument({
      requetes: [{'filtre': filtre}]
    })
    .then(resultats=>{
      console.debug("Resultats requete fichier " + uuidfichier || opts.fuuid);
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
    // console.debug("Telecharger fichier uuid: " + uuidfichier + ": " + fichier);
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

    // let nomFichier = fichier.nom;
    let securite = fichier.securite;

    // console.debug("1. Bouton clique pour fichier " + nomFichier);

    if(localStorage.getItem('certificat.fingerprint') && (securite === '3.protege' || securite === '4.secure')) {
      // console.debug("2. Telecharger fichier crypte fuuide: " + fuuid);
      this.telechargerViaRequest(fuuid, fichier, opts)
      .catch(err=>{
        console.error("Erreur telechargement fichier crypte");
        console.error(err);
      })
    } else {
      // console.debug("2. Telecharger fichier standard fuuide: " + fuuid);
      let form = this.refFormulaireDownload.current;
      this.telechargerViaForm(form, fuuid, fichier, opts)
      .catch(err=>{
        console.error("Erreur preparation download");
        console.error(err);
      })
    }

  }

  // Utilise un form.submit pour lancer le telechargement
  telechargerViaForm(form, fuuid, fichier, opts) {
    // Demander un OTP pour telecharger le fichier
    return this.webSocketManager.demanderTokenTransfert()
    .then(token=>{
      let downloadUrl = this.reactModule.state.downloadUrl;
      let nomFichier = fichier.nom;
      let contentType = fichier.mimetype;
      let securite = fichier.securite;
      let extension = fichier.extension;

      form.action = downloadUrl + "/" + nomFichier;
      form.fuuid.value = fuuid;
      form.nomfichier.value = nomFichier;
      form.contenttype.value = contentType;
      form.authtoken.value = token;
      form.securite.value = securite;
      form.extension.value = extension;

      if(opts) {
        if(opts.target || opts.target === 'none') {
          console.log("Form Target null");
          form.target = '_self';
        }
      }

      //console.debug("2. Submit preparation, download " + form.action + ", recu token " + form.authtoken.value);
      form.submit(); // Token pret, submit.
    })
  }

  // Utilise request.post pour telecharger, decrypte le contenu avant de l'exposer
  telechargerViaRequest(fuuid, fichier, opts) {

    let downloadUrl = this.reactModule.state.downloadUrl;
    let nomFichier = fichier.nom;
    // let contentType = fichier.mimetype;
    let securite = fichier.securite;

    return this.webSocketManager.demanderTokenTransfert()
    .then(token=>{
      // console.debug("Token download: " + token);
      // let utiliseCache = {};
      // if(this.state.fichierDate) {
      //   utiliseCache['If-Modified-Since'] = this.state.fichierDate;
      // }
      // if(this.state.etag) {
      //   utiliseCache['ETag'] = this.state.etag;
      // }

      var body = new FormData();
      body.set('fuuid', fuuid);
      body.set('securite', securite);
      body.set('fingerprint', localStorage.getItem('certificat.fingerprint'));
      body.set('authtoken', token);

      // body = {
      //   fuuid, securite,
      //   authtoken: token,
      //   fingerprint: localStorage.getItem('certificat.fingerprint')
      // }

      axios.post(downloadUrl + '/' + nomFichier, body, {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // 'Content-Type': 'multipart/form-data',
          'authtoken': token,
        }
      })
      .then(response=>{
        // console.log("Resultat Download");
        // console.log(response.headers);
        let contentType = response.headers['content-type']

        let cleSecrete = response.headers.cle;
        let iv = response.headers.iv;

        // Decrypter
        cryptoHelper.decrypterSubtle(response.data, cleSecrete, iv, localStorage.getItem('certificat.cleprivee'))
        .then(bufferDecrypte=>{
          // console.log("Fichier est decrypte");
          const blobFichier = new Blob([new Uint8Array(bufferDecrypte)], {type: contentType});
          let dataUrl = window.URL.createObjectURL(blobFichier);

          // Conserver le fichier pour permettre le telechargement
          this.reactModule.setState({downloadDecrypte: {
            nomFichier,
            contenu: dataUrl
          }});
        })
        .catch(err=>{
          console.error("Erreur decryptage fichier telecharge");
          console.error(err);
        });

      });

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
    // console.debug("Commencer upload");
    // console.debug(fileInfo);

    // Generer informations pour le fichier
    const fuuid = uuidv1();

    // Copier array d'uploads courants, ajouter copie d'info fichiers
    let uploadsCourants = [...this.reactModule.state.uploadsCourants];
    uploadsCourants.push({
      acceptedFile,
      ...fileInfo,
      fuuid,
      progres: 0,
      path: acceptedFile.path}
    );

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
    // console.debug("Progres upload: " + pourcent + '%');

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
    // console.debug("Upload termine");
    // console.debug(msg);

    let uploadComplete = {...this.reactModule.state.uploadsCourants[0]};
    uploadComplete.state = msg.status;

    let uploadsCompletes = [...this.reactModule.state.uploadsCompletes];
    uploadsCompletes.push(uploadComplete);

    let uploadsCourants = this.reactModule.state.uploadsCourants.slice(1); // Enlever premier item
    this.reactModule.setState({uploadsCompletes, uploadsCourants}, ()=>{
      // Enchainer le prochain upload (si applicable)
      if(uploadsCourants.length > 0) {
        // console.debug("Prochain upload: " + uploadsCourants[0].path);
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
        // console.debug("Upload fichier termine");
        this.uploadEnCours = false;
        this.uploadTermine({
          status: 'succes',
        })
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
      // console.debug("Il n'y a rien a uploader.");
    }

  }

}
