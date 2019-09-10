import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Plume.css';

import webSocketManager from '../WebSocketManager';

export class Plume extends React.Component {

  state = {
    editionDocument: null,
    affichageDocument: null,
    listeDocuments: null,
  }

  fonctionsEdition = {
    sauvegarder: contenuDocument => {
      console.debug("Sauvegarder document");
      console.debug(contenuDocument);

      let contents = JSON.stringify(contenuDocument.texte);
      console.debug(contents);
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
      let domaine = 'requete.millegrilles.domaines.Plume';
      let requete = {
        'filtre': {
            '_mg-libelle': 'plume',
            // 'categories': {'$in': ['cat1']},
        },
        // 'sort': [('_mg-derniere-modification', -1)],
        'projection': {
            'uuid': 1,
            '_mg-creation': 1,
            '_mg-derniere-modification': 1,
            'categories': 1,
            'securite': 1,
            'titre': 1,
        }
      };
      let requetes = {'requetes': [requete]};
      webSocketManager.transmettreRequete(domaine, requetes)
      .then( docsRecu => {
        console.debug("Reponse requete, documents recu");
        console.debug(docsRecu);
        return docsRecu[0][0];  // Recuperer avec un then(resultats=>{})
     })
     .then(listeDocuments => this.setState({listeDocuments: listeDocuments}))
     .catch(err=>{
       console.error("Erreur requete documents plume");
       console.error(err);
     });
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

  componentDidMount() {
    // Faire requete pour charger la liste des documents
    this.fonctionsGestion.listerDocuments();
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
      quilldelta: '',
      securite: '2.prive',
      modifie: false,
      sauvegardeEnCours: false,
    }

    // Bind des fonctions
    this.sauvegarder = this.sauvegarder.bind(this);
    this.changerTitre = this.changerTitre.bind(this);
    this.changerTexte = this.changerTexte.bind(this);
    this.fermerEditeur = this.fermerEditeur.bind(this);
    this.changerCategories = this.changerCategories.bind(this);
  }

  sauvegarder() {
    let editor = this.refEditeurQuill.current.getEditor();
    this.setState({
      quilldelta: editor.getContents(),
      texte: editor.getText(),
      dateModification: Math.floor(new Date().getTime()/1000),
      modifie: false,
      sauvegardeEnCours: true,
    }, ()=>{
      let transaction = {
        titre: this.state.titre,
        categories: this.state.categories,
        texte: this.state.texte,
        quilldelta: this.state.quilldelta,
        securite: this.state.securite,
      }

      let domaine;
      if(this.state.uuid) {
        domaine = 'millegrilles.domaines.Plume.modifierDocument';
        transaction.uuid = this.state.uuid;
      } else {
        domaine = 'millegrilles.domaines.Plume.nouveauDocument';
      }
      webSocketManager.transmettreTransaction(domaine, transaction)
      .then(msg=>{
        if(msg.uuid) {
          // Nouveau document
          console.debug("Nouveau document cree: UUID " + msg.uuid);
          this.setState({
            uuid: msg.uuid,
            dateModification: msg['_mg-derniere-modification'],
            dateCreation: msg['_mg-creation'],
            sauvegardeEnCours: false,
          });
        } else {
          console.debug("Modification document completee");
          this.setState({
            dateModification: msg['_mg-derniere-modification'],
            sauvegardeEnCours: false,
          });
        }
        // let json_message = JSON.parse(msg);
        // Mettre en evidence le nouveau repertoire lorsqu'il arrivera a l'ecran.
      }).catch(err=>{
        console.error("Erreur sauvegarde fichier");
        console.error(err);
      });

      // this.setState({popupProps: {popupCreerRepertoireValeurs: null}});
      // this.props.fonctionsEdition.sauvegarder({...this.state})
    });
  }

  changerTitre(event) {
    let value = event.currentTarget.value;
    this.setState({titre: value, modifie: true});
  }

  changerCategories(event) {
    let value = event.currentTarget.value;
    this.setState({categories: value, modifie: true});
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
            <input type="text" value={this.state.titre} size='50' onChange={this.changerTitre}/>
          </div>
          <div>Date création : {this.state.dateCreation}</div>
          <div>Derniere modification : {this.state.dateModification}</div>
          <div>
            <span title="tags - minuscules, séparés par des espaces">Catégories</span> :
            <input type="text" value={this.state.categories} size='50' onChange={this.changerCategories}/>
          </div>
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
                      defaultValue={this.state.quilldelta}
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
