import React from 'react';
import axios from 'axios';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';

// Composants React GrosFichiers
import {PanneauFichiersIcones} from '../mgcomponents/FichiersUI.js';
import {GrosFichierAfficherPopup} from './GrosFichiersPopups';
import {NavigationRepertoire, AffichageFichier,
  GrosFichiersRenderDownloadForm, FileUploadMonitor} from './GrosFichiersNavigation.js'

export class GrosFichiers extends React.Component {

  constructor(props) {
    super(props);
    this.refFormulaireDownload = React.createRef();
    // this.download = this.download.bind(this);

    this.uploadEnCours = false;  // True quand un upload est en marche
    this.uploadRetryTimer = null;  // Timer avant prochain essaie d'upload

    this.state = {

      // Variables pour navigation des repertoires/fichiers
      repertoiresZones: {
        repertoirePrive: null,     // Repertoire des documents prives et proteges
        repertoireSecure: null,    // Repertoire des documents secures
        repertoireCorbeille: null, // Repertoire des documents supprimes
        repertoireOrphelins: null, // Repertoire des documents orphelins

        zoneCourante: null,  // 1.public, 2.prive, 4.secure, corbeille, orphelins
      },

      repertoireCourant: null,  // Repertoire a afficher (si pas null et fichier null)
      fichierCourant: null,     // Fichier a afficher (si pas null)

      // Liste d'elements selectionnes pour operation
      elementsCopierDeplacer: null,
      operationCopierDeplacer: null,

      // Popups a afficher
      popupProps: {
        popupRenommerFichierValeurs: null,
        popupDeplacerFichierValeurs: null,

        popupCreerRepertoireValeurs: null,
        popupRenommerRepertoireValeurs: null,
        popupDeplacerRepertoireValeurs: null,
      },

      // Variables pour ecrans specifiques
      preparerUpload: null,

      downloadUrl: '/grosFichiers/local',

      uploadsCourants: [], // Upload Q du navigateur
      uploadsCompletes: [], // Uploads en attente de confirmation via MQ

    };

  }

  // Actions utiliees uniquement dans les pop-ups
  popupActions = {

    // Creer un repertoire
    soumettreCreerRepertoire: (event) => {
      let uuidRepertoireParent = this.state.popupProps.popupCreerRepertoireValeurs.uuidRepertoireParent;
      let formulaire = event.currentTarget.form;
      let nomRepertoire = formulaire.nomrepertoire.value;

      console.debug("Creer repertoire " + nomRepertoire + " sous " + uuidRepertoireParent);
      // Transmettre message a MQ pour renommer le fichier
      let transaction = {
        "parent_id": uuidRepertoireParent,
        "nom": nomRepertoire,
      }
      webSocketManager.transmettreTransaction(
        'millegrilles.domaines.GrosFichiers.creerRepertoire', transaction)
      .then(msg=>{
        // Mettre en evidence le nouveau repertoire lorsqu'il arrivera a l'ecran.
        console.debug("Nouveau repertoire cree: " + nomRepertoire);
      }).catch(err=>{
        console.error("Erreur creation repertoire");
        console.error(err);
      });

      this.setState({popupProps: {popupCreerRepertoireValeurs: null}});
    },
    annulerCreerRepertoire: (event) => {
      this.setState({popupProps: {popupCreerRepertoireValeurs: null}});
    },

    // Changer nom d'un repertoire
    soumettreChangerNomRepertoire: (event) => {
      let formulaire = event.currentTarget.form;
      let nouveauNom = formulaire.nouveauNom.value;
      let ancienNom = this.state.popupProps.popupRenommerRepertoireValeurs.nom;
      let uuidRepertoire = this.state.popupProps.popupRenommerRepertoireValeurs.uuidRepertoire;

      console.debug("Renommer repertoire " + ancienNom + " a " + nouveauNom + ", uuid=" + uuidRepertoire);

      if(nouveauNom !== ancienNom) {
        // Transmettre message a MQ pour renommer le fichier
        let transaction = {
          "repertoire_uuid": uuidRepertoire,
          "nom": nouveauNom,
        }
        webSocketManager.transmettreTransaction(
          'millegrilles.domaines.GrosFichiers.renommerRepertoire', transaction);
      }

      this.setState({popupRenommerRepertoireValeurs: null})
    },
    annulerChangerNomRepertoire: (event) => {
      this.setState({popupRenommerRepertoireValeurs: null})
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

    supprimerRepertoire: (event) => {
      let uuidRepertoire = event.currentTarget.value;

      let transaction = {
        "repertoire_uuid": uuidRepertoire,
      }
      webSocketManager.transmettreTransaction(
        'millegrilles.domaines.GrosFichiers.supprimerRepertoire', transaction)
      .then(msg=>{
        console.debug("Repertoire supprime " + uuidRepertoire);
        let repertoireCourant = this.state.repertoireCourant;
        if(repertoireCourant.repertoire_uuid === uuidRepertoire) {
          // On va popper vers le repertoire parent
          this.changerRepertoire(repertoireCourant.parent_id);
        }
      })
      .catch(err=>{
        console.error("Erreur suppression repertoire " + uuidRepertoire);
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
    upload: repertoireDestination => {
      console.debug("Upload vers " + repertoireDestination);
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

    telecharger: ({uuidfichier, fuuid, securite, opts}) => {
      // Trouver fichier dans information repertoire
      let infoRepertoire = this.state.repertoireCourant || this.state.repertoireRacine;
      console.debug(infoRepertoire);
      var fichier = infoRepertoire.fichiers[uuidfichier];
      console.debug("Telecharger fichier uuid: " + uuidfichier + ": " + fichier);
      if(!fichier) {
        throw new Error("Erreur fichier inconnu: " + uuidfichier)
      }
      if(!fuuid) {
        fuuid = fichier.fuuid_v_courante;
      }
      if(!securite) {
        securite = fichier.securite;
      }
      let nomFichier = fichier.nom;
      let contentType = fichier.mimetype;

      console.debug("1. Bouton clique pour fichier " + nomFichier);
      let form = this.refFormulaireDownload.current;
      let downloadUrl = this.state.downloadUrl;

      console.debug("2. fuuide: " + fuuid);
      webSocketManager.demanderTokenTransfert()
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

    },

    copier: (repertoireDestination) => {
      console.debug("Copier vers " + repertoireDestination);
      let selection = this.state.elementsCopierDeplacer;
      for(var uuid in selection) {
        let infoitem = selection[uuid];
        let typeitem = infoitem.type;
        console.debug(typeitem + " " + uuid);
      }
    },

    deplacer: (repertoireDestination) => {
      console.debug("Deplacer vers " + repertoireDestination);
      let selection = this.state.elementsCopierDeplacer;
      for(var uuid in selection) {
        let infoitem = selection[uuid];
        let typeitem = infoitem.type;

        if(typeitem === 'fichier') {
          var transaction = {
            "uuid": uuid,
            "repertoire_uuid": repertoireDestination,
          }
          webSocketManager.transmettreTransaction(
            'millegrilles.domaines.GrosFichiers.deplacerFichier', transaction);
        } else if(typeitem === 'repertoire') {

        }

      }

      // L'operation deplacement ne peut pas etre repetee.
      this.setState({
        elementsCopierDeplacer: null,
        operationCopierDeplacer: null,
      })

    },

    supprimer: (selection) => {
      console.debug("Supprimer");
      for(var uuid in selection) {
        let infoitem = selection[uuid];
        let typeitem = infoitem.type;
        console.debug(typeitem + " " + uuid);

        if(typeitem === 'fichier') {
          let transaction = {
            "uuid": uuid,
          }

          webSocketManager.transmettreTransaction(
            'millegrilles.domaines.GrosFichiers.supprimerFichier', transaction)
          .then(msg=>{
            console.debug("Fichier supprime: " + uuid);
          }).catch(err=>{
            console.error("Erreur suppression fichier");
            console.error(err);
          });
        } else if(typeitem === 'repertoire') {
          console.warn("Suppression repertoire pas encore supportee");
        }
      }
    },

    activerCopier: selection => {
      this.setState({
        elementsCopierDeplacer: selection,
        operationCopierDeplacer: 'copier',
      });
    },

    activerDeplacer: selection => {
      this.setState({
        elementsCopierDeplacer: selection,
        operationCopierDeplacer: 'deplacer',
      });
    },

    doubleclickRepertoire: (event) => {
      let uuidRepertoire = event.currentTarget.dataset.repertoireuuid;
      console.debug("Double click repertoire " + uuidRepertoire);
      this.changerRepertoire(uuidRepertoire);
    },

    doubleclickFichier: (event) => {
      let uuidFichier = event.currentTarget.dataset.fichieruuid;
      console.debug("Double click fichier " + uuidFichier);
      this.afficherProprietesFichier(uuidFichier);
    },

    ouvrir: (uuid, type) => {
      console.debug("Ouvrir " + type + " " + uuid);
      if(type === 'repertoire') {
        this.changerRepertoire(uuid);
      } else if(type === 'fichier') {
        this.afficherProprietesFichier(uuid);
      }
    },

  }

  repertoireActions = {
    afficherRepertoire: event => {
      let bouton = event.currentTarget;
      let uuidRepertoire = bouton.value;
      this.changerRepertoire(uuidRepertoire);
    },

    deplacerSelection: (event) => {
      let selection = this.state.selection;
      let uuidRepertoireDestination = event.currentTarget.value;
      console.debug("Deplacer selection vers " + uuidRepertoireDestination);
      console.debug(selection);

      for(var uuid in selection) {
        let info = selection[uuid];
        let type = info.type;
        if(type === 'fichier') {
          var transaction = {
            "uuid": uuid,
            "repertoire_uuid": uuidRepertoireDestination,
          }
          webSocketManager.transmettreTransaction(
            'millegrilles.domaines.GrosFichiers.deplacerFichier', transaction);
        } else if(type === 'repertoire') {

        }
      }

      this.setState({'selection': {}}); // Clear
    },
    changerRepertoireSpecial: event => {
      let repertoireLabel = event.currentTarget.value;
      console.debug("Switch repertoire base: " + repertoireLabel);
      let repertoire;
      if(repertoireLabel === 'Prive') {
        repertoire = this.state.repertoiresZones.repertoirePrive;
      } else if(repertoireLabel === 'Corbeille') {
        repertoire = this.state.repertoiresZones.repertoireCorbeille;
      } else if(repertoireLabel === 'Orphelins') {
        repertoire = this.state.repertoiresZones.repertoireOrphelins;
      }

      if(repertoire) {
        this.setState({
          repertoireZoneCourante: repertoire,
          repertoireCourant: repertoire,
        });
      } else {
        console.log("Aucun repertoire special trouve");
        console.log(this.state.repertoiresZones);
      }
    }
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
      'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire',
      'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.racine',
    ]
  };

  chargerDocument = (requete, domaine) => {
    if(!domaine) {
      // Domaine par defaut est une requete vers SenseursPassifs
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

  repertoireZoneCourante() {
    let zoneCourante = this.state.repertoiresZones.zoneCourante;
    console.debug("Zone courante: " + zoneCourante);
    console.debug(this.state.repertoiresZones);
    let repertoireZone = null;
    if(!zoneCourante) {
      console.error("Erreur, zone courante pas settee. On met prive par defaut");
      repertoireZone = this.state.repertoiresZones.repertoirePrive;
    } else {
      repertoireZone = this.state.repertoiresZones.zoneCourante;
    }

    return repertoireZone;
  }

  changerRepertoire(uuidRepertoire) {
    let repertoireZoneCourante = this.repertoireZoneCourante();
    // console.debug("Repertoire zone courante: ");
    // console.debug(repertoireZoneCourante);
    if(uuidRepertoire && uuidRepertoire !== repertoireZoneCourante.repertoire_uuid) {
      this.chargerDocument({
        requetes: [{'filtre': {'repertoire_uuid': uuidRepertoire, '_mg-libelle': 'repertoire'}}]
      })
      .then(resultats=>{
        // console.debug("Resultats afficherRepertoire");
        // console.debug(resultats);
        let repertoire = resultats[0][0];
        this.setState({repertoireCourant: repertoire});
      })
      .catch(err=>{
        console.error("Erreur chargement repertoire " + uuidRepertoire);
        console.error(err);
      })
    } else {
      // Retour au repertoire racine
      this.setState({repertoireCourant: repertoireZoneCourante})
    }
  }

  retourRepertoireFichier = (event) => {
    this.setState({'fichierCourant': null});
  }

  afficherPopupCreerRepertoire = repertoireDestination => {
    this.setState({popupProps: {popupCreerRepertoireValeurs: {
      uuidRepertoireParent: repertoireDestination
    }}});
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


  deplacerRepertoire = (event) => {

  }

  processMessage = (routingKey, doc) => {
    console.debug("Message de MQ: " + routingKey);

    if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.racine' ||
       routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.corbeille' ||
       routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.orphelins') {

      // console.debug("Update repertoire racine");
      // console.debug(doc);
      let update = {};
      if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.racine') {
        update['repertoirePrive'] = doc;
      } else if (routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.corbeille') {
        update['repertoireCorbeille'] = doc;
      } else if (routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.orphelins') {
        update['repertoireOrphelins'] = doc;
      }

      var newState = {
        repertoiresZones: {
          ...this.state.repertoireZones,
          ...update,
        }
      }

      // Verifier si le repertoire courant est ce meme repertoire qu'on vient de recevoir
      if(this.state.repertoireCourant && doc.repertoire_uuid === this.state.repertoireCourant.repertoire_uuid) {
        newState.repertoireCourant = doc;
      }

      this.setState(newState);
    } else if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire') {
      // Verifier si repertoire courant correspond
      let repertoireCourant = this.state.repertoireCourant;
      if(repertoireCourant && repertoireCourant.repertoire_uuid === doc.repertoire_uuid) {
        console.debug("Update repertoire courant");
        console.debug(doc);
        this.setState({repertoireCourant: doc});
      }
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
      // On veut juste conserver le 1er resultat de la 1ere (seule) requete.
      // Mettre le repertoire racine comme repertoire courant.
      const repertoiresSpeciaux = docs[0];
      let repertoirePrive;
      let zones = {};
      for(let idx in repertoiresSpeciaux) {
        let repertoire = repertoiresSpeciaux[idx];
        let mg_libelle = repertoire['_mg-libelle'];
        if(mg_libelle === 'repertoire.racine') {
          repertoirePrive = repertoire;
          zones['repertoirePrive'] = repertoire;
        } else if(mg_libelle === 'repertoire.corbeille') {
          zones['repertoireCorbeille'] = repertoire;
        } else if(mg_libelle === 'repertoire.orphelins') {
          zones['repertoireOrphelins'] = repertoire;
        }
      }

      this.setState({
        repertoiresZones: {
          ...this.state.repertoiresZones,
          ...zones,
        },
        repertoireCourant: repertoirePrive,
      })
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
            retourRepertoireFichier={this.retourRepertoireFichier}
            {...this.fichierActions}
            />
        </div>
      )
    } else if(this.state.repertoireCourant){
      affichagePrincipal = (
        <div>
          <NavigationRepertoire
            repertoireCourant={this.state.repertoireCourant}
            uploadActions={this.uploadActions}

            {...this.state.repertoiresZones}
            downloadUrl={this.state.downloadUrl}

            afficherPopupCreerRepertoire={this.afficherPopupCreerRepertoire}
            {...this.repertoireActions}

            />

          {uploadProgress}

          <PanneauFichiersIcones
            repertoire={this.state.repertoireCourant}
            operationCopierDeplacer={this.state.operationCopierDeplacer}

            creerRepertoire={this.afficherPopupCreerRepertoire}
            renommer={this.afficherPopupRenommer}
            {...this.fichierActions}
            />
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
