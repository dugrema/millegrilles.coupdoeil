import React from 'react';
import axios from 'axios';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';
import {dateformatter, numberformatter} from '../formatters'

// Composants React GrosFichiers
// import {GrosFichierAfficherPopup} from './GrosFichiersPopups';
import {AffichageFichier, NavigationCollection, FileUploadSection,
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

  // Configuration statique du composant:
  //   subscriptions: Le nom des routing keys qui vont etre ecoutees
  config = {
    subscriptions: [
    ]
  };

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

  retourFichier = event => {
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

  renderEntete() {
    return(
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">

          <div className="w3-row-padding">
            <div className="w3-col m1 bouton-home"><i className="fa fa-home fa-2x"/></div>
            <div className="w3-col m10 entete-titre">
              <h1>GrosFichiers</h1>
            </div>
            <div className="w3-col m1">
              <FileUploadSection />
            </div>
          </div>

          <div className="w3-row-padding">
            <div className="w3-col m11 recherche">
              <input type="text" name="recherche"/>
            </div>
            <div className="w3-col m1 recherche">
              <i className="fa fa-search"/>
            </div>
          </div>

        </div>
      </div>
    );
  }

  renderUploadProgress() {
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
    return uploadProgress;
  }

  renderDetailFichier() {
    return (
      <div>
        <AffichageFichier
          fichierCourant={this.state.fichierCourant}
          downloadUrl={this.state.downloadUrl}
          retourFichier={this.retourFichier}
          {...this.fichierActions}
          />
      </div>
    );
  }

  renderDetailCollection() {
    return (
      <div>
        <NavigationCollection
          collectionCourante={this.state.collectionCourante}
          uploadActions={this.uploadActions}

          {...this.state.repertoiresZones}
          downloadUrl={this.state.downloadUrl}

          afficherPopupCreerRepertoire={this.afficherPopupCreerRepertoire}
          {...this.repertoireActions}

          />
      </div>
    );
  }

  renderDetailListe() {
    return (
      <div>
        <p>Une liste</p>
      </div>
    );
  }

  renderAccueil() {
    let fichiers = [
      {'nom': 'fichier1.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368457, 'uuid': 'a', '_mg-libelle': 'fichier'},
      {'nom': 'fichier2.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368456, 'uuid': 't', '_mg-libelle': 'fichier'},
      {'nom': 'fichier3.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574142382, 'uuid': 's', '_mg-libelle': 'fichier'},
      {'nom': 'fichier4.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368454, 'uuid': 'r', '_mg-libelle': 'fichier'},
      {'nom': 'fichier5.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368453, 'uuid': 'w', '_mg-libelle': 'fichier'},
      {'nom': 'fichier6.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368452, 'uuid': 'v', '_mg-libelle': 'fichier'},
      {'nom': 'fichier7.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1560803662, 'uuid': 'x', '_mg-libelle': 'fichier'},
      {'nom': 'fichier8.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368450, 'uuid': 'y', '_mg-libelle': 'fichier'},
      {'nom': 'Collection 9', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368449, 'uuid': 'z', '_mg-libelle': 'collection'},
      {'nom': 'fichier10.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368448, 'uuid': 'd', '_mg-libelle': 'fichier'},
      {'nom': 'fichier11.txt', 'commentaires': "une commentaration", '_mg-derniere-modification': 1574368447, 'uuid': 'c', '_mg-libelle': 'fichier'},
    ];
    let activiteRecente = {
      'nom': 'Activite recente',
      'fichiers': fichiers,
    }
    return (
      <div>
        {this.renderSectionRecherche()}
        {this.renderListeListes()}
        {this.renderListeFichiers(activiteRecente)}
      </div>
    );
  }

  renderSectionRecherche() {

    let libelles = ['libelle1', 'libelle2', 'libelle3', 'libelle4'];

    let libellesRendered = [];
    for(let idx in libelles) {
      let libelle = libelles[idx];
      libellesRendered.push(
        <button key={libelle}>{libelle}</button>
      );
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding formulaire">
          <div className="w3-row-padding">
            <h2 className="w3-col m12">Recherche de fichiers</h2>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m12 liste-libelles">
              {libellesRendered}
            </div>
          </div>
          <div className="w3-row-padding recherche">
            <div className="w3-col m12">
              <input type="text" name="recherche_avancee" />
            </div>
          </div>
          <div className="w3-row-padding recherche">
            <div className="w3-col m12 buttonBar">
              <button type="button" name="chercher">Chercher</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affiche une liste paginee de fichiers
  renderListeListes() {

    let listes = ['liste1', 'liste2', 'liste3', 'liste4'];

    let listesRendered = [];
    for(let idx in listes) {
      let liste = listes[idx];
      listesRendered.push(
        <button key={liste}>{liste}</button>
      );
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">
          <div className="w3-row-padding">
            <h2 className="w3-col m12">Liste de listes de fichiers</h2>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m12 liste-libelles">
              {listesRendered}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderListeFichiers(liste) {

    let fichiersRendered = [];

    var maintenant = Math.floor(Date.now()/1000);

    for(let idx in liste.fichiers) {
      let fichier = liste.fichiers[idx];

      let icone = (<i className="fa fa-file-o"/>);
      if(fichier['_mg-libelle'] == 'collection') {
        icone = (<i className="fa fa-folder-o"/>);
      }

      let dateChangement = dateformatter.format_datetime(fichier['_mg-derniere-modification']);
      let dernierChangementDepuis = maintenant - fichier['_mg-derniere-modification'];
      dernierChangementDepuis = Math.floor(dernierChangementDepuis / 60);

      let dernierChangementRendered;
      if(dernierChangementDepuis < 60) {
        dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} minutes</span>);
      } else if (dernierChangementDepuis < 1440) {
        dernierChangementDepuis = Math.floor(dernierChangementDepuis / 60);
        dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} heures</span>);
      } else if (dernierChangementDepuis < 43200) {
        dernierChangementDepuis = Math.floor(dernierChangementDepuis / 1440);
        dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} jours</span>);
      } else if (dernierChangementDepuis < 525600) {
        dernierChangementDepuis = Math.floor(dernierChangementDepuis / 43200);
        dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} mois</span>);
      } else {
        dernierChangementDepuis = Math.floor(dernierChangementDepuis / 525600);
        dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} annee(s)</span>);
      }

      fichiersRendered.push(
        <div key={fichier.uuid} className="w3-row-padding">

          <div className="w3-col m4">
            {icone} {fichier.nom}
          </div>

          <div className="w3-col m6">
            {fichier.commentaires}
          </div>

          <div className="w3-col m2">
            {dernierChangementRendered}
          </div>

        </div>
      );
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">
          <div className="w3-row-padding">
            <h2>{liste.nom}</h2>
          </div>
          <div className="liste-fichiers">
            {fichiersRendered}
          </div>
        </div>
      </div>
    );
  }

  // Affichage global pour GrosFichiers
  render() {

    let affichagePrincipal;
    if (this.state.fichierCourant) {
      // AFficher un fichier
      affichagePrincipal = this.renderDetailFichier();
    } else if(this.state.collectionCourante){
      // Afficher une collection
      affichagePrincipal = this.renderDetailCollection();
    } else if(this.state.listeCourante){
      // Afficher une liste
      affichagePrincipal = this.renderDetailListe();
    } else {
      // Page d'acueil par defaut
      affichagePrincipal = this.renderAccueil();
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            {this.renderEntete()}
            {affichagePrincipal}
          </div>
        </div>
        <GrosFichiersRenderDownloadForm
          refFormulaireDownload={this.refFormulaireDownload}/>
      </div>
    );
  }

}
