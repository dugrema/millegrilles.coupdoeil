import React from 'react';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';
import {ActionsFavoris, ActionsUpload, ActionsDownload} from './GrosFichiersActions';
import {Carnet, ActionsCarnet, AffichageCarnet} from './GrosFichiersCarnet';
import {ActionsFichiers, AffichageFichier, ListeFichiers} from './GrosFichiersFichiers';
import {ActionsCollections, AffichageCollections} from './GrosFichiersCollections';

// Composants React GrosFichiers
// import {GrosFichierAfficherPopup} from './GrosFichiersPopups';
import {ActionsNavigation,
  GrosFichiersRenderDownloadForm,
  Accueil, Entete} from './GrosFichiersNavigation.js'

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

      favoris: null,              // Document de favoris
      rapportActivite: null,      // Liste d'activite
      favorisParUuid: null,       // Dict de favoris, indexe par UUID

      carnet: new Carnet(),      // Carnet (clipboard)

      // Variables pour ecrans specifiques
      preparerUpload: null,

      downloadUrl: '/grosFichiers/local',

      uploadsCourants: [], // Upload Q du navigateur
      uploadsCompletes: [], // Uploads en attente de confirmation via MQ

    };

    // Classe d'actions web
    this.actionsNavigation = new ActionsNavigation(this);
    this.actionsUpload = new ActionsUpload(this, webSocketManager);
    this.actionsDownload = new ActionsDownload(this, webSocketManager, this.refFormulaireDownload);
    this.actionsFavoris = new ActionsFavoris(this, webSocketManager);
    this.actionsCarnet = new ActionsCarnet(this);
    this.actionsFichiers = new ActionsFichiers(this, webSocketManager);
    this.actionsCollections = new ActionsCollections(this, webSocketManager);

    // Configuration statique du composant:
    //   subscriptions: Le nom des routing keys qui vont etre ecoutees
    this.config = {
      subscriptions: [
        'noeuds.source.millegrilles_domaines_GrosFichiers.rapport.activite',
        'noeuds.source.millegrilles_domaines_GrosFichiers.favoris',
        'noeuds.source.millegrilles_domaines_GrosFichiers.fichier',
        'noeuds.source.millegrilles_domaines_GrosFichiers.collection',
      ]
    };

  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);

    // Charger les documents pour les repertoires speciaux.
    this.chargerDocument({
      requetes: [
        {'filtre': {'_mg-libelle': {'$in': [
          'rapport.activite', 'favoris',
        ]}}},
    ]
    })
    .then(docs=>{
      console.debug("Documents speciaux");
      console.debug(docs);

      // On recoit une liste de resultats, avec une liste de documents.
      let resultatDocs = docs[0];

      var documentsParInfodoc = {};
      for(let idx in resultatDocs) {
        let un_doc = resultatDocs[idx];

        // Filtrer les libelles au besoin
        let typeDoc = un_doc['_mg-libelle'];
        if(typeDoc === 'rapport.activite') {
          typeDoc = 'rapportActivite';
        } else if(typeDoc === 'favoris') {
          documentsParInfodoc['favorisParUuid'] = this.indexerFavoris(un_doc);
        }

        documentsParInfodoc[typeDoc] = un_doc;
      }

      this.setState(documentsParInfodoc);
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

  chargerDocument = (requete, domaine) => {
    if(!domaine) {
      // Domaine par defaut est une requete vers GrosFichiers
      domaine = 'requete.millegrilles.domaines.GrosFichiers';
    }

    // Retourne la promise pour chaining then/catch
    return webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      return docsRecu;  // Recuperer avec un then(resultats=>{})
    });
  }

  processMessage = (routingKey, doc) => {
    console.debug("Message de MQ: " + routingKey);

    if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.rapport.activite') {
      this.setState({
        rapportActivite: doc
      })
    } else if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.favoris') {
      let favorisParUuid = this.indexerFavoris(doc);
      this.setState({
        favoris: doc,
        favorisParUuid,
      })
    } else if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.fichier') {
      // Verifier si repertoire courant correspond
      let fichierCourant = this.state.fichierCourant;
      if(fichierCourant && fichierCourant.uuid === doc.uuid) {
        // console.debug("Update fichier courant");
        // console.debug(doc);
        this.setState({fichierCourant: doc});
      }
    } else if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.collection') {
      // Verifier si repertoire courant correspond
      let collectionCourante = this.state.collectionCourante;
      if(collectionCourante && collectionCourante.uuid === doc.uuid) {
        // console.debug("Update collection courante");
        // console.debug(doc);
        this.setState({collectionCourante: doc});
      }
    }
  }

  // Fabrique un index des favoris par UUID.
  indexerFavoris(favoris) {
    var favorisParUuid = {};
    if(favoris) {
      for(let idx in favoris.favoris) {
        let favori = favoris.favoris[idx];
        favorisParUuid[favori.uuid] = favori;
      }
    }
    return favorisParUuid;
  }

  // Affichage global pour GrosFichiers
  render() {

    let affichagePrincipal, titreEntete;
    var actionRenommer, documentuuid;

    if (this.state.afficherCarnet) {
      titreEntete = 'Carnet';
      affichagePrincipal = (
        <AffichageCarnet
          carnet={this.state.carnet}
          actionsCarnet={this.actionsCarnet}
          actionsNavigation={this.actionsNavigation}
          actionsCollections={this.actionsCollections}
          />
      );
    } else if(this.state.afficherRecherche) {
      titreEntete = 'Recherche';
      affichagePrincipal = (
        <p>Recherche ... a faire ...</p>
      );
    } else if (this.state.fichierCourant) {
      // AFficher un fichier
      actionRenommer = this.actionsFichiers.renommer;
      documentuuid = this.state.fichierCourant.uuid;
      titreEntete = this.state.fichierCourant.nom;

      affichagePrincipal = (
        <div>
          <AffichageFichier
            fichierCourant={this.state.fichierCourant}
            favorisParUuid={this.state.favorisParUuid}
            actionsFichiers={this.actionsFichiers}
            actionsDownload={this.actionsDownload}
            actionsFavoris={this.actionsFavoris}
            />
        </div>
      );
    } else if(this.state.collectionCourante){
      // Afficher une collection
      actionRenommer = this.actionsCollections.renommer;
      documentuuid = this.state.collectionCourante.uuid;
      titreEntete = this.state.collectionCourante.nom;
      if(!titreEntete) titreEntete = '';

      affichagePrincipal = (
        <AffichageCollections
          collectionCourante={this.state.collectionCourante}
          favorisParUuid={this.state.favorisParUuid}
          carnet={this.state.carnet}
          actionsCollections={this.actionsCollections}
          actionsFichiers={this.actionsFichiers}
          actionsDownload={this.actionsDownload}
          actionsFavoris={this.actionsFavoris}
          actionsNavigation={this.actionsNavigation}
         />
      );
    } else if(this.state.listeCourante){
      // Afficher une liste
      // affichagePrincipal = (<Liste />);
    } else {
      // Page d'acueil par defaut
      titreEntete = 'GrosFichiers';

      affichagePrincipal = (
        <Accueil
          rapportActivite={this.state.rapportActivite}
          favoris={this.state.favoris}
          uploadsCourants={this.state.uploadsCourants}
          uploadsCompletes={this.state.uploadsCompletes}
          favorisParUuid={this.state.favorisParUuid}
          carnet={this.state.carnet}
          actionsNavigation={this.actionsNavigation}
          actionsFavoris={this.actionsFavoris}
          actionsUpload={this.actionsUpload}
          actionsDownload={this.actionsDownload}
          actionsCarnet={this.actionsCarnet}
          />);
    }

    // Structure de l'ecran:
    // ENTETE (toujours presente)
    // Affichage Principal
    // (DOWNLOAD FORM) -- cachee, toujours presente
    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            <Entete
              titre={titreEntete}
              carnet={this.state.carnet}
              actionsNavigation={this.actionsNavigation}
              actionsUpload={this.actionsUpload}
              actionRenommer={actionRenommer} documentuuid={documentuuid}
              />
            {affichagePrincipal}
          </div>
        </div>
        <GrosFichiersRenderDownloadForm
          refFormulaireDownload={this.refFormulaireDownload}/>
      </div>
    );
  }

}
