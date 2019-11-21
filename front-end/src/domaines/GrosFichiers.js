import React from 'react';
import axios from 'axios';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';

// Composants React GrosFichiers
import {GrosFichierAfficherPopup} from './GrosFichiersPopups';
import {AffichageFichier, NavigationCollection,
  GrosFichiersRenderDownloadForm, FileUploadMonitor} from './GrosFichiersNavigation.js'

export class GrosFichiers extends React.Component {

  constructor(props) {
    super(props);
    this.refFormulaireDownload = React.createRef();

    this.uploadEnCours = false;  // True quand un upload est en marche
    this.uploadRetryTimer = null;  // Timer avant prochain essaie d'upload

    this.state = {

      listeCourante: null,       // Liste a afficher (si pas null et fichier null)
      collectionCourante: null,  // Collection a afficher (si pas null et fichier null)
      fichierCourant: null,      // Fichier a afficher (si pas null)

      // Variables pour ecrans specifiques
      preparerUpload: null,

      downloadUrl: '/grosFichiers/local',

      uploadsCourants: [], // Upload Q du navigateur
      uploadsCompletes: [], // Uploads en attente de confirmation via MQ

    };

  }

  // Actions utiliees uniquement dans les pop-ups
  popupActions = {

    // Creer une collection
    soumettreCreerCollection: (event) => {
      let formulaire = event.currentTarget.form;
      let nomCollection = formulaire.nomcollection.value;

      // Il est possible d'ajouter a une collection a la creation
      let uuidSuperCollection = formulaire.uuidsupercoll.value;

      console.debug("Creer collection " + nomCollection + ". Ajouter a collection? " + uuidSuperCollection);

      // Transmettre message a MQ pour creer la collection
      let transaction = {
        "nom": nomCollection,
      }
      if(uuidSuperCollection) {
        transaction['ajouter_a_collection'] = uuidSuperCollection;
      }

      webSocketManager.transmettreTransaction(
        'millegrilles.domaines.GrosFichiers.creerCollection', transaction)
      .then(msg=>{
        // Mettre en evidence la nouvelle collection lorsqu'elle arrivera a l'ecran.
        console.debug("Nouvelle collection cree: " + nomCollection);
      }).catch(err=>{
        console.error("Erreur creation collection");
        console.error(err);
      });

      this.setState({popupProps: {popupCreerCollectionValeurs: null}});
    },
    annulerCreerRepertoire: (event) => {
      this.setState({popupProps: {popupCreerCollectionValeurs: null}});
    },

    // Changer nom d'une collection
    soumettreChangerNomCollection: (event) => {
      let formulaire = event.currentTarget.form;
      let nouveauNom = formulaire.nouveauNom.value;
      let ancienNom = this.state.popupProps.popupRenommerCollectionValeurs.nom;
      let uuidCollection = this.state.popupProps.popupRenommerCollectionValeurs.uuidCollection;

      console.debug("Renommer collection " + ancienNom + " a " + nouveauNom + ", uuid=" + uuidCollection);

      if(nouveauNom !== ancienNom) {
        // Transmettre message a MQ pour renommer la collection
        let transaction = {
          "uuid": uuidCollection,
          "nom": nouveauNom,
        }
        webSocketManager.transmettreTransaction(
          'millegrilles.domaines.GrosFichiers.renommerCollection', transaction);
      }

      this.setState({popupRenommerCollectionValeurs: null})
    },
    annulerChangerNomCollection: (event) => {
      this.setState({popupRenommerCollectionValeurs: null})
    },

    // Changer le nom d'un fichier
    soumettreChangerNomFichier: (event) => {
      let formulaire = event.currentTarget.form;
      let nouveauNom = formulaire.nouveauNom.value;
      let ancienNom = this.state.popupProps.popupRenommerFichierValeurs.nom;
      let uuidFichier = this.state.popupProps.popupRenommerFichierValeurs.uuidFichier;

      console.debug("Renommer fichier " + ancienNom + " a " + nouveauNom + ", uuid=" + uuidFichier);

      if(nouveauNom !== ancienNom) {
        // Transmettre message a MQ pour renommer le fichier
        let transaction = {
          "uuid": uuidFichier,
          "nom": nouveauNom,
        }
        webSocketManager.transmettreTransaction(
          'millegrilles.domaines.GrosFichiers.renommerFichier', transaction);
      }

      this.setState({
        ...this.state.popupProps,
        popupProps: {popupRenommerFichierValeurs: null}
      });
    },
    annulerChangerNomFichier: (event) => {
      this.setState({
        ...this.state.popupProps,
        popupProps: {popupRenommerFichierValeurs: null}
      });
    },

    supprimerCollection: (event) => {
      let uuidCollection = event.currentTarget.value;

      let transaction = {
        "uuid": uuidCollection,
      }
      webSocketManager.transmettreTransaction(
        'millegrilles.domaines.GrosFichiers.supprimerCollection', transaction)
      .then(msg=>{
        console.debug("Collection supprime " + uuidCollection);
        let collectionCourante = this.state.collectionCourante;
        if(collectionCourante.uuid === uuidCollection) {
          // On va popper vers la liste globale
          this.setState({collectionCourante: null});
        }
      })
      .catch(err=>{
        console.error("Erreur suppression collection " + uuidCollection);
      });
    },

    supprimerFichier: (event) => {
      let uuidFichier = event.currentTarget.value;

      let transaction = {
        "uuid": uuidFichier,
      }

      webSocketManager.transmettreTransaction(
        'millegrilles.domaines.GrosFichiers.supprimerFichier', transaction)
      .then(msg=>{
        console.debug("Fichier supprime: " + uuidFichier);
      }).catch(err=>{
        console.error("Erreur suppression fichier");
        console.error(err);
      });
    },

  }

  // Actions utiliees dans le panneau des fichiers
  fichierActions = {
    upload: collectionDestination => {
      console.debug("Upload vers " + collectionDestination);
    },

    telechargerEvent: event => {
      let uuidfichier = event.currentTarget.value;
      let dataset = event.currentTarget.dataset;
      let fuuid_version = dataset.fuuid;
      let securite = dataset.securite;

      let opts = {};
      if(dataset.notarget) {
        console.log("DOWNLOAD NO TARGET");
        opts.target = 'none';
      }

      this.fichierActions.telecharger({
        uuidfichier,
        fuuid: fuuid_version,
        securite,
        opts,
      });
    },

    telecharger: ({uuidfichier, fuuid, opts}) => {
      // Trouver fichier dans information repertoire
      // let infoRepertoire = this.state.repertoireCourant || this.state.repertoireRacine;

      // var fichier = infoRepertoire.fichiers[uuidfichier];
      // console.debug("Telecharger fichier uuid: " + uuidfichier + ": " + fichier);
      // if(!fichier) {
      //   throw new Error("Erreur fichier inconnu: " + uuidfichier)
      // }
      // if(!fuuid) {
      //   fuuid = fichier.fuuid_v_courante;
      // }
      //
      // let securite = fichier.securite;
      // let nomFichier = fichier.nom;
      // let contentType = fichier.mimetype;
      //
      // console.debug("1. Bouton clique pour fichier " + nomFichier);
      // let form = this.refFormulaireDownload.current;
      // let downloadUrl = this.state.downloadUrl;
      //
      // console.debug("2. fuuide: " + fuuid);
      // // Demander un OTP pour telecharger le fichier
      // webSocketManager.demanderTokenTransfert()
      // .then(token=>{
      //   form.action = downloadUrl + "/" + nomFichier;
      //   form.fuuid.value = fuuid;
      //   form.nomfichier.value = nomFichier;
      //   form.contenttype.value = contentType;
      //   form.authtoken.value = token;
      //   form.securite.value = securite;
      //
      //   if(opts) {
      //     if(opts.target || opts.target === 'none') {
      //       console.log("Form Target null");
      //       form.target = '_self';
      //     }
      //   }
      //
      //   console.debug("2. Submit preparation, download " + form.action + ", recu token " + form.authtoken.value);
      //   form.submit(); // Token pret, submit.
      //
      // })
      // .catch(err=>{
      //   console.error("Erreur preparation download");
      //   console.error(err);
      // })

    },

    supprimer: (selection) => {
      console.debug("Supprimer");

      let feedbackFichier = msg => {
        console.debug("Fichier supprime: " + uuid);
      }
      let feedbackCollection = msg => {
        console.debug("Collection supprimee: " + uuid);
      }

      for(var uuid in selection) {
        let infoitem = selection[uuid];
        let typeitem = infoitem.type;
        console.debug(typeitem + " " + uuid);
        let transaction = {
          "uuid": uuid,
        }

        if(typeitem === 'fichier') {
          webSocketManager.transmettreTransaction(
            'millegrilles.domaines.GrosFichiers.supprimerFichier', transaction)
          .then(msg=>feedbackFichier).catch(err=>{
            console.error("Erreur suppression fichier");
            console.error(err);
          });
        } else if(typeitem === 'collection') {
          webSocketManager.transmettreTransaction(
            'millegrilles.domaines.GrosFichiers.supprimerCollection', transaction)
          .then(msg=>feedbackCollection).catch(err=>{
            console.error("Erreur suppression collection");
            console.error(err);
          });
        }
      }
    },

  }

  collectionActions = {
    afficherCollection: event => {
      let bouton = event.currentTarget;
      let collectionuuid = bouton.value;
      this.afficherCollection(collectionuuid);
    },
  }

  uploadActions = {
    ajouterUpload: (acceptedFile, fileInfo) => {
      console.debug("Commencer upload");
      console.debug(fileInfo);

      // Copier array d'uploads courants, ajouter copie d'info fichiers
      let uploadsCourants = [...this.state.uploadsCourants];
      uploadsCourants.push({acceptedFile, ...fileInfo, progres: 0, path: acceptedFile.path});

      // Mettre a jour la liste des uploads;
      this.setState({uploadsCourants});

      if(!this.uploadEnCours) {
        // Lance l'upload du fichier
        this.uploaderProchainFichier();
      }
    },
    annulerUpload: (event) => {
      console.debug("Annuler upload");
      console.debug(event);

    },
    uploadProgress: (event) => {
      let loaded = event.loaded, total = event.total;
      let pourcent = (Math.ceil(loaded/total*100));
      console.debug("Progres upload: " + pourcent + '%');

      let uploadCourant = {...this.state.uploadsCourants[0]};
      uploadCourant.loaded = event.loaded;
      uploadCourant.total = event.total;
      uploadCourant.progres = pourcent;

      let uploadsCourants = [uploadCourant, ...this.state.uploadsCourants.slice(1)];
      this.setState({uploadsCourants});
    },
    uploadTermine: (msg) => {
      // L'upload est termine sur le navigateur, mais on attend toujours la
      // confirmation via un update MQ (document fichier).
      console.debug("Upload termine");
      console.debug(msg);

      // Mettre timer pour donner 30 secondes au backend pour finir le traitement,
      // sans quoi on considere le fichier incomplet avec erreur au back-end.
      let uploadComplete = {...this.state.uploadsCourants[0]};
      uploadComplete.state = msg.status;

      let uploadsCompletes = [...this.state.uploadsCompletes];
      uploadsCompletes.push(uploadComplete);

      let uploadsCourants = this.state.uploadsCourants.slice(1); // Enlever premier item
      this.setState({uploadsCompletes, uploadsCourants}, ()=>{
        // Enchainer le prochain upload (si applicable)
        if(uploadsCourants.length > 0) {
          console.debug("Prochain upload: " + uploadsCourants[0].path);
          this.uploaderProchainFichier();
        }
      });

    },
    clearUploadsCompletes: (event) => {
      this.setState({uploadsCompletes: []});  // Nouvelle liste
    }
  }

  // Configuration statique du composant:
  //   subscriptions: Le nom des routing keys qui vont etre ecoutees
  config = {
    subscriptions: [
      'noeuds.source.millegrilles_domaines_GrosFichiers.fichier',
      'noeuds.source.millegrilles_domaines_GrosFichiers.collection',
    ]
  };

  chargerDocument = (requete, domaine) => {
    if(!domaine) {
      // Domaine par defaut est une requete vers GrosFichiers
      domaine = 'requete.millegrilles.domaines.GrosFichiers';
    }

    // console.debug("Transmettre requete");
    // console.debug(requete);

    // Retourne la promise pour chaining then/catch
    return webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      // console.debug("Reponse requete, documents recu");
      // console.debug(docsRecu);
      return docsRecu;  // Recuperer avec un then(resultats=>{})
    });
  }

  uploaderProchainFichier() {
    // Utilise l'upload Q pour initialiser le prochain upload
    if(this.uploadEnCours) {
      console.error("Upload deja en cours");
      return;
    }

    if(this.state.uploadsCourants.length > 0){
      this.uploadEnCours = true;

      // Demander un token (OTP) via websockets
      webSocketManager.demanderTokenTransfert()
      .then(token=>{
        let uploadInfo = this.state.uploadsCourants[0];
        console.debug("Token obtenu, debut de l'upload de " + uploadInfo.path);

        let data = new FormData();
        data.append('repertoire_uuid', uploadInfo.repertoire_uuid);
        data.append('securite', uploadInfo.securite);
        data.append('grosfichier', uploadInfo.acceptedFile);
        let config = {
          headers: {
            'authtoken': token,
          },
          onUploadProgress: this.uploadActions.uploadProgress,
          //cancelToken: new CancelToken(function (cancel) {
          // }),
        }

        return axios.put('/grosFichiers/nouveauFichier', data, config);
      })
      .then(msg=>{
        this.uploadEnCours = false;  // Permet d'enchainer les uploads
        this.uploadActions.uploadTermine(msg);
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

  afficherProprietesFichier(uuidFichier) {
    this.chargerDocument({
      requetes: [{'filtre': {'uuid': uuidFichier}}]
    })
    .then(resultats=>{
      console.debug("Resultats afficherProprietesFichier");
      console.debug(resultats);
      let fichier = resultats[0][0];
      this.setState({fichierCourant: fichier});
    })
    .catch(err=>{
      console.error("Erreur chargement fichier " + uuidFichier);
      console.error(err);
    })
  }

  afficherCollection(collectionuuid) {
    let collectionCourante = this.state['collectionCourante'];
    // console.debug("Repertoire zone courante: ");
    // console.debug(repertoireZoneCourante);
    if(collectionuuid && collectionuuid !== collectionCourante.uuid) {
      this.chargerDocument({
        requetes: [{'filtre': {'uuid': collectionuuid, '_mg-libelle': 'collection'}}]
      })
      .then(resultats=>{
        // console.debug("Resultats afficherRepertoire");
        // console.debug(resultats);
        let repertoire = resultats[0][0];
        this.setState({repertoireCourant: repertoire});
      })
      .catch(err=>{
        console.error("Erreur chargement collection " + collectionuuid);
        console.error(err);
      })
    } else {
      // Retour a l'affichage de base
      this.setState({collectionCourante: null})
    }
  }

  retourFichier = (event) => {
    this.setState({'fichierCourant': null});
  }

  afficherPopupCreerCollection = () => {
    this.setState({popupProps: {popupCreerCollectionValeurs: {}}});
  }

  afficherPopupRenommer = (uuid, type) => {
    console.debug("Renommer " + type + ", uuid " + uuid);
    let repertoireCourant = this.state.repertoireCourant || this.state.repertoireRacine;

    if(type === 'fichier') {
      let nomFichier = repertoireCourant.fichiers[uuid].nom;
      this.setState({popupProps: {popupRenommerFichierValeurs: {
        nom: nomFichier,
        uuidFichier: uuid,
      }}});
    } else if(type === 'repertoire') {
      let nomRepertoire = repertoireCourant.repertoires[uuid].nom;
      this.setState({popupRenommerRepertoireValeurs: {
        nom: nomRepertoire,
        uuidRepertoire: uuid,
      }});
    }

  }

  processMessage = (routingKey, doc) => {
    console.debug("Message de MQ: " + routingKey);

    if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.collection') {

      console.warning("Evenement collection, pas encore gere");
      console.warning(doc);

    } else if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.fichier') {
      // Verifier si repertoire courant correspond
      let fichierCourant = this.state.fichierCourant;
      if(fichierCourant && fichierCourant.uuid === doc.uuid) {
        console.debug("Update fichier courant");
        console.debug(doc);
        this.setState({fichierCourant: doc});
      }
    }
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);

    // Charger les documents pour les repertoires speciaux.
    this.chargerDocument({
      requetes: [{'filtre': {'_mg-libelle': {'$in': [
        'repertoire.racine',
        'repertoire.corbeille',
        'repertoire.orphelins',
      ]}}}]
    })
    .then(docs=>{
      console.debug("Documents speciaux");
      console.debug(docs);
      // On recoit une liste de resultats, avec une liste de documents.

    })
    .catch(err=>{
      console.error("Erreur chargement document racine");
      console.error(err);
    });
  }

  componentWillUnmount() {
    // console.debug("Unsubscribe GrosFichiers");
    webSocketManager.unsubscribe(this.config.subscriptions);
  }

  render() {
    // Determiner le contenu de l'ecran en fonction de l'etat
    // Affichage: 1.fichier, ou 2.repertoire, ou 3.repertoire racine
    let uploadProgress = null;
    if(this.state.uploadsCourants.length > 0 || this.state.uploadsCompletes.length > 0) {
      uploadProgress = (
        <div>
          <FileUploadMonitor
            uploadsCourants={this.state.uploadsCourants}
            uploadsCompletes={this.state.uploadsCompletes}
            {...this.uploadActions}
            />
        </div>
      )
    }

    let affichagePrincipal;
    if (this.state.fichierCourant) {
      affichagePrincipal = (
        <div>
          <AffichageFichier
            fichierCourant={this.state.fichierCourant}
            downloadUrl={this.state.downloadUrl}
            retourFichier={this.retourFichier}
            {...this.fichierActions}
            />
        </div>
      )
    } else if(this.state.collectionCourante){
      // Afficher une collection

      affichagePrincipal = (
        <div>
          <NavigationCollection
            collectionCourante={this.state.collectionCourante}
            uploadActions={this.uploadActions}

            {...this.state.repertoiresZones}
            downloadUrl={this.state.downloadUrl}

            afficherPopupCreerRepertoire={this.afficherPopupCreerRepertoire}
            {...this.repertoireActions}

            />

          {uploadProgress}

        </div>
      )
    } else {
      // Page par defaut

      affichagePrincipal = (
        <div>
          {uploadProgress}

        </div>
      )
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            {affichagePrincipal}
          </div>
        </div>
        <GrosFichierAfficherPopup
          {...this.state.popupProps}
          {...this.popupActions}
          />
        <GrosFichiersRenderDownloadForm
          refFormulaireDownload={this.refFormulaireDownload}/>
      </div>
    );
  }

}
