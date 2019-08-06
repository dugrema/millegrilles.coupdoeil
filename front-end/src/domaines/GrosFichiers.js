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

    // Popups a afficher
    popupRenommerValeursFichier: null,

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
      'noeuds.source.millegrilles_domaines_GrosFichiers.repertoire_racine',
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

  retourRepertoireFichier = (event) => {
    this.setState({'fichierCourant': null});
  }

  creerRepertoire = (event) => {

  }

  deplacerRepertoire = (event) => {

  }

  renommerRepertoire = (event) => {

  }

  supprimerRepertoire = (event) => {

  }

  deplacerFichier = (event) => {

  }

  renommerFichier = (event) => {

  }

  supprimerFichier = (event) => {

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
    if(this.state.popupRenommerValeursFichier) {
      return (
        <PopupChangerNom
          valeur={this.state.popupRenommerValeursFichier}
          soumettre={this.soumettreChangerNomFichier}
          annuler={this.annulerChangerNomFichier}
        />
      );
    }

    return null;
  }

  afficherChangerNomFichier = (event) => {
    let nomFichier = event.currentTarget.value;
    let uuidFichier = event.currentTarget.dataset.uuidfichier;
    console.debug("Renommer Fichier " + nomFichier + ", uuid " + uuidFichier);

    this.setState({popupRenommerValeursFichier: {
      nom: nomFichier,
      uuidFichier: uuidFichier,
    }});
  }

  soumettreChangerNomFichier = (event) => {
    let formulaire = event.currentTarget.form;
    let nouveauNom = formulaire.nouveauNom.value;
    let ancienNom = this.state.popupRenommerValeursFichier.nom;
    let uuidFichier = this.state.popupRenommerValeursFichier.uuidFichier;

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

    this.setState({popupRenommerValeursFichier: null});
  }

  annulerChangerNomFichier = (event) => {
    this.setState({popupRenommerValeursFichier: null});
  }

  render() {
    let contenu;

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
    } else if(this.state.repertoireCourant) {
      affichagePrincipal = (
        <div>
          <NavigationRepertoire
            repertoireCourant={this.state.repertoireCourant}
            downloadUrl={this.state.downloadUrl}
            creerRepertoire={this.creerRepertoire}
            supprimerRepertoire={this.supprimerRepertoire}
            afficherChangerNom={this.afficherChangerNom}
            />
          <ContenuRepertoire
            repertoireCourant={this.state.repertoireCourant}
            downloadUrl={this.state.downloadUrl}
            afficherProprietesFichier={this.afficherProprietesFichier}
            afficherChangerNomFichier={this.afficherChangerNomFichier}
            />
        </div>
      )
    } else if(this.state.repertoireRacine) {
      affichagePrincipal = (
        <div>
          <NavigationRepertoire
            repertoireCourant={this.state.repertoireRacine}
            downloadUrl={this.state.downloadUrl}
            creerRepertoire={this.creerRepertoire}
            supprimerRepertoire={this.supprimerRepertoire}
            afficherChangerNom={this.afficherChangerNom}
            />
          <ContenuRepertoire
            repertoireCourant={this.state.repertoireRacine}
            downloadUrl={this.state.downloadUrl}
            afficherProprietesFichier={this.afficherProprietesFichier}
            afficherChangerNomFichier={this.afficherChangerNomFichier}
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

  let affichageCourant;

  let contenu = (
    <div>
      <p>Accueil</p>
    </div>
  );

  return contenu;
}

function NavigationRepertoire(props) {
  // Affiche la liste des sous-repertoires et une breadcrumb pour remonter

  let repertoireCourant = props.repertoireCourant;

  let sousRepertoires = [];
  if(repertoireCourant.repertoires) {
    for(var uuidRep in repertoireCourant.repertoires) {
      let sousRepertoire = repertoireCourant.repertoires[uuidRep];
      sousRepertoires.append(
        <p>{sousRepertoire.nom}</p>
      );
    }
  }

  return (
    <div>
      <p>Repertoire {repertoireCourant.nom}</p>
      <p>{repertoireCourant.chemin_repertoires}</p>
      {sousRepertoires}
      <FileUploadSection repertoireCourant={repertoireCourant}/>
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
    let repertoireCourant = this.props.repertoireCourant;
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
          /
          <button
            className="aslink"
            value={fichier.uuid}
            onClick={this.props.afficherProprietesFichier}>Proprietes</button>
          /
          <button
            className="aslink"
            value={fichier.uuid}
            onClick={this.props.supprimerFichier}>Supprimer</button>
          /
          <button
            className="aslink"
            value={fichier.nom}
            data-uuidfichier={fichier.uuid}
            onClick={this.props.afficherChangerNomFichier}>Renommer</button>
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
