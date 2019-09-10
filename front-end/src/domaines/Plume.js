import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Plume.css';

export class Plume extends React.Component {

  state = {
    editionDocument: null,
    affichageDocument: null,
  }

  fonctionsEdition = {
    sauvegarder: event => {

    },
    appliquerDeltaLocal: event => {

    },
    changementQuill: event => {

    }
  }

  fonctionsGestion = {
    nouveauDocument: event => {
      this.setState({editionDocument: 'nouveau'});
    },
    editerDocument: event => {

    },
    listerDocuments: event => {

    },
    afficherDocument: event => {

    }
  }

  fonctionsPublication = {
    publierDocument: event => {

    },
    publierVersion: event => {

    }
  }

  render() {

    let contenu = null;
    if(this.state.editionDocument) {
      contenu = (
        <PlumeEditeur
          fonctionsEdition={this.fonctionsEdition}/>
      )
    } else {
      contenu = (
        <div className="w3-col m12">
          <div className="w3-card w3-round w3-white">
            <div className="w3-container w3-padding">
              <h2 className="w3-opacity">Plume</h2>

              <button
                onClick={this.fonctionsGestion.nouveauDocument}>Nouveau document</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          {contenu}
        </div>
      </div>
    )
  }

}

class PlumeEditeur extends React.Component {

  state = {
    titre: null,
    dateCreation: null,
    dateModification: null,
    categories: null,
    texte: null,
    securite: '2.prive',
  }

  afficherEntete() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Plume</h2>
        </div>
      </div>
    );
  }

  afficherInfoDoc() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <div>Titre document : </div>
          <div>Date création : </div>
          <div><span title="(tags - minuscules, séparés par des espaces">Catégories</span> : </div>
        </div>
      </div>
    );
  }

  afficherQuillEditeur() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <ReactQuill value={this.state.texte}
                      onChange={this.props.fonctionsEdition.changementQuill} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="w3-col m12">
        {this.afficherEntete()}
        {this.afficherInfoDoc()}
        {this.afficherQuillEditeur()}
      </div>
    );
  }

}
