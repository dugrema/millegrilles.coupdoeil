import React from 'react';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';

// Composants React GrosFichiers
import {PanneauFichiersIcones} from '../mgcomponents/FichiersUI.js';
import {GrosFichierAfficherPopup} from './GrosFichiersPopups';
import {Accueil, NavigationRepertoire, AffichageFichier,
  GrosFichiersRenderDownloadForm} from './GrosFichiersNavigation.js'

export class GrosFichiers extends React.Component {

  constructor(props) {
    super(props);
    this.refFormulaireDownload = React.createRef();
    // this.download = this.download.bind(this);

    this.state = {

      // Variables pour navigation des repertoires/fichiers
      repertoireRacine: null,   // Par defaut, on affiche la racine
      repertoireCourant: null,  // Repertoire a afficher (si pas null et fichier null)
      fichierCourant: null,     // Fichier a afficher (si pas null)

      // Liste d'elements selectionnes pour operation
      elementsCopierDeplacer: null,
      operationCopierDeplacer: null,

      // Popups a afficher
      popupRenommerFichierValeurs: null,
      popupDeplacerFichierValeurs: null,

      popupCreerRepertoireValeurs: null,
      popupRenommerRepertoireValeurs: null,
      popupDeplacerRepertoireValeurs: null,

      // Variables pour ecrans specifiques
      preparerUpload: null,

      downloadUrl: '/grosFichiers/local',
    };

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

    console.debug("Transmettre requete");
    console.debug(requete);

    // Retourne la promise pour chaining then/catch
    return webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      console.debug("Reponse requete, documents recu");
      console.debug(docsRecu);
      return docsRecu;  // Recuperer avec un then(resultats=>{})
    });
  }

  telecharger = uuidfichier => {
    // Trouver fichier dans information repertoire
    let infoRepertoire = this.state.repertoireCourant || this.state.repertoireRacine;
    console.debug(infoRepertoire);
    var fichier = infoRepertoire.fichiers[uuidfichier];
    console.debug("Telecharger fichier uuid: " + uuidfichier + ": " + fichier);
    if(!fichier) {
      throw new Error("Erreur fichier inconnu: " + uuidfichier)
    }
    let fuuid = fichier.fuuid_v_courante;
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

      console.debug("2. Submit preparation, download " + form.action + ", recu token " + form.authtoken.value);
      form.submit(); // Token pret, submit.

    })
    .catch(err=>{
      console.error("Erreur preparation download");
      console.error(err);
    })

  }

  upload = repertoireDestination => {
    console.debug("Upload vers " + repertoireDestination);
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

  changerRepertoire(uuidRepertoire) {
    if(uuidRepertoire && uuidRepertoire !== this.state.repertoireRacine.repertoire_uuid) {
      this.chargerDocument({
        requetes: [{'filtre': {'repertoire_uuid': uuidRepertoire, '_mg-libelle': 'repertoire'}}]
      })
      .then(resultats=>{
        console.debug("Resultats afficherRepertoire");
        console.debug(resultats);
        let repertoire = resultats[0][0];
        this.setState({repertoireCourant: repertoire});
      })
      .catch(err=>{
        console.error("Erreur chargement repertoire " + uuidRepertoire);
        console.error(err);
      })
    } else {
      // Retour au repertoire racine
      this.setState({repertoireCourant: null})
    }
  }

  activerCopier = selection => {
    this.setState({
      elementsCopierDeplacer: selection,
      operationCopierDeplacer: 'copier',
    });
  }

  activerDeplacer = selection => {
    this.setState({
      elementsCopierDeplacer: selection,
      operationCopierDeplacer: 'deplacer',
    });
  }

  doubleclickRepertoire = (event) => {
    let uuidRepertoire = event.currentTarget.dataset.repertoireuuid;
    console.debug("Double click repertoire " + uuidRepertoire);
    this.changerRepertoire(uuidRepertoire);
  }

  doubleclickFichier = (event) => {
    let uuidFichier = event.currentTarget.dataset.fichieruuid;
    console.debug("Double click fichier " + uuidFichier);
    this.afficherProprietesFichier(uuidFichier);
  }

  copier = (repertoireDestination) => {
    console.debug("Copier vers " + repertoireDestination);
    let selection = this.state.elementsCopierDeplacer;
    for(var uuid in selection) {
      let infoitem = selection[uuid];
      let typeitem = infoitem.type;
      console.debug(typeitem + " " + uuid);
    }
  }

  deplacer = (repertoireDestination) => {
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

  }

  supprimer = (selection) => {
    console.debug("Supprimer");
    for(var uuid in selection) {
      let infoitem = selection[uuid];
      let typeitem = infoitem.type;
      console.debug(typeitem + " " + uuid);
    }
  }

  ouvrir = (uuid, type) => {
    console.debug("Ouvrir " + type + " " + uuid);
    if(type === 'repertoire') {
      this.changerRepertoire(uuid);
    } else if(type === 'fichier') {
      this.afficherProprietesFichier(uuid);
    }
  }

  afficherRepertoire = event => {
    let bouton = event.currentTarget;
    let uuidRepertoire = bouton.value;
    this.changerRepertoire(uuidRepertoire);
  }

  retourRepertoireFichier = (event) => {
    this.setState({'fichierCourant': null});
  }

  afficherPopupCreerRepertoire = repertoireDestination => {
    this.setState({popupCreerRepertoireValeurs: {
      uuidRepertoireParent: repertoireDestination
    }});
  }

  soumettreCreerRepertoire = (event) => {
    let uuidRepertoireParent = this.state.popupCreerRepertoireValeurs.uuidRepertoireParent;
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

    this.setState({popupCreerRepertoireValeurs: null});
  }

  annulerCreerRepertoire = (event) => {
    this.setState({popupCreerRepertoireValeurs: null});
  }

  deplacerRepertoire = (event) => {

  }

  afficherPopupRenommer = (uuid, type) => {
    console.debug("Renommer " + type + ", uuid " + uuid);
    let repertoireCourant = this.state.repertoireCourant || this.state.repertoireRacine;

    if(type === 'fichier') {
      let nomFichier = repertoireCourant.fichiers[uuid].nom;
      this.setState({popupRenommerFichierValeurs: {
        nom: nomFichier,
        uuidFichier: uuid,
      }});
    } else if(type === 'repertoire') {
      let nomRepertoire = repertoireCourant.repertoires[uuid].nom;
      this.setState({popupRenommerRepertoireValeurs: {
        nom: nomRepertoire,
        uuidRepertoire: uuid,
      }});
    }

  }

  soumettreChangerNomRepertoire = (event) => {
    let formulaire = event.currentTarget.form;
    let nouveauNom = formulaire.nouveauNom.value;
    let ancienNom = this.state.popupRenommerRepertoireValeurs.nom;
    let uuidRepertoire = this.state.popupRenommerRepertoireValeurs.uuidRepertoire;

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
  }

  annulerChangerNomRepertoire = (event) => {
    this.setState({popupRenommerRepertoireValeurs: null})
  }

  supprimerRepertoire = (event) => {
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
  }

  deplacerSelection = (event) => {
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
  }

  supprimerFichier = (event) => {
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
  }

  processMessage = (routingKey, doc) => {
    console.debug("Message de MQ: " + routingKey);

    if(routingKey === 'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire.racine') {
      console.debug("Update repertoire racine");
      console.debug(doc);
      this.setState({repertoireRacine: doc});
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

  soumettreChangerNomFichier = (event) => {
    let formulaire = event.currentTarget.form;
    let nouveauNom = formulaire.nouveauNom.value;
    let ancienNom = this.state.popupRenommerFichierValeurs.nom;
    let uuidFichier = this.state.popupRenommerFichierValeurs.uuidFichier;

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

    this.setState({popupRenommerFichierValeurs: null});
  }

  annulerChangerNomFichier = (event) => {
    this.setState({popupRenommerFichierValeurs: null});
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);

    // Charger le document repertoire.racine.
    this.chargerDocument({
      requetes: [{'filtre': {'_mg-libelle': 'repertoire.racine'}}]
    })
    .then(docs=>{
      // On recoit une liste de resultats, avec une liste de documents.
      // On veut juste conserver le 1er resultat de la 1ere (seule) requete.
      this.setState({repertoireRacine: docs[0][0]})
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
    let affichagePrincipal;
    if (this.state.fichierCourant) {
      affichagePrincipal = (
        <div>
          <AffichageFichier
            fichierCourant={this.state.fichierCourant}
            downloadUrl={this.state.downloadUrl}
            retourRepertoireFichier={this.retourRepertoireFichier}
            afficherChangerNomFichier={this.afficherChangerNomFichier}
            />
        </div>
      )
    } else if(this.state.repertoireCourant || this.state.repertoireRacine){
      var repertoireCourant = this.state.repertoireCourant;
      if(!repertoireCourant) {
        repertoireCourant = this.state.repertoireRacine;
      }

      affichagePrincipal = (
        <div>
          <NavigationRepertoire
            repertoireCourant={repertoireCourant}
            downloadUrl={this.state.downloadUrl}
            afficherChangerNom={this.afficherChangerNom}
            afficherPopupCreerRepertoire={this.afficherPopupCreerRepertoire}
            afficherRepertoire={this.afficherRepertoire}
            afficherPopupRenommerRepertoire={this.afficherPopupRenommerRepertoire}
            deplacerSelection={this.deplacerSelection}
            />
          <PanneauFichiersIcones
            repertoire={repertoireCourant}
            doubleclickRepertoire={this.doubleclickRepertoire}
            doubleclickFichier={this.doubleclickFichier}
            copier={this.copier}
            deplacer={this.deplacer}
            supprimer={this.supprimer}
            ouvrir={this.ouvrir}
            telecharger={this.telecharger}
            upload={this.upload}
            activerCopier={this.activerCopier}
            activerDeplacer={this.activerDeplacer}
            operationCopierDeplacer={this.state.operationCopierDeplacer}
            creerRepertoire={this.afficherPopupCreerRepertoire}
            renommer={this.afficherPopupRenommer}
            />

        </div>
      )
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            <h1>Domaine GrosFichiers</h1>
            <div>
              <Accueil/>
              {affichagePrincipal}
            </div>
          </div>
        </div>
        <GrosFichierAfficherPopup />
        <GrosFichiersRenderDownloadForm />
      </div>
    );
  }

}
