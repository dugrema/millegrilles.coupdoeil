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
        <Accueil />
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
              <p>Cliquer ou DnD fichiers ici.</p>
            </div>
          </section>
        )}
      </Dropzone>
    );
  }
}

function Accueil() {

  let contenu;

  contenu = (
    <div>
      <p>Accueil</p>
      <FileUploadSection />
    </div>
  );

  return contenu;
}
