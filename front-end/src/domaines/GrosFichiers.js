import React from 'react';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';
import {ActionsFavoris, ActionsUpload, ActionsDownload} from './GrosFichiersActions';
import {Carnet, ActionsCarnet, AffichageCarnet} from './GrosFichiersCarnet';
import {ActionsFichiers, AffichageFichier} from './GrosFichiersFichiers';
import {ActionsCollections, AffichageCollections, AffichageCollectionFigee} from './GrosFichiersCollections';
import {ActionsRecherche, AfficherRecherche} from './GrosFichiersRecherche';

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
      collectionFigeeCourante: null, // Collection figee a afficher
      fichierCourant: null,      // Fichier a afficher (si pas null)

      favoris: null,              // Document de favoris
      rapportActivite: null,      // Liste d'activite
      favorisParUuid: null,       // Dict de favoris, indexe par UUID

      carnet: new Carnet(),      // Carnet (clipboard)

      stackNavigation: ['Accueil'],        // Parcours pour bouton back

      // Variables pour ecrans specifiques
      preparerUpload: null,

      downloadUrl: '/grosFichiers/local',

      uploadsCourants: [], // Upload Q du navigateur
      uploadsCompletes: [], // Uploads en attente de confirmation via MQ

      // Placeholder en memoire pour fichiers decryptes
      // {nomFichier, contenu}
      downloadDecrypte: null,

    };

    // Classe d'actions web
    this.actionsNavigation = new ActionsNavigation(this);
    this.actionsUpload = new ActionsUpload(this, webSocketManager);
    this.actionsDownload = new ActionsDownload(this, webSocketManager, this.refFormulaireDownload);
    this.actionsFavoris = new ActionsFavoris(this, webSocketManager);
    this.actionsCarnet = new ActionsCarnet(this);
    this.actionsFichiers = new ActionsFichiers(this, webSocketManager);
    this.actionsCollections = new ActionsCollections(this, webSocketManager);
    this.actionsRecherche = new ActionsRecherche(this, webSocketManager);

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
        {
          'filtre': {'_mg-libelle': {'$in': ['favoris']}}
        },
        { // Charger les 10 plus recentes modifications
          'filtre': {'_mg-libelle': {'$in': ['collection', 'fichier']}},
          'projection': {
            "_mg-libelle": 1, "uuid": 1, "_mg-derniere-modification": 1,
            "securite": 1, "extension": 1,
            "nom": 1, "nom_fr": 1, "nom_en": 1
          },
          'hint': [
            {'_mg-derniere-modification': -1}
          ],
          'limit': 10,
        }
      ]
    })
    .then(docs=>{
      // console.debug("Documents initiaux");
      // console.debug(docs);

      // On recoit une liste de resultats, avec une liste de documents.
      const favoris = docs[0][0];
      const documentsParInfodoc = {
        favoris,
        activiteRecente: docs[1],
      };

      documentsParInfodoc.favorisParUuid = this.indexerFavoris(favoris);
      this.setState(documentsParInfodoc);
    })
    .catch(err=>{
      console.error("Erreur chargement document racine");
      console.error(err);
    });


    // S'assurer que la cle publique du maitre des cles est disponible
    if(!sessionStorage.clePubliqueMaitredescles) {
      webSocketManager.emit('demandeClePubliqueMaitredescles', {})
      .then(infoCertificat=>{
        sessionStorage.clePubliqueMaitredescles = infoCertificat.clePublique;
        sessionStorage.fingerprintMaitredescles = infoCertificat.fingerprint;
      })
      .catch(err=>{
        console.error("Erreur demande cle publique du maitredescles");
        console.error(err);
      });
    }

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

      // console.debug("Creer collection " + nomCollection + ". Ajouter a collection? " + uuidSuperCollection);

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
        // console.debug("Nouvelle collection cree: " + nomCollection);
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

      // console.debug("Renommer collection " + ancienNom + " a " + nouveauNom + ", uuid=" + uuidCollection);

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

    supprimerFichier: (event) => {
      let uuidFichier = event.currentTarget.value;

      let transaction = {
        "uuid": uuidFichier,
      }

      webSocketManager.transmettreTransaction(
        'millegrilles.domaines.GrosFichiers.supprimerFichier', transaction)
      .then(msg=>{
        // console.debug("Fichier supprime: " + uuidFichier);
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
    // console.debug("Message de MQ: " + routingKey);

    if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.rapport.activite') {
      // Utiliser ce trigger pour rafraichir les plus recents fichiers
      this.chargerPlusRecents();
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

  chargerPlusRecents = (ajout) => {
    let limit = 50, skip = 0;
    if(ajout) {
      skip = this.state.activiteRecente.length;
    } else if(this.state.activiteRecente) {
      limit = this.state.activiteRecente.length;
    }

    return this.chargerDocument({
      requetes: [
        { // Charger les 10 plus recentes modifications
          'filtre': {'_mg-libelle': {'$in': ['collection', 'fichier']}},
          'projection': {
            "_mg-libelle": 1, "uuid": 1, "_mg-derniere-modification": 1,
            "securite": 1, "extension": 1,
            "nom": 1, "nom_fr": 1, "nom_en": 1
          },
          'hint': [
            {'_mg-derniere-modification': -1}
          ],
          'limit': limit,
          'skip': skip,
        }
      ]
    })
    .then(docs=>{
      // console.debug("Documents plus recents");
      // console.debug(docs);

      // On recoit une liste de resultats, avec une liste de documents.
      var documentsParInfodoc = null;
      if(ajout) {
        documentsParInfodoc = {activiteRecente: [...this.state.activiteRecente, ...docs[0]]};
      } else {
        documentsParInfodoc = {activiteRecente: docs[0]};
      }

      this.setState(documentsParInfodoc);
    })
    .catch(err=>{
      console.error("Erreur chargement document racine");
      console.error(err);
    });
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

    let affichagePrincipal, titreEntete, sourceTitreEntete;
    var actionRenommer, documentuuid;
    var securite;

    if (this.state.afficherCarnet) {
      titreEntete = 'Carnet';
      affichagePrincipal = (
        <AffichageCarnet
          carnet={this.state.carnet}
          actionsCarnet={this.actionsCarnet}
          actionsNavigation={this.actionsNavigation}
          actionsCollections={this.actionsCollections}
          {...this.props}
          />
      );
    } else if(this.state.afficherRecherche) {
      titreEntete = 'Recherche';
      affichagePrincipal = (
        <AfficherRecherche
          carnet={this.state.carnet}
          actionsCarnet={this.actionsCarnet}
          actionsNavigation={this.actionsNavigation}
          actionsRecherche={this.actionsRecherche}
          {...this.props}
          />
      );
    } else if (this.state.fichierCourant) {
      // AFficher un fichier
      actionRenommer = this.actionsFichiers.renommer;
      documentuuid = this.state.fichierCourant.uuid;
      sourceTitreEntete = this.state.fichierCourant;
      securite = this.state.fichierCourant.securite;

      affichagePrincipal = (
        <div>
          <AffichageFichier
            fichierCourant={this.state.fichierCourant}
            favorisParUuid={this.state.favorisParUuid}
            carnet={this.state.carnet}
            actionsFichiers={this.actionsFichiers}
            actionsDownload={this.actionsDownload}
            actionsFavoris={this.actionsFavoris}
            actionsCarnet={this.actionsCarnet}
            {...this.props}
            />
        </div>
      );
    } else if(this.state.collectionCourante){
      // Afficher une collection
      actionRenommer = this.actionsCollections.renommer;
      documentuuid = this.state.collectionCourante.uuid;
      sourceTitreEntete = this.state.collectionCourante;
      securite = this.state.collectionCourante.securite;

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
          actionsCarnet={this.actionsCarnet}
          {...this.props}
         />
      );

    } else if(this.state.collectionFigeeCourante){

      // documentuuid = this.state.collectionFigeeCourante.uuid;
      sourceTitreEntete = this.state.collectionFigeeCourante;

      affichagePrincipal = (
        <AffichageCollectionFigee
          collectionCourante={this.state.collectionFigeeCourante}
          favorisParUuid={this.state.favorisParUuid}
          actionsCollections={this.actionsCollections}
          actionsDownload={this.actionsDownload}
          actionsFavoris={this.actionsFavoris}
          actionsNavigation={this.actionsNavigation}
          {...this.props}
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
          activiteRecente={this.state.activiteRecente}
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
          chargerPlusRecents={this.chargerPlusRecents}
          {...this.props}
          />);
    }

    // Structure de l'ecran:
    // ENTETE (toujours presente)
    // Affichage Principal
    // (DOWNLOAD FORM) -- cachee, toujours presente
    return (
      <div>
        <Entete
          titre={titreEntete}
          sourceTitreEntete={sourceTitreEntete}
          carnet={this.state.carnet}
          actionsNavigation={this.actionsNavigation}
          actionsUpload={this.actionsUpload}
          downloadDecrypte={this.state.downloadDecrypte}
          actionRenommer={actionRenommer}
          documentuuid={documentuuid}
          securite={securite}
          {...this.props}
          />

        {affichagePrincipal}

        <GrosFichiersRenderDownloadForm
          refFormulaireDownload={this.refFormulaireDownload}/>
      </div>
    );
  }

}
