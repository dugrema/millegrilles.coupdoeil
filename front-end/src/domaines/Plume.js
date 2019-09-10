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
    sauvegarder: contenuDocument => {
      console.debug("Sauvegarder document");
      console.debug(contenuDocument);
    },
    fermerEditeur: event => {
      this.setState({editionDocument: null});
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
          fonctionsEdition={this.fonctionsEdition}
          contenuDocument={this.state.contenuDocument} />
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

  constructor(props) {
    super(props);

    this.refEditeurQuill = React.createRef();

    this.state = {
      titre: '',
      dateCreation: Math.floor(new Date().getTime()/1000),
      dateModification: Math.floor(new Date().getTime()/1000),
      categories: '',
      texte: '',
      securite: '2.prive',
      modifie: false,
    }

    // Bind des fonctions
    this.sauvegarder = this.sauvegarder.bind(this);
    this.changerTitre = this.changerTitre.bind(this);
    this.changerTexte = this.changerTexte.bind(this);
    this.fermerEditeur = this.fermerEditeur.bind(this);
  }

  sauvegarder() {
    let editor = this.refEditeurQuill.current.getEditor();
    this.setState({
      texte: editor.getContents(),
      dateModification: Math.floor(new Date().getTime()/1000),
      modifie: false,
    }, ()=>{
      this.props.fonctionsEdition.sauvegarder({...this.state})
    });
  }

  changerTitre(event) {
    let value = event.currentTarget.value;
    this.setState({titre: value, modifie: true});
  }

  changerTexte(content, delta, source, editor) {
    this.setState({modifie: true});
  }

  fermerEditeur(event) {
    // if(this.state.modifie) {
    //   console.debug("Document modifie");
    //   let resultat = window.confirm("Document modifie, sauvegarder?");
    //   console.debug(resultat);
    // } else {
    this.props.fonctionsEdition.fermerEditeur();
    // }
  }

  componentDidMount() {

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
          <div>
            Titre document :
            <input type="text" value={this.state.titre} onChange={this.changerTitre}/>
          </div>
          <div>Date création : </div>
          <div><span title="(tags - minuscules, séparés par des espaces">Catégories</span> : </div>
        </div>
      </div>
    );
  }

  afficherActions() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <button
            onClick={this.sauvegarder}>Sauvegarder</button>
          <button
            onClick={this.fermerEditeur}>Fermer</button>
        </div>
      </div>
    );
  }

  afficherQuillEditeur() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <ReactQuill ref={this.refEditeurQuill} theme="snow"
                      defaultValue={this.state.texte}
                      onChange={this.changerTexte} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="w3-col m12">
        {this.afficherEntete()}
        {this.afficherInfoDoc()}
        {this.afficherActions()}
        {this.afficherQuillEditeur()}
      </div>
    );
  }

}
