import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Plume.css';

export class Plume extends React.Component {

  state = {
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
    return (
      <div className="w3-col m9">
        <div className="w3-row-padding">
          <div className="w3-col m12">

            <div className="w3-card w3-round w3-white">
              <div className="w3-container w3-padding">
                <h2 className="w3-opacity">Plume</h2>
              </div>
            </div>

            <div className="w3-card w3-round w3-white">
              <div className="w3-container w3-padding">
                <PlumeEditeur
                  fonctionsEdition={this.fonctionsEdition}/>
              </div>
            </div>

          </div>
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
    categorie: null,
    texte: null,
  }

  render() {
    return (
      <ReactQuill value={this.state.texte}
                  onChange={this.props.fonctionsEdition.changementQuill} />
    );
  }

}
