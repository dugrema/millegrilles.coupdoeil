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

  pathRepertoire() {
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
        if(idx === dernier) {
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

    return pathRepertoire;
  }

  informationRepertoire() {
    console.log(this.props.repertoireCourant);
    return (
      <div>
        <div>
          {this.props.repertoireCourant.commentaires}
        </div>
      </div>
    );
  }

  render() {

    return (
      <div className="w3-card w3-round w3-white priveHeader">
        <div className="w3-container w3-padding">
          {this.pathRepertoire()}
          <FileUploadSection repertoireCourant={this.props.repertoireCourant}/>
          {this.informationRepertoire()}
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
              onClick={this.props.retourRepertoireFichier}>{fichierCourant.chemin_repertoires}</button>

            <div className="proprietes">
              <div>Date: {dateFichierCourant.toString()}</div>
              <div>Taille: { new Number(fichierCourant.taille / (1024*1024)).toFixed(2) } MB ({fichierCourant.taille} octets)</div>
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
      let taille = new Number(version.taille/(1024*1024)).toFixed(2);
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
        </li>
      );
    })

    return (
      <div className="w3-col m12">
        {informationFichier}

        <br/>

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

export class FileUploadSection extends React.Component {

  uploadFileProcessor = (acceptedFiles) => {
    // Traitement d'un fichier a uploader.
    console.debug(acceptedFiles);

    let repertoire_uuid = this.props.repertoireCourant.repertoire_uuid;
    let securite = this.props.repertoireCourant.securite;

    console.debug("Upload fichier avec securite: " + securite);

    // Demander un token (OTP) via websockets
    // Permet de se connecter au serveur pour transmetter le fichier.
    webSocketManager.demanderTokenTransfert()
    .then(token=>{
      // console.debug("Utilisation token " + token);
      let data = new FormData();
      data.append('repertoire_uuid', repertoire_uuid);
      data.append('securite', securite);
      acceptedFiles.forEach( file=> {
        data.append('grosfichier', file);
      })
      let config = {
        headers: {
          'authtoken': token,
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

  changerSecuriteRepertoire = event => {
    let securite = event.currentTarget.value;
    let repertoireUuid = this.props.repertoireCourant.repertoire_uuid;
    console.debug("changerSecuriteRepertoire: " + securite + " repertoire uuid: " + repertoireUuid);
    let transaction = {
      "repertoire_uuid": repertoireUuid,
      "securite": securite,
    }

    let routingKey = 'millegrilles.domaines.GrosFichiers.changerSecuriteRepertoire';
    webSocketManager.transmettreTransaction(routingKey, transaction)
    .then(msg=>{
      console.debug("Securite changee a " + securite + " pour repertoire " + repertoireUuid);
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
            <select
                value={this.props.repertoireCourant.securite}
                onChange={this.changerSecuriteRepertoire}>
              <option value="2.prive">Prive</option>
              <option value="3.protege">Protege</option>
            </select>
          </section>
        )}
      </Dropzone>
    );
  }
}
