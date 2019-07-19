import React from 'react';
import Dropzone from 'react-dropzone';
import {tinyUploader} from '../utils/tiny_uploader';
import request from 'request';
import fs from 'fs';
import axios from 'axios';

import './GrosFichiers.css';
import webSocketManager from '../WebSocketManager';
import {dateformatter, numberformatter} from '../formatters';

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

    let requeteDocumentInitial =  {
      'requetes': [{
        'filtre': {'_mg-libelle': 'repertoire.racine'}
      }]};

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

    acceptedFiles.forEach(file => {
      // Commencer l'upload

      let data = new FormData();
      data.append('multiInputFilename', file);

      axios.post('/api/blobby', data)
        .then(response => this.uploadSuccess(response))
        .catch(error => this.uploadFail(error));

      // let form = new FormData();
      // form.append('')
      //
      // fetch('/api/blobby', {
      //   method: 'POST',
      //   body: file,
      // }).then(response => {
      //   console.debug(response);
      // }).catch(err => {
      //   console.error(err);
      // })

      // fs.createReadStream(file).pipe(request.put('/api/blobby'))
      //   .catch(err=>{
      //     console.error("Erreur dans stream");
      //     console.error(err);
      //   });

      // var req = request.post('/api/blobby', function (err, resp, body) {
      //   if (err) {
      //     console.log('Error!');
      //   } else {
      //     console.log('URL: ' + body);
      //   }
      // });
      // var form = req.form();
      // form.append('multiInputFilename', file);
      // req.send();

      // const putRequest = new XMLHttpRequest();
      // putRequest.open("POST", '/api/blobby', true);
      // putRequest.setRequestHeader('Content-type', 'text/plain; charset=utf-8');
      //
      // var form = putRequest.form;
      // form.append('multiInputFilename', file);

      // let readCb = (arrayBuffer) => {this.readChunk(putRequest, arrayBuffer);}
      // let errorCb = (event) => {this.errorChunk(putRequest, event}
      // let successCb = (file) => {this.successChunk(putRequest, file);}
      // let readyStateChange = (event) => {
      //   tinyUploader.fileUploadBinary(file, readCb, errorCb, successCb);
      // }

      // putRequest.send();
    });

  }

  readChunk = (putRequest, arrayBuffer) => {
    console.log(putRequest);
    console.log("Read chunk");
    // console.log(arrayBuffer);
  }

  errorChunk = (putRequest, event) => {
    console.log("Erreur");
    putRequest.close();
  }

  successChunk = (event) => {
    console.log("Success");
  }

  params = (files, xhr, chunk) => {
    // Traitement d'un fichier a uploader.
    console.log(files);
    console.log(xhr);
    console.log(chunk);
  }

  handleFileUpload = ({file}) => {
    console.log("Handle file upload");
    // console.log(e.currentTarget);
    // const file = e.currentTarget.file;
    console.log(file);
    let data = new FormData();
    data.append('multiInputFilename', file);

    axios.post('/api/blobby', data)
      .then(response => this.uploadSuccess(response))
      .catch(error => this.uploadFail(error));
  }

  uploadSuccess = (e) => {
    console.log(e);
  }

  uploadFail = (e) => {
    console.log(e);
  }

  render() {
    return (
      <form submit="/api/blobby">
        <Dropzone onDrop={this.uploadFileProcessor}>
          {({getRootProps, getInputProps}) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
        <input type="file" name="multiInputFilename" onChange={this.handleFileUpload}/>
      </form>
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
