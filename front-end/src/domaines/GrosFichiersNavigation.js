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
    var repertoireCourant1 = this.props.repertoireCourant;

    return (
      <div>
        <p>Repertoire {repertoireCourant1.nom}</p>
        <button
          className="aslink"
          value={repertoireCourant1.parent_id}
          onClick={this.props.afficherRepertoire}>{repertoireCourant1.chemin_repertoires}</button>
        <p>{repertoireCourant1.commentaires}</p>

        <FileUploadSection repertoireCourant={repertoireCourant1}/>
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
