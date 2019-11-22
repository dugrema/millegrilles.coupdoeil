import React from 'react';
import Dropzone from 'react-dropzone';
// import webSocketManager from '../WebSocketManager';
import {dateformatter} from '../formatters'

export class Entete extends React.Component {
  render() {
    return(
      <div className="w3-card w3-round w3-white w3-card w3-card_BR">
        <div className="w3-container w3-padding">

          <div className="w3-row-padding">
            <div className="w3-col m2 bouton-home">
              <i title="Retour" className="fa fa-home fa-2x"/>
              <i title="Recherche" className="fa fa-search fa-2x"/>
            </div>
            <div className="w3-col m8 entete-titre">
              <h1>GrosFichiers</h1>
            </div>
            <div className="w3-col m1 bouton-home">
              <span title="Ajout collection" className="fa-stack fa-lg">
                <i className="fa fa-plus fa-stack-1x"/>
                <i className="fa fa-folder-o fa-stack-2x"/>
              </span>
            </div>
            <div className="w3-col m1">
              <FileUploadSection />
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export class Accueil extends React.Component {

  render() {
    return (
      <div className="w3-card_liste_BR">
        <Favoris
          favoris={this.props.favoris}
          />
        <ListeFichiers
          rapportActivite={this.props.rapportActivite}
          favorisParUuid={this.props.favorisParUuid}
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
          <button key={uuidFavori}>
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

  renderFichiers() {
    let fichiersRendered = [];

    if( this.props.rapportActivite ) {
      let fichiers = this.props.rapportActivite.fichiers;
      for(let idx in fichiers) {
        let fichier = fichiers[idx];

        let icone = (<i className="fa fa-file-o"/>);
        if(fichier['_mg-libelle'] === 'collection') {
          icone = (<i className="fa fa-folder-o"/>);
        }

        let dernierChangementRendered = renderDernierChangement(fichier['_mg-derniere-modification']);
        let cssFavori = 'favori-inactif';
        if(this.props.favorisParUuid[fichier.uuid]) {
          cssFavori = 'favori-actif';
        }

        fichiersRendered.push(
          <div key={fichier['_mg-derniere-modification']+fichier.uuid} className="w3-row-padding tableau-fichiers">

            <div className="w3-col m4">
              <input type="checkbox"/> {icone} {fichier.nom}
            </div>

            <div className="w3-col m5">
              {fichier.commentaires}
            </div>

            <div className="w3-col m1">
              <span className={"fa-stack " + cssFavori}>
                <i className='fa fa-star fa-stack-1x fond'/>
                <i className='fa fa-star-o fa-stack-1x'/>
              </span>
              <i className="fa fa-download"/>
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
