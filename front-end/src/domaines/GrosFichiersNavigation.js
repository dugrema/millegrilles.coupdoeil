import React from 'react';
import Dropzone from 'react-dropzone';
import TextareaAutosize from 'react-textarea-autosize';

// import webSocketManager from '../WebSocketManager';
import {dateformatter} from '../formatters'
import CheckBox from '../mgcomponents/Checkbox.js';

export class ActionsNavigation {

  constructor(reactModule) {
    this.reactModule = reactModule;
  }

  retourAccueil = () => {
    console.debug("Afficher Accueil");
    this.reactModule.setState({
      titreEntete: 'GrosFichiers',

      listeCourante: null,
      collectionCourante: null,
      fichierCourant: null,
      afficherRecherche: false,
    })
  }

  afficherRecherche = () => {
    console.debug("Afficher Recherche");
    this.reactModule.setState({
      afficherRecherche: true,
    })
  }

  chargeruuid = event => {
    let uuid = event.currentTarget.value;
    let requete = {requetes: [
      {'filtre': {
        '_mg-libelle': {'$in': ['fichier', 'collection']},
        'uuid': uuid,
      }},
    ]}

    this.reactModule.chargerDocument(requete)
    .then(docs=>{
      console.debug("chargeruuid: Recu document ");
      console.debug(docs);

      let documentCharge = docs[0][0];

      let etat = {};
      if(documentCharge && documentCharge['_mg-libelle'] === 'fichier') {
        etat['fichierCourant'] = documentCharge;
      } else if(documentCharge && documentCharge['_mg-libelle'] === 'collection') {
        etat['collectionCourante'] = documentCharge;
      } else {
        console.error("Erreur chargement: fichier non trouve");
      }

      this.reactModule.setState(etat);

    })
    .catch(err=>{
      console.error("Erreur chargement fichier");
      console.error(err);
    })

  }

}

export class Entete extends React.Component {

  state = {
    titre: null,
  }

  editerTitre = event => {
    let titre = event.currentTarget.value;
    this.setState({titre});
  }

  actionRenommer = event => {
    let titre = event.currentTarget.value;

    if(titre !== this.props.titre) {

      this.props.actionRenommer(this.props.documentuuid, titre)
      .then(msg=>{
        // console.debug("Reponse renommer fichier");
        // console.debug(msg);
        // Le titre sera resette a null a la reception du message de maj du fichier
      })
      .catch(err=>{
        console.error("Erreur changement de titre");
        console.error(err);
        // Remet le pour qu'il vienne du parent
        this.setState({titre: null});
      });

    } else {
      // Rien a faire, le titre n'a pas change
      // Reset l'etat d'edition
      this.setState({titre: null});
    }

  }

  renderBadgeCarnet() {
    let badgeCarnet = '';
    if(this.props.carnet.taille > 0) {
      badgeCarnet = (
        <span className="w3-badge w3-medium w3-green badge">{this.props.carnet.taille}</span>
      )
    }
    return badgeCarnet;
  }

  componentDidUpdate(prevProps) {
    var resetEtats = {};

    if(this.props.titre != prevProps.titre) {
      // Edition du titre en cours
      if(this.state.titre === this.props.titre) {
        // Les modifications sont deja faites, on annule l'edition du titre
        resetEtats.titre = null;
      }
    }

    if(Object.keys(resetEtats).length > 0) {
      this.setState(resetEtats);
    }
  }

  render() {

    let elementTitre;
    var cssEdition = '';
    if(this.state.titre) {
      cssEdition = ' edition-en-cours';
    }
    if(this.props.actionRenommer && this.props.documentuuid) {
      elementTitre = (
        <TextareaAutosize name="titre"
          className={"titre-autota-width-max editable " + cssEdition}
          value={this.state.titre || this.props.titre}
          onChange={this.editerTitre}
          onBlur={this.actionRenommer} />
      );
    } else {
      elementTitre = (
        <h1>{this.props.titre}</h1>
      );
    }

    return(
      <div className="w3-card w3-round w3-white w3-card w3-card_BR">
        <div className="w3-container w3-padding">

          <div className="w3-row-padding">
            <div className="w3-col m2 bouton-home">
              <button onClick={this.props.actionsNavigation.retourAccueil}>
                <i title="Retour" className="fa fa-home fa-2x"/>
              </button>
              <button onClick={this.props.actionsNavigation.afficherRecherche}>
                <i title="Recherche" className="fa fa-search fa-2x"/>
              </button>
            </div>
            <div className="w3-col m8 entete-titre">
              {elementTitre}
            </div>
            <div className="w3-col m1 bouton-home" title="Carnet">
              <i className="fa fa-clipboard fa-2x">
                {this.renderBadgeCarnet()}
              </i>
            </div>
            <div className="w3-col m1">
              <FileUploadSection
                actionsUpload={this.props.actionsUpload}
                />
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export class Accueil extends React.Component {

  renderUploadProgress() {
    let uploadProgress = null;
    if(this.props.uploadsCourants.length > 0 || this.props.uploadsCompletes.length > 0) {
      uploadProgress = (
        <FileUploadMonitor
          uploadsCourants={this.props.uploadsCourants}
          uploadsCompletes={this.props.uploadsCompletes}
          actionsUpload={this.props.actionsUpload}
          />
      )
    }
    return uploadProgress;
  }

  render() {
    return (
      <div className="w3-card_liste_BR">
        <Favoris
          favoris={this.props.favoris}
          actionsNavigation={this.props.actionsNavigation}
          />
        {this.renderUploadProgress()}
        <ListeFichiers
          rapportActivite={this.props.rapportActivite}
          favorisParUuid={this.props.favorisParUuid}
          carnet={this.props.carnet}
          actionsNavigation={this.props.actionsNavigation}
          actionsFavoris={this.props.actionsFavoris}
          actionsDownload={this.props.actionsDownload}
          actionsCarnet={this.props.actionsCarnet}
          />
      </div>
    );
  }

}

export class SectionRecherche extends React.Component {

  render() {
    let etiquettes = ['etiquette1', 'etiquette2', 'etiquette3', 'etiquette4'];

    let etiquettesRendered = [];
    for(let idx in etiquettes) {
      let etiquette = etiquettes[idx];
      etiquettesRendered.push(
        <button key={etiquette}><i className="fa fa-tag"/>{etiquette}</button>
      );
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding formulaire">
          <div className="w3-row-padding">
            <h2 className="w3-col m12">Recherche de fichiers</h2>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m12 liste-etiquettes">
              {etiquettesRendered}
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
}

// Affiche une liste paginee de fichiers
export class Favoris extends React.Component {

  render() {
    let favorisRendered = [];
    if(this.props.favoris) {
      let listeFavoris = this.props.favoris.favoris;
      for(let idx in listeFavoris) {
        let favoris = listeFavoris[idx];
        let nomFavori = favoris['nom'];
        let uuidFavori = favoris['uuid'];
        favorisRendered.push(
          <button key={uuidFavori} onClick={this.props.actionsNavigation.chargeruuid} value={uuidFavori}>
            <span className="fa-stack favori-actif">
              <i className='fa fa-star fa-stack-1x fond'/>
              <i className='fa fa-star-o fa-stack-1x'/>
            </span>
            {nomFavori}
          </button>
        );
      }

    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">
          <div className="w3-row-padding">
            <h2 className="w3-col m12">Favoris</h2>
          </div>
          <div className="w3-row-padding">
            <div className="w3-col m12 liste-favoris">
              {favorisRendered}
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export class ListeFichiers extends React.Component {

  state = {
    pageCourante: '1',
    elementsParPage: 10,
    selection: {},
  }

  changerPage = event => {
    let page = event.currentTarget.value;
    this.setState({pageCourante: page});
  }

  renderBoutonsPages() {
    let boutonsPages = [];
    if(this.props.rapportActivite) {
      let fichiers = this.props.rapportActivite.fichiers;
      let nbPages = Math.ceil(fichiers.length / this.state.elementsParPage);

      for(let page=1; page<=nbPages; page++) {
        let cssCourante = '';
        if(this.state.pageCourante === ''+page) {
          cssCourante = 'courante';
        }
        boutonsPages.push(
          <button key={page} onClick={this.changerPage} value={page} className={cssCourante}>
            {page}
          </button>
        );
      }
    }
    return boutonsPages;
  }

  renderFichiers() {
    let fichiersRendered = [];

    if( this.props.rapportActivite ) {
      let premierElem = (this.state.pageCourante-1) * this.state.elementsParPage;
      let dernierElem = premierElem + this.state.elementsParPage; // (+1)

      let fichiers = this.props.rapportActivite.fichiers;

      for(let idx = premierElem; idx < dernierElem && idx < fichiers.length; idx++) {
        let fichier = fichiers[idx];

        let check;
        if(this.props.carnet.selection[fichier.uuid]) {
          check = ((<i className="fa fa-check-square-o"/>));
        } else {
          check = ((<i className="fa fa-square-o"/>));
        }

        let icone = (<i className="fa fa-file-o"/>);
        if(fichier['_mg-libelle'] === 'collection') {
          icone = (<i className="fa fa-folder-o"/>);
        }

        let dernierChangementRendered = renderDernierChangement(fichier['_mg-derniere-modification']);
        let cssFavori, actionFavori;
        if(this.props.favorisParUuid[fichier.uuid]) {
          cssFavori = 'favori-actif';
          actionFavori = this.props.actionsFavoris.supprimerFavori;
        } else {
          cssFavori = 'favori-inactif';
          actionFavori = this.props.actionsFavoris.ajouterFavori;
        }

        fichiersRendered.push(
          <div key={fichier['_mg-derniere-modification']+fichier.uuid} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m8">
              <button className="nobutton" onClick={this.checkEntree} value={fichier.uuid}>
                {check}
              </button>
              {icone}
              <button className="aslink" onClick={this.props.actionsNavigation.chargeruuid} value={fichier.uuid}>
                {fichier.nom}
              </button>
            </div>

            <div className="w3-col m2 boutons-actions-droite">
              <button value={fichier.uuid} onClick={actionFavori}>
                <span className={"fa-stack " + cssFavori}>
                  <i className='fa fa-star fa-stack-1x fond'/>
                  <i className='fa fa-star-o fa-stack-1x'/>
                </span>
              </button>
              <button value={fichier.uuid} onClick={this.props.actionsDownload.telechargerEvent}>
                <i className="fa fa-download"/>
              </button>
            </div>
            <div className="w3-col m2">
              {dernierChangementRendered}
            </div>
          </div>
        );
      }
    }

    return fichiersRendered;
  }

  checkEntree = event => {
    let uuid = event.currentTarget.value;
    let etat = !this.state.selection[uuid];
    console.debug("Selection " + uuid);
    this.props.actionsCarnet.toggle(uuid, {});
  }

  renderBoutonsAction() {
    return (
      <div className="boutons-actions-gauche">
        <button>
          <i className="fa fa-trash"/>
        </button>
      </div>
    )
  }

  render() {

    var descriptionRapport = '';
    if(this.props.rapportActivite) {
      descriptionRapport = this.props.rapportActivite.description;
    }

    return (
      <div className="w3-card w3-round w3-white w3-card">
        <div className="w3-container w3-padding">
          <div className="w3-row-padding">
            <h2>{descriptionRapport}</h2>
          </div>
          <div className="liste-fichiers">
            {this.renderFichiers()}
          </div>
          <div className="bas-page">
            <div className="w3-col m12 boutons-pages">
              {this.renderBoutonsPages()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export class GrosFichiersRenderDownloadForm extends React.Component {

  // Download form
  render() {
    // Formulaire utilise pour POST la requete avec authtoken
    return (
      <form
        target="_blank"
        ref={this.props.refFormulaireDownload}
        action="dummyaction"
        method="POST">
          <input type="hidden" name="authtoken" value="dummytoken"/>
          <input type="hidden" name="fuuid" value="dummyfuuide"/>
          <input type="hidden" name="nomfichier" value="dummynomfichier"/>
          <input type="hidden" name="contenttype" value="dummycontentype"/>
          <input type="hidden" name="securite" value="dummysecurite"/>
      </form>
    );
  }

}

// Affichage d'un fichier avec toutes ses versions
export class AffichageFichier extends React.Component {

  state = {
    commentaires: null,
  }

  editerCommentaire = event => {
    let commentaires = event.currentTarget.value;
    this.setState({commentaires});
  }

  appliquerCommentaire = event => {
    let commentaires = event.currentTarget.value;
    if(commentaires !== this.props.fichierCourant.commentaires) {
      this.props.actionsFichiers.modifierCommentaire(
        this.props.fichierCourant.uuid, commentaires)
      .then(msg=>{
        // Rien a faire.
      })
      .catch(err=>{
        console.error("Erreur ajout commentaire");
        console.err(err);
        // Reset commentaire.
        this.setState({commentaires: null});
      })
    } else {
      // Rien a faire. Reset commentaire.
      this.setState({commentaires: null});
    }
  }

  // Verifier si on peut resetter les versions locales des proprietes editees.
  componentDidUpdate(prevProps) {

    let resetState = {};
    if(this.state.commentaires) {
      if(this.state.commentaires === this.props.fichierCourant.commentaires) {
        resetState.commentaires = null;
      }
    }

    if(Object.keys(resetState).length > 0) {
      this.setState(resetState);
    }
  }

  renderInformationFichier() {

    let fichierCourant = this.props.fichierCourant;
    let dateFichierCourant = new Date(0);
    dateFichierCourant.setUTCSeconds(fichierCourant.date_v_courante);

    let informationFichier = (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <div className="m3-col m12 formulaire">

            <div className="row-donnees">
              <div className="w3-col m10">
                <h2>Information</h2>
              </div>
              <div className="w3-col m1 boutons-actions-droite">
                <button
                  title="Telecharger"
                  value={fichierCourant.uuid}
                  onClick={this.props.actionsDownload.telechargerEvent}>
                    <i className="fa fa-download"/>
                </button>
              </div>
              <div className="w3-col m1 boutons-actions-droite">
                <button
                  title="Supprimer"
                  value={fichierCourant.uuid}
                  data-uuidfichier={fichierCourant.uuid}
                  onClick={this.props.supprimerFichier}>
                    <i className="fa fa-trash-o"/>
                </button>
              </div>
            </div>

            <div className="w3-row-padding">
              <div className="w3-col m3 label">Date :</div>
              <div className="w3-col m9 champ">{dateFichierCourant.toString()}</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">Taille : </div>
              <div className="w3-col m9 champ">{ (fichierCourant.taille / (1024*1024)).toFixed(2) } MB ({fichierCourant.taille} octets)</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">Securite :</div>
              <div className="w3-col m9 champ">{fichierCourant.securite}</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">UUID permanent :</div>
              <div className="w3-col m9 champ">{fichierCourant.uuid}</div>
            </div>
            <div className="w3-row-padding">
              <div className="w3-col m3 label">FUUID courant :</div>
              <div className="w3-col m9 champ">{fichierCourant.fuuid_v_courante}</div>
            </div>

          </div>
        </div>
      </div>
    );

    return informationFichier;
  }

  renderCommentaire() {
    let fichierCourant = this.props.fichierCourant;
    let cssEdition = '';
    if(this.state.commentaires) {
      cssEdition = 'edition-en-cours'
    }

    let commentaires = (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <div className="m3-col m12 formulaire">

            <div className="w3-col m12">
              <TextareaAutosize
                name="commentaires"
                className={"autota-width-max editable " + cssEdition}
                onChange={this.editerCommentaire}
                onBlur={this.appliquerCommentaire}
                value={this.state.commentaires || fichierCourant.commentaires}
                placeholder="Ajouter un commentaire ici..."
                />
            </div>

          </div>
        </div>
      </div>
    );

    return commentaires;
  }

  renderVersions() {
    let fichierCourant = this.props.fichierCourant;

    let versions = [];
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
      let dateVersion = new Date(0);
      dateVersion.setUTCSeconds(version.date_version);
      let taille = (version.taille/(1024*1024)).toFixed(2);
      affichageVersions.push(
        <li key={version.fuuid}>
          {dateVersion.toString()}<br/>
          {taille} MB / {version.nom} / Securite: {version.securite}
          <button
            onClick={this.props.telechargerEvent}
            value={fichierCourant.uuid}
            data-fuuid={version.fuuid}
            data-securite={version.securite}>
            Download
          </button>
          <button
            onClick={this.props.telechargerEvent}
            value={fichierCourant.uuid}
            data-fuuid={version.fuuid}
            data-securite={version.securite}
            data-notarget='true'>
            Download no-tab
          </button>
        </li>
      );
    })

    return affichageVersions;
  }

  render() {
    // Affiche l'information d'un fichier et la liste des versions
    return (
      <div className="w3-col m12 w3-card_liste_BR">
        {this.renderInformationFichier()}
        {this.renderCommentaire()}

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-opacity">Versions</h2>
            <ul>{this.renderVersions()}</ul>
          </div>
        </div>

      </div>
    )
  }
}

export class FileUploadMonitor extends React.Component {

  preparerListeCourants() {
    let liste = [];

    for(let idx in this.props.uploadsCourants) {
      let valeur = this.props.uploadsCourants[idx];

      let classeIcone = 'fa fa-upload';
      if(idx === ''+0) {
        classeIcone = 'fa fa-spinner fa-pulse';
      }

      liste.push(
        <div key={valeur.path} className="w3-row-padding">
          <div className="w3-col m1">
            <i className={classeIcone}/>
          </div>
          <div className="w3-col m9">
            {valeur.path}
          </div>
          <div className="w3-col m2">
            {valeur.progres}%
          </div>
        </div>
      );
    }

    return liste;
  }

  preparerListeCompletes() {
    let liste = [];

    for(let idx in this.props.uploadsCompletes) {
      let valeur = this.props.uploadsCompletes[idx];

      let classeIcone = 'fa fa-check';
      //if( erreur ) {
      //  classeIcone = 'fa fa-window-close error';
      //}

      liste.push(
        <div key={valeur.path} className="w3-row-padding">
          <div className="w3-col m1">
            <i className={classeIcone}/>
          </div>
          <div className="w3-col m9">
            {valeur.path}
          </div>
          <div className="w3-col m2">
            {valeur.progres}%
          </div>
        </div>
      );
    }

    return (
      <div>
        <div>
          <button onClick={this.props.actionsUpload.clearUploadsCompletes}>Clear</button>
          </div>
        {liste}
      </div>
    );
  }

  render() {
    return(
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2>Uploads completes</h2>
          {this.preparerListeCompletes()}
          <h2>Uploads en cours</h2>
          {this.preparerListeCourants()}
        </div>
      </div>
    );
  }

}

export class FileUploadSection extends React.Component {

  uploadFileProcessor = (acceptedFiles) => {
    // Traitement d'un fichier a uploader.
    console.debug(acceptedFiles);

    let securite = '3.protege';  // Par defaut, augmenter a 4.secure lorsque pret
    let uuidcollection = null;

    // let repertoire_uuid = this.props.repertoireCourant.repertoire_uuid;
    // let securite = this.props.repertoireCourant.securite;

    console.debug("Upload fichier avec securite: " + securite);

    acceptedFiles.forEach( file=> {
      // Ajouter le fichier a l'upload queue
      this.props.actionsUpload.ajouterUpload(file, {uuidcollection, securite});
    });

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
          <section className="uploadIcon">
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <span className="fa fa-upload fa-2x"/>
            </div>
          </section>
        )}
      </Dropzone>
    );
  }
}

function renderDernierChangement(date) {
  var maintenant = Math.floor(Date.now()/1000);
  let dateChangement = dateformatter.format_datetime(date);
  let dernierChangementDepuis = maintenant - date;
  dernierChangementDepuis = Math.floor(dernierChangementDepuis / 60);

  let dernierChangementRendered;
  var s;  // Ajouter s (pluriels) au besoin
  if(dernierChangementDepuis < 60) {
    dernierChangementDepuis = Math.max(0, dernierChangementDepuis);
    dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} minutes</span>);
  } else if (dernierChangementDepuis < 1440) {
    dernierChangementDepuis = Math.floor(dernierChangementDepuis / 60);
    if(dernierChangementDepuis > 1) s = 's';
    dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} heure{s}</span>);
  } else if (dernierChangementDepuis < 43200) {
    dernierChangementDepuis = Math.floor(dernierChangementDepuis / 1440);
    if(dernierChangementDepuis > 1) s = 's';
    dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} jour{s}</span>);
  } else if (dernierChangementDepuis < 525600) {
    dernierChangementDepuis = Math.floor(dernierChangementDepuis / 43200);
    dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} mois</span>);
  } else {
    dernierChangementDepuis = Math.floor(dernierChangementDepuis / 525600);
    if(dernierChangementDepuis > 1) s = 's';
    dernierChangementRendered = (<span title={dateChangement}>{dernierChangementDepuis} annee{s}</span>);
  }

  return dernierChangementRendered;
}
