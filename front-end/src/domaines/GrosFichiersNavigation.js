import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import webSocketManager from '../WebSocketManager';

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

export class NavigationRepertoire extends React.Component {
  // Affiche la liste des sous-repertoires et une breadcrumb pour remonter
  render() {
    let pathRepertoire;
    if(this.props.repertoireCourant.nom === '/') {
      pathRepertoire = (
        <span>
          Prive
        </span>
      )
    } else {

      let chemin = [];
      chemin.push(
        <span key={this.props.repertoirePrive.repertoire_uuid}>
          <button
            className="aslink"
            value={this.props.repertoirePrive.repertoire_uuid}
            onClick={this.props.afficherRepertoire}>
              Prive
          </button>
          /
        </span>
      );

      // Couper le chemin intermediaire, on garde le parent
      // console.debug(this.props.repertoireCourant);
      let cheminsRepertoires = this.props.repertoireCourant.chemin_repertoires;
      cheminsRepertoires = cheminsRepertoires.substring(1);  // Enlever leading '/'
      let chemins = cheminsRepertoires.split('/');
      if(chemins[0] !== '') for(var idx in chemins) {
        let nomRepertoire = chemins[idx];
        let dernier = ''+(chemins.length-1);  // String pour comparer a idx
        if(idx == dernier) {
          chemin.push(
            <span key={this.props.repertoireCourant.parent_id}>
              <button
                className="aslink"
                value={this.props.repertoireCourant.parent_id}
                onClick={this.props.afficherRepertoire}>
                  {nomRepertoire}
              </button>
              /
            </span>
          )
        } else {
          chemin.push(
            <span key={nomRepertoire+idx}>{nomRepertoire}/</span>
          )
        }
      }

      chemin.push(
        <span key={this.props.repertoireCourant.repertoire_uuid}>
          {this.props.repertoireCourant.nom}
        </span>
      )

      // Retourner le chemin complet
      pathRepertoire = (
        <span>
          {chemin}
        </span>
      )
    }

    return (
      <div className="w3-card w3-round w3-white priveHeader">
        <div className="w3-container w3-padding">
          {pathRepertoire}
          <FileUploadSection repertoireCourant={this.props.repertoireCourant}/>
        </div>
      </div>
    );
  }
}

export class AffichageFichier extends React.Component {

  render() {
    // Affiche l'information d'un fichier et la liste des versions
    let fichierCourant = this.props.fichierCourant;

    let informationFichier = (
      <div>
        <h2>{fichierCourant.nom}</h2>
        <button
          className="aslink"
          onClick={this.props.retourRepertoireFichier}>{fichierCourant.chemin_repertoires}</button>
        <p>Taille: {fichierCourant.taille} octets</p>
        <p>Date: {fichierCourant.date_v_courante}</p>
        <p>FUUID: {fichierCourant.fuuid_v_courante}</p>
        <p>{fichierCourant.commentaires}</p>
        <button
          className="aslink"
          value={fichierCourant.nom}
          data-uuidfichier={fichierCourant.uuid}
          onClick={this.props.afficherChangerNomFichier}>Renommer</button>
        <button
          className="aslink"
          value={fichierCourant.nom}
          data-uuidfichier={fichierCourant.uuid}
          onClick={this.props.supprimerFichier}>Supprimer</button>
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
}

export class FileUploadSection extends React.Component {

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
