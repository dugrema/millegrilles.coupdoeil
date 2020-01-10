import React from 'react';
import Dropzone from 'react-dropzone';
import TextareaAutosize from 'react-textarea-autosize';
import webSocketManager from '../WebSocketManager';

// import webSocketManager from '../WebSocketManager';
// import {dateformatter} from '../formatters'

import {ActiviteFichiers} from './GrosFichiersFichiers';

export class ActionsNavigation {

  constructor(reactModule) {
    this.reactModule = reactModule;
  }

  // Reset tous les elements qui ont un impact sur la navigation
  // Utiliser cette methode dans setState() lors d'un changement d'ecran.
  // Param: l'id de la page a charger, sera ajoute a la stack 'Retour' pour navigation
  _resetNavigation(ajoutStackNavigation) {

    let stackNavigation = this.reactModule.state.stackNavigation.slice(-50);
    if(ajoutStackNavigation) {
      stackNavigation.push(ajoutStackNavigation);
    }

    return {
      listeCourante: null,
      collectionCourante: null,
      collectionFigeeCourante: null,
      fichierCourant: null,
      afficherRecherche: false,
      afficherCarnet: false,

      stackNavigation,
    };
  }

  retourAccueil = () => {
    // console.debug("Afficher Accueil");

    this.reactModule.setState({
      ...this._resetNavigation('Accueil'),
      titreEntete: 'GrosFichiers',
    })
  }

  afficherRecherche = () => {
    console.debug("Afficher Recherche");

    this.reactModule.setState({
      ...this._resetNavigation('Recherche'),
      afficherRecherche: true,
    })
  }

  afficherCarnet = () => {
    console.debug("Afficher Carnet");

    this.reactModule.setState({
      ...this._resetNavigation('Carnet'),
      afficherCarnet: true,
    })
  }

  afficherCollection = event => {
    let uuid = event.currentTarget.value;
    console.debug("Afficher Collection " + uuid);

    this.reactModule.setState({
      ...this._resetNavigation(uuid),
    })
  }

  afficherCollectionFigee = event => {
    let uuid = event.currentTarget.value;
    console.debug("Afficher Collection Figee " + uuid);

    this.reactModule.setState({
      ...this._resetNavigation(uuid),
    })
  }

  chargeruuid = event => {
    let uuid = event.currentTarget.value;
    let requete = {requetes: [
      {'filtre': {
        '_mg-libelle': {'$in': ['fichier', 'collection', 'collection.figee']},
        'uuid': uuid,
      }},
    ]}

    // console.debug("Requete document:");
    // console.debug(requete);

    this.reactModule.chargerDocument(requete)
    .then(docs=>{
      // console.debug("chargeruuid: Recu document ");
      // console.debug(docs);

      let documentCharge = docs[0][0];
      this.afficherDocument(documentCharge);

    })
    .catch(err=>{
      console.error("Erreur chargement fichier");
      console.error(err);
    })

  }

  afficherDocument = (documentCharge) => {
    let etat = {
      ...this._resetNavigation(),
    };

    if(documentCharge && documentCharge['_mg-libelle'] === 'fichier') {
      etat['fichierCourant'] = documentCharge;
      etat.stackNavigation.push(documentCharge.uuid);
    } else if(documentCharge && documentCharge['_mg-libelle'] === 'collection') {
      etat['collectionCourante'] = documentCharge;
      etat.stackNavigation.push(documentCharge.uuid);
    } else if(documentCharge && documentCharge['_mg-libelle'] === 'collection.figee') {
      etat['collectionFigeeCourante'] = documentCharge;
      etat.stackNavigation.push(documentCharge.uuid);
    } else {
      console.error("Erreur chargement: fichier non trouve");
      etat = {}; // On ne change rien
    }

    this.reactModule.setState(etat);
  }

  navigationArriere = () => {
    let stackNavigation = this.reactModule.state.stackNavigation.slice();
    // console.debug("Stack navigation");
    // console.debug(stackNavigation);

    stackNavigation.pop();  // Enlever page courante
    let revenirA = stackNavigation.pop(); // Celui qu'on veut
    if(revenirA) {
      // Mettre a jour la stack, la page va etre remise au chargement
      this.reactModule.setState({stackNavigation}, ()=>{

        console.debug("Revenir a " + revenirA);

        if(revenirA === 'Accueil') {
          this.retourAccueil();
        } else if(revenirA === 'Recherche') {
          this.afficherRecherche();
        } else if(revenirA === 'Carnet') {
          this.afficherCarnet();
        } else {
          // Fichier ou collection
          this.chargeruuid({'currentTarget': {'value': revenirA}});
        }

      });

    }
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

    if(this.props.titre !== prevProps.titre) {
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

    let boutonDownload = null;
    if(this.props.downloadDecrypte) {
      // <button onClick={this.props.actionsNavigation.downloadFichier}>
      boutonDownload = (
        <a href={this.props.downloadDecrypte.contenu} download={this.props.downloadDecrypte.nomFichier}>
          <i title="Telecharger" className="fa fa-download fa-2x"/>
        </a>
      );
    }

    return(
      <div className="w3-card w3-round w3-white w3-card w3-card_BR">
        <div className="w3-container w3-padding">

          <div className="w3-row-padding">
            <div className="w3-col m2 bouton-home">
              <button onClick={this.props.actionsNavigation.navigationArriere}>
                <i title="Retour" className="fa fa-arrow-left fa-2x"/>
              </button>
              <button onClick={this.props.actionsNavigation.retourAccueil}>
                <i title="Accueil" className="fa fa-home fa-2x"/>
              </button>
              <button onClick={this.props.actionsNavigation.afficherRecherche}>
                <i title="Recherche" className="fa fa-search fa-2x"/>
              </button>
              {boutonDownload}
            </div>
            <div className="w3-col m8 entete-titre">
              {elementTitre}
            </div>
            <div className="w3-col m1 bouton-home" title="Carnet">
              <button onClick={this.props.actionsNavigation.afficherCarnet}>
                <i className="fa fa-clipboard fa-2x">
                  {this.renderBadgeCarnet()}
                </i>
              </button>
            </div>
            <div className="w3-col m1">
              <FileUploadSection
                actionsUpload={this.props.actionsUpload}
                documentuuid={this.props.documentuuid}
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
        <ActiviteFichiers
          rapportActivite={this.props.rapportActivite}
          favorisParUuid={this.props.favorisParUuid}
          carnet={this.props.carnet}
          actionsNavigation={this.props.actionsNavigation}
          actionsFavoris={this.props.actionsFavoris}
          actionsDownload={this.props.actionsDownload}
          actionsCarnet={this.props.actionsCarnet}
          />
        <SectionSommaireTorrent />
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
          <input type="hidden" name="extension" value="dummyextension"/>
      </form>
    );
  }

}

export class FileUploadMonitor extends React.Component {

  preparerListeCourants() {
    let liste = [];

    var resultat = null;

    if(this.props.uploadsCourants && this.props.uploadsCourants.length > 0 ) {
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

      resultat = (
        <div>
          <h2>Uploads en cours</h2>
          {liste}
        </div>
      );
    }

    return resultat;
  }

  preparerListeCompletes() {
    let liste = [];

    var resultat = null;

    if(this.props.uploadsCompletes && this.props.uploadsCompletes.length > 0) {
      for(let idx in this.props.uploadsCompletes) {
        let valeur = this.props.uploadsCompletes[idx];

        // console.log("Valeur upload complete: ");
        // console.log(valeur);

        let classeIcone = 'fa fa-check succes';
        let progres = '100 %';
        if( valeur.state === 'echec' ) {
          classeIcone = 'fa fa-window-close error';
          progres = 'N/A';
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
              {progres}
            </div>
          </div>
        );
      }

      resultat = (
        <div>
          <div className="w3-container">
            <div className="w3-col m10">
              <h2>Uploads completes</h2>
            </div>
            <div className="w3-col m2">
              <button onClick={this.props.actionsUpload.clearUploadsCompletes}>Clear</button>
            </div>
          </div>

          {liste}

        </div>
      );
    }

    return resultat;
  }

  render() {
    return(
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          {this.preparerListeCompletes()}
          {this.preparerListeCourants()}
        </div>
      </div>
    );
  }

}

export class FileUploadSection extends React.Component {

  uploadFileProcessor = (acceptedFiles) => {
    // Traitement d'un fichier a uploader.
    // console.debug(acceptedFiles);

    let securite = '3.protege';  // Par defaut, augmenter a 4.secure lorsque pret
    let documentuuid = this.props.documentuuid;

    // let repertoire_uuid = this.props.repertoireCourant.repertoire_uuid;
    // let securite = this.props.repertoireCourant.securite;

    // console.debug("Upload fichier avec securite: " + securite);

    acceptedFiles.forEach( file=> {
      // Ajouter le fichier a l'upload queue
      this.props.actionsUpload.ajouterUpload(file, {documentuuid, securite});
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

class SectionSommaireTorrent extends React.Component {

  state = {
    sessionStats: null,
  }

  intervalRafraichissement = null;

  rafraichirTorrents = () => {
    webSocketManager.transmettreRequete('requete.torrent.sommaire', {})
    .then( docsRecu => {
      // console.log("Etat torrent:");
      // console.log(docsRecu);

      const sessionStats = docsRecu.sessionStats;
      this.setState({sessionStats});
    })
    .catch( err => {
      console.error("Erreur reception sommaire torrents");
      console.error(err);
    });
  }

  componentDidMount() {
    // Effectuer requete pour afficher etat torrent (transmission)
    this.rafraichirTorrents();
    this.intervalRafraichissement = setInterval(this.rafraichirTorrents, 15000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalRafraichissement);
  }

  afficherStats() {
    var stats = null;
    if(this.state.sessionStats) {
      stats = (
        <div>
          Actifs : {this.state.sessionStats.activeTorrentCount},
          Totaux : {this.state.sessionStats.torrentCount},
          Upload speed : {this.state.sessionStats.uploadSpeed}
        </div>
      );
    }

    return stats;
  }

  render() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2>Torrents</h2>
          {this.afficherStats()}
        </div>
      </div>
    );
  }


}
