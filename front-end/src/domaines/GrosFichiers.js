import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';

export class GrosFichiers extends React.Component {

  state = {

    // Variables pour navigation des repertoires/fichiers
    repertoireRacine: null,
    repertoireCourant: null,
    fichiersRepertoireCourant: null,

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
    ]
  };

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);

    // let requeteDocumentInitial =  {
    //   'requetes': [{
    //     'filtre': {'_mg-libelle': 'repertoire.racine'}
    //   }]};

    // this.chargerDocument(requeteDocumentInitial, 'repertoireRacine');
  }

  componentWillUnmount() {
    // console.debug("Unsubscribe GrosFichiers");
    webSocketManager.unsubscribe(this.config.subscriptions);
  }

  render() {
    let contenu;

    // Routing entre composants utilise this.state:
    //  - Si on a un senseur_id, on l'affiche.
    //  - Sinon si on a un noeud, on l'affiche.
    //  - Sinon on affiche la liste des noeuds.
    if(this.state.preparerUpload) {

    } else if (this.state.repertoireCourant) {

    } else {
      contenu = (
        <Accueil downloadUrl={this.state.downloadUrl}/>
      );
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">
            <h1>Domaine GrosFichiers</h1>
            {contenu}
          </div>
        </div>
      </div>
    );
  }

}

class Repertoire extends React.Component {

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

  render() {
    return (
      <div>
        {/* Formulaire utilise pour POST la requete avec authtoken */}
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

        <p>Liste de fichiers pour repertoire ...</p>
        <ul>
          <li>
            <button
              className="aslink"
              value="coupdeil.tar.gz"
              data-fuuid="/2019/07/20/17/20/000-112-001.dat"
              data-contenttype="application/gzip"
              onClick={this.download}>coupdeil.tar.gz</button>
          </li>
          <li>
            <button
              className="aslink"
              value="rabbit_config.json"
              data-fuuid="c0cd3c40-abef-11e9-ad39-5d4b39c1eca8"
              data-contenttype="text/plain"
              onClick={this.download}>rabbit_config.json</button>
          </li>
        </ul>
      </div>
    );
  }

}

class FileUploadSection extends React.Component {

  uploadFileProcessor = (acceptedFiles) => {
    // Traitement d'un fichier a uploader.
    console.log(acceptedFiles);

    // Demander un token (OTP) via websockets
    // Permet de se connecter au serveur pour transmetter le fichier.
    webSocketManager.demanderTokenTransfert()
    .then(token=>{
      // console.debug("Utilisation token " + token);
      let data = new FormData();
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

  let contenu;

  contenu = (
    <div>
      <p>Accueil</p>
      <Repertoire downloadUrl={props.downloadUrl} />
      <FileUploadSection />
    </div>
  );

  return contenu;
}
