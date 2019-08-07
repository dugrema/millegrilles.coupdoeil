import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';

export class GrosFichiers extends React.Component {

  state = {

    // Variables pour navigation des repertoires/fichiers
    repertoireRacine: null,   // Par defaut, on affiche la racine
    repertoireCourant: null,  // Repertoire a afficher (si pas null et fichier null)
    fichierCourant: null,     // Fichier a afficher (si pas null)

    selection: {},          // Liste d'elements selectionnes pour operation

    // Popups a afficher
    popupRenommerFichierValeurs: null,
    popupDeplacerFichierValeurs: null,

    popupCreerRepertoireValeurs: null,
    popupRenommerRepertoireValeurs: null,
    popupDeplacerRepertoireValeurs: null,

    // Variables pour ecrans specifiques
    preparerUpload: null,

    downloadUrl: 'https://192.168.1.110:3001/grosFichiers/local',
  };

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

  selectionnerFichier = (event) => {
    let uuidFichier = event.currentTarget.value;
    let dict = {}
    dict[uuidFichier] = {'type': 'fichier'};

    this.setState(
      {'selection': Object.assign(this.state.selection, dict)},
      ()=>{console.debug("Fichier selectionne: " + uuidFichier)}
    );
  }

  selectionnerRepertoire = (event) => {
    let uuidRepertoire = event.currentTarget.value;
    let dict = {};
    dict[uuidRepertoire] = {'type': 'repertoire'};

    this.setState(
      {'selection': Object.assign(this.state.selection, dict)},
      ()=>{console.debug("Repertoire selectionne: " + uuidRepertoire)}
    );
  }

  selectionClear = (event) => {
    this.setState({'selection': {}}); // Effacer selection precedente
  }

  afficherProprietesFichier = (event) => {
    let bouton = event.currentTarget;
    let uuidFichier = bouton.value;

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

  afficherRepertoire = event => {
    let bouton = event.currentTarget;
    let uuidRepertoire = bouton.value;
    this.changerRepertoire(uuidRepertoire);
  }

  retourRepertoireFichier = (event) => {
    this.setState({'fichierCourant': null});
  }

  afficherPopupCreerRepertoire = (event) => {
    let uuidRepertoireParent = event.currentTarget.dataset.uuidrepertoireparent;
    this.setState({popupCreerRepertoireValeurs: {
      uuidRepertoireParent: uuidRepertoireParent
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

  afficherPopupRenommerRepertoire = (event) => {
    let nomRepertoire = event.currentTarget.value;
    let uuidRepertoire = event.currentTarget.dataset.uuidrepertoire;
    console.debug("Renommer repertoire " + nomRepertoire + ", uuid " + uuidRepertoire);

    this.setState({popupRenommerRepertoireValeurs: {
      nom: nomRepertoire,
      uuidRepertoire: uuidRepertoire,
    }});

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

  afficherPopup() {
    if(this.state.popupRenommerFichierValeurs) {
      return (
        <PopupChangerNom
          valeur={this.state.popupRenommerFichierValeurs}
          soumettre={this.soumettreChangerNomFichier}
          annuler={this.annulerChangerNomFichier}
          />
      );
    } else if(this.state.popupCreerRepertoireValeurs) {
      return (
        <PopupCreerRepertoire
          soumettre={this.soumettreCreerRepertoire}
          annuler={this.annulerCreerRepertoire}
          />
      );
    } else if(this.state.popupRenommerRepertoireValeurs) {
      return (
        <PopupRenommerRepertoire
          valeur={this.state.popupRenommerRepertoireValeurs}
          soumettre={this.soumettreChangerNomRepertoire}
          annuler={this.annulerChangerNomRepertoire}
          />
      );
    }


    return null;
  }

  afficherChangerNomFichier = (event) => {
    let nomFichier = event.currentTarget.value;
    let uuidFichier = event.currentTarget.dataset.uuidfichier;
    console.debug("Renommer Fichier " + nomFichier + ", uuid " + uuidFichier);

    this.setState({popupRenommerFichierValeurs: {
      nom: nomFichier,
      uuidFichier: uuidFichier,
    }});
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
            creerRepertoire={this.creerRepertoire}
            supprimerRepertoire={this.supprimerRepertoire}
            afficherChangerNom={this.afficherChangerNom}
            afficherPopupCreerRepertoire={this.afficherPopupCreerRepertoire}
            afficherRepertoire={this.afficherRepertoire}
            afficherPopupRenommerRepertoire={this.afficherPopupRenommerRepertoire}
            deplacerSelection={this.deplacerSelection}
            />
          <ContenuRepertoire
            repertoireCourant={repertoireCourant}
            downloadUrl={this.state.downloadUrl}
            afficherProprietesFichier={this.afficherProprietesFichier}
            afficherChangerNomFichier={this.afficherChangerNomFichier}
            supprimerFichier={this.supprimerFichier}
            selectionnerFichier={this.selectionnerFichier}
            />
        </div>
      )
    }

    let popup = this.afficherPopup();

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
        {popup}
      </div>
    );
  }

}

class FileUploadSection extends React.Component {

  uploadFileProcessor = (acceptedFiles) => {
    // Traitement d'un fichier a uploader.
    console.debug(acceptedFiles);

    let repertoire_uuid = this.props.repertoireCourant.repertoire_uuid;

    // Demander un token (OTP) via websockets
    // Permet de se connecter au serveur pour transmetter le fichier.
    webSocketManager.demanderTokenTransfert()
    .then(token=>{
      // console.debug("Utilisation token " + token);
      let data = new FormData();
      data.append('repertoire_uuid', repertoire_uuid);
      acceptedFiles.forEach( file=> {
        data.append('grosfichier', file);
      })
      let config = {
        headers: {
          'authtoken': token
        }
      }

      axios.put('/grosFichiers/nouveauFichier', data, config)
        .then(response => this.uploadSuccess(response))
        .catch(error => this.uploadFail(error));
    })
    .catch(err=>{
      console.error("Erreur transfert fichiers");
      console.error(err);
    })

  }

  uploadSuccess(response) {
    console.debug("Upload is successful");
  }

  uploadFail(error) {
    console.error("Erreur dans l'upload");
    console.error(error);
  }

  render() {
    return (
      <Dropzone onDrop={this.uploadFileProcessor}>
        {({getRootProps, getInputProps}) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Cliquer ici pour upload ou DnD fichiers ici.</p>
            </div>
          </section>
        )}
      </Dropzone>
    );
  }
}

function Accueil(props) {

  let contenu = (
    <div>
      <p>Accueil</p>
    </div>
  );

  return contenu;
}

function NavigationRepertoire(props) {
  // Affiche la liste des sous-repertoires et une breadcrumb pour remonter

  var repertoireCourant1 = props.repertoireCourant;

  let sousRepertoires = [];
  if(repertoireCourant1.repertoires) {
    let listeATrier = []
    for(var uuidRep in repertoireCourant1.repertoires) {
      let sousRepertoire = repertoireCourant1.repertoires[uuidRep];
      listeATrier.push(sousRepertoire);
    }
    listeATrier.sort((a,b)=>{
      let nomA=a.nom, nomB=b.nom;
      return nomA.localeCompare(nomB);
    })

    listeATrier.forEach(repertoire=>{
      sousRepertoires.push(
        <li key={repertoire.repertoire_uuid}>
          <button
            className="aslink"
            value={repertoire.repertoire_uuid}
            onClick={props.afficherRepertoire}>{repertoire.nom}</button>
        </li>
      );
    })

  }

  return (
    <div>
      <p>Repertoire {repertoireCourant1.nom}</p>
      <button
        className="aslink"
        value={repertoireCourant1.parent_id}
        onClick={props.afficherRepertoire}>{repertoireCourant1.chemin_repertoires}</button>
      <p>{repertoireCourant1.commentaires}</p>
      <ul>
        {sousRepertoires}
      </ul>

      <button
        value={repertoireCourant1.nom}
        data-uuidrepertoireparent={repertoireCourant1.repertoire_uuid}
        onClick={props.afficherPopupCreerRepertoire}>Creer repertoire</button>
      <button
        value={repertoireCourant1.nom}
        data-uuidrepertoire={repertoireCourant1.repertoire_uuid}
        onClick={props.afficherPopupRenommerRepertoire}>Renommer</button>
      <button
        value={repertoireCourant1.repertoire_uuid}
        onClick={props.deplacerSelection}>Coller (deplacer)</button>
      <button
        value={repertoireCourant1.repertoire_uuid}
        onClick={props.supprimerRepertoire}>Supprimer</button>

      <FileUploadSection repertoireCourant={repertoireCourant1}/>
    </div>
  );
}

class ContenuRepertoire extends React.Component {
  // Affiche une liste formattee des fichiers du repertoire
  // Permet de telecharger les fichiers, ouvrir le detail d'un fichier.

  constructor(props) {
    super(props);
    this.refFormulaireDownload = React.createRef();
    this.download = this.download.bind(this);
  }

  download(event) {
    let bouton = event.currentTarget;
    let nomFichier = bouton.value;
    let fuuid = bouton.dataset.fuuid;
    let contentType = bouton.dataset.contenttype;

    console.debug("1. Bouton clique pour fichier " + nomFichier);
    let form = this.refFormulaireDownload.current;
    let downloadUrl = this.props.downloadUrl;

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

  formatterAffichageFichiers() {
    var repertoireCourant = this.props.repertoireCourant;
    console.debug("Fichiers repertoire courant");
    console.debug(repertoireCourant.fichiers);

    // Extraire et trier la liste des fichiers du repertoire
    let listeFichiers = [];
    for(var uuidFichier in repertoireCourant.fichiers) {
      listeFichiers.push(repertoireCourant.fichiers[uuidFichier]);
    }
    listeFichiers.sort((a,b) => {
      let nomA = a.nom, nomB = b.nom;
      return nomA.localeCompare(nomB);
    });

    let resultatAffichage = [];
    listeFichiers.forEach(fichier=>{
      resultatAffichage.push(
        <li key={fichier.uuid}>
          <button
            className="aslink"
            value={fichier.nom}
            data-fuuid={fichier.fuuid_v_courante}
            data-contenttype={fichier.mimetype}
            onClick={this.download}>{fichier.nom}</button>
          <button
            value={fichier.uuid}
            onClick={this.props.afficherProprietesFichier}>Proprietes</button>
          <button
            value={fichier.uuid}
            onClick={this.props.supprimerFichier}>Supprimer</button>
          <button
            value={fichier.nom}
            data-uuidfichier={fichier.uuid}
            onClick={this.props.afficherChangerNomFichier}>Renommer</button>
          <button
            value={fichier.uuid}
            onClick={this.props.selectionnerFichier}>Selectionner</button>
        </li>
      );
    });

    return resultatAffichage;
  }

  render() {

    let listeFichiers = this.formatterAffichageFichiers();

    // Formulaire utilise pour POST la requete avec authtoken
    let formDownload = (
      <form
        target="_blank"
        ref={this.refFormulaireDownload}
        action="dummyaction"
        method="POST">
          <input type="hidden" name="authtoken" value="dummytoken"/>
          <input type="hidden" name="fuuid" value="dummyfuuide"/>
          <input type="hidden" name="nomfichier" value="dummynomfichier"/>
          <input type="hidden" name="contenttype" value="dummycontentype"/>
      </form>
    )

    return (
      <div>
        {formDownload}

        <h2>Fichiers</h2>
        <ul>
          {listeFichiers}
        </ul>
      </div>
    );
  }

}

function AffichageFichier(props) {
  // Affiche l'information d'un fichier et la liste des versions
  let fichierCourant = props.fichierCourant;

  let informationFichier = (
    <div>
      <h2>{fichierCourant.nom}</h2>
      <button
        className="aslink"
        onClick={props.retourRepertoireFichier}>{fichierCourant.chemin_repertoires}</button>
      <p>Taille: {fichierCourant.taille} octets</p>
      <p>Date: {fichierCourant.date_v_courante}</p>
      <p>FUUID: {fichierCourant.fuuid_v_courante}</p>
      <p>{fichierCourant.commentaires}</p>
      <button
        className="aslink"
        value={fichierCourant.nom}
        data-uuidfichier={fichierCourant.uuid}
        onClick={props.afficherChangerNomFichier}>Renommer</button>
      <button
        className="aslink"
        value={fichierCourant.nom}
        data-uuidfichier={fichierCourant.uuid}
        onClick={props.supprimerFichier}>Supprimer</button>
    </div>
  );

  let versions = []
  for(var fuuid in fichierCourant.versions) {
    let version = fichierCourant.versions[fuuid];
    versions.push(version);
  }
  versions.sort((a,b)=>{
    let dateA = a.date_version, dateB = b.date_version;
    return dateB - dateA;
  })

  let affichageVersions = [];
  versions.forEach(version=>{
    affichageVersions.push(
      <li key={version.fuuid}>
        {version.date_version} / {version.taille} octets / {version.nom}
      </li>
    );
  })

  return (
    <div>
      {informationFichier}

      <h2>Versions</h2>
      <ul>{affichageVersions}</ul>
    </div>
  )
}

class PopupChangerNom extends React.Component {
  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Changer le nom</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom courant: {this.props.valeur.nom}</p>
            <p>Nouveau nom: <input type="text" name="nouveauNom" defaultValue={this.props.valeur.nom}/></p>
            <div>
              <button type="button" onClick={this.props.soumettre}>Soumettre</button>
              <button type="button" onClick={this.props.annuler}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

class PopupCreerRepertoire extends React.Component {
  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Creer nouveau repertoire</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom repertoire: <input type="text" name="nomrepertoire"/></p>
            <div>
              <button type="button" onClick={this.props.soumettre}>Soumettre</button>
              <button type="button" onClick={this.props.annuler}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

class PopupRenommerRepertoire extends React.Component {
  render() {
    return (
      <div className='popup'>
        <div className='popupinner'>
          <h1>Renommer repertoire</h1>
          <form onSubmit={e=>e.preventDefault()}>
            <p>Nom courant: {this.props.valeur.nom}</p>
            <p>Nouveau nom: <input type="text" name="nouveauNom" defaultValue={this.props.valeur.nom}/></p>
            <div>
              <button type="button" onClick={this.props.soumettre}>Soumettre</button>
              <button type="button" onClick={this.props.annuler}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
