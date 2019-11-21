import React from 'react';
import Dropzone from 'react-dropzone';
// import webSocketManager from '../WebSocketManager';

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

export class Accueil extends React.Component {

  render() {
    let contenu = (
      <div>
        <p>Accueil</p>
      </div>
    );

    return contenu;
  }

}

export class NavigationCollection extends React.Component {
  // Affiche la liste des sous-repertoires et une breadcrumb pour remonter

  informationRepertoire() {
    console.debug(this.props.collectionCourante);
    return (
      <div>
        <div>
          {this.props.collectionCourante.commentaires}
        </div>
      </div>
    );
  }

  render() {

    return (
      <div className="w3-card w3-round w3-white priveHeader">
        <div className="w3-container w3-padding">
          <FileUploadSection
            collectionCourante={this.props.collectionCourante}
            {...this.props.uploadActions}
            />
        </div>
      </div>
    );
  }
}

export class AffichageFichier extends React.Component {

  render() {
    // Affiche l'information d'un fichier et la liste des versions
    let fichierCourant = this.props.fichierCourant;
    let dateFichierCourant = new Date(0);
    dateFichierCourant.setUTCSeconds(fichierCourant.date_v_courante);

    let informationFichier = (

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-opacity">{fichierCourant.nom}</h2>
            <button
              className="aslink"
              onClick={this.props.retourFichier}>Retour</button>

            <div className="proprietes">
              <div>Date: {dateFichierCourant.toString()}</div>
              <div>Taille: { (fichierCourant.taille / (1024*1024)).toFixed(2) } MB ({fichierCourant.taille} octets)</div>
              <div>Securite: {fichierCourant.securite}</div>
              <div>FUUID: {fichierCourant.fuuid_v_courante}</div>
              <div>{fichierCourant.commentaires}</div>
            </div>

            <div className="buttonBar">
              <button
                value={fichierCourant.nom}
                data-uuidfichier={fichierCourant.uuid}
                onClick={this.props.afficherChangerNomFichier}>Renommer</button>
              <button
                value={fichierCourant.nom}
                data-uuidfichier={fichierCourant.uuid}
                onClick={this.props.supprimerFichier}>Supprimer</button>
            </div>
          </div>
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

    return (
      <div className="w3-col m12">
        {informationFichier}

        <div className="w3-card w3-round w3-white">
          <div className="w3-container w3-padding">
            <h2 className="w3-opacity">Versions</h2>
            <ul>{affichageVersions}</ul>
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
        <div key={valeur.path}>
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
        <div key={valeur.path}>
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
          <button onClick={this.props.clearUploadsCompletes}>Clear</button>
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

    let repertoire_uuid = this.props.repertoireCourant.repertoire_uuid;
    let securite = this.props.repertoireCourant.securite;

    console.debug("Upload fichier avec securite: " + securite);

    acceptedFiles.forEach( file=> {
      // Ajouter le fichier a l'upload queue
      this.props.ajouterUpload(file, {repertoire_uuid, securite});
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
