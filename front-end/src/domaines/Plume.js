import React from 'react';
import ReactQuill from 'react-quill';
import { Form, Button, ButtonGroup, ListGroup,
         Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';
import {dateformatter} from '../formatters'
import { PlumeAnnonces } from './PlumeAnnonces'
import { PlumeVitrine } from './PlumeVitrine'

import 'react-quill/dist/quill.snow.css';
import './Plume.css';

const SECTIONS = {
  PlumeAnnonces, PlumeVitrine
}

export class Plume extends React.Component {

  state = {
    sectionCourante: '',
  }

  render() {

    var page;
    if(this.state.sectionCourante && this.state.sectionCourante !== '') {
      let SectionCourante = SECTIONS[this.state.sectionCourante];
      page = (<SectionCourante />)
    } else {
      page = (
        <Row className="w3-row-padding">
          <Container className="w3-card w3-round w3-white w3-card_BR">
            <Row>
              <Col>
                <h2 className="w3-opacity"><Trans>plume.pageTitre.titre</Trans></h2>
                <p><Trans>plume.pageTitre.description</Trans></p>
              </Col>
            </Row>
          </Container>
          <Container className="w3-card w3-round w3-white w3-card_BR">
            <Row>
              <Col>
                <ListGroup>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionAnnonces}>
                      <Trans>plume.pageTitre.liensAnnonces</Trans>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionVitrine}>
                      <Trans>plume.pageTitre.liensVitrine</Trans>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button className="aslink" onClick={this._versSectionDocuments}>
                      <Trans>plume.pageTitre.liensDocuments</Trans>
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Container>
        </Row>
      )
    }

    return (
      <div>
        {page}
      </div>
    )
  }

  _versSectionAnnonces = () => {
    this.setState({sectionCourante: 'PlumeAnnonces'});
  }

  _versSectionDocuments = () => {
    this.setState({sectionCourante: 'PlumeDocuments'});
  }

  _versSectionVitrine = () => {
    this.setState({sectionCourante: 'PlumeVitrine'});
  }

}

class PlumeDocuments extends React.Component {

  state = {
    editionDocument: null,
    affichageDocument: null,
  }

  fonctionsEdition = {
    fermerEditeur: event => {
      this.setState({editionDocument: null, affichageDocument: null});
    },
    fermerAffichage: event => {
      this.setState({affichageDocument: null});
    }
  }

  fonctionsGestion = {
    nouveauDocument: event => {
      this.setState({editionDocument: 'nouveau'});
    },
    editerDocument: event => {
      let uuid = event.currentTarget.value;
      this.setState({editionDocument: uuid});
    },
    supprimerDocument: uuid => {
      let transaction = {
        uuid: uuid,
      }

      let domaine = 'millegrilles.domaines.Plume.supprimerDocument';

      // Changement d'affichage si on a cliquer dans Edition ou Afficher
      this.setState({affichageDocument: null, editionDocument: null});

      return webSocketManager.transmettreTransaction(domaine, transaction);
    },
    afficherDocument: event => {
      let uuid = event.currentTarget.value;
      this.setState({affichageDocument: uuid});
    },
    publierDocument: event => {
      let uuid = event.currentTarget.value;
      let transaction = {
        uuid: uuid,
      }
      let domaine = 'millegrilles.domaines.Plume.publierDocument';

      return webSocketManager.transmettreTransaction(domaine, transaction);
    }
  }

  fonctionsPublication = {
    publierDocument: event => {

    },
    publierVersion: event => {

    }
  }

  componentDidMount() {
  }

  render() {

    let contenu = null;
    if(this.state.editionDocument) {
      contenu = (
        <PlumeEditeur
          fonctionsEdition={this.fonctionsEdition}
          editionDocument={this.state.editionDocument} />
      )
    } else if(this.state.affichageDocument) {
      contenu = (
        <PlumeAfficher
          fonctionsEdition={this.fonctionsEdition}
          fonctionsGestion={this.fonctionsGestion}
          affichageDocument={this.state.affichageDocument} />
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

          <ListeDocumentsPlume
            fonctionsGestion={this.fonctionsGestion} />

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

class ListeDocumentsPlume extends React.Component {

  state = {
    listeDocuments: null,
  }

  supprimerDocument = event => {
    let uuid = event.currentTarget.value;
    this.props.fonctionsGestion.supprimerDocument(uuid)
    .then(msg=>{
      let nouvelleListe = [];
      for(let idx in this.state.listeDocuments) {
        let doc = this.state.listeDocuments[idx];
        if(doc.uuid !== uuid) {
          nouvelleListe.push(doc);
        }
      }
      this.setState({listeDocuments: nouvelleListe});
    })
    .catch(err=>{
      console.error("Erreur suppression document");
      console.error(err);
    })
  }

  listerDocuments(event) {
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
      // console.debug("Reponse requete, documents recu");
      // console.debug(docsRecu);
      return docsRecu[0];  // Recuperer avec un then(resultats=>{})
   })
   .then(listeDocuments => this.setState({listeDocuments: listeDocuments}))
   .catch(err=>{
     console.error("Erreur requete documents plume");
     console.error(err);
   });
  }

  componentDidMount() {
    // Faire requete pour charger la liste des documents
    this.listerDocuments();
  }

  genererListe() {
    let liste = [];
    if(this.state.listeDocuments) {
      let listeDocuments = this.state.listeDocuments;
      for(var idx in listeDocuments) {
        let doc = listeDocuments[idx];
        // console.debug("Document: ");
        // console.debug(idx);
        // console.debug(doc);

        let titre;
        if(doc.titre) {
          titre = doc.titre;
        } else {
          titre = doc.uuid;
        }

        liste.push(
          <div key={doc.uuid}>
            <button className='aslink' onClick={this.props.fonctionsGestion.afficherDocument} value={doc.uuid}>{titre}</button>
            <button onClick={this.props.fonctionsGestion.editerDocument} value={doc.uuid}>Editer</button>
            <button onClick={this.supprimerDocument} value={doc.uuid}>Supprimer</button>
          </div>
        );
      }
    }

    return (
      <div>
        {liste}
      </div>
    );
  }

  render() {
    let liste = this.genererListe();

    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <h2 className="w3-opacity">Liste documents</h2>
          {liste}
        </div>
      </div>
    );
  }
}

class PlumeAfficher extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      uuid: props.affichageDocument,
      titre: '',
      dateCreation: '',
      dateModification: '',
      categories: '',
      texte: '',
      quilldelta: '',
      securite: '2.prive',
      documentPret: false,
    }

    // Bind des fonctions
  }

  chargerDocument(uuid) {
    let domaine = 'requete.millegrilles.domaines.Plume';
    let requete = {
      'filtre': {
          '_mg-libelle': 'plume',
          'uuid': uuid,
      },
    };
    let requetes = {'requetes': [requete]};
    webSocketManager.transmettreRequete(domaine, requetes)
    .then( docsRecu => {
      // console.debug("Reponse requete, document recu");
      // console.debug(docsRecu);
      return docsRecu[0][0];  // Recuperer avec un then(resultats=>{})
   })
   .then(msg => {
     this.setState({
       titre: msg.titre,
       categories: msg.categories.join(' '),
       dateModification: msg['_mg-derniere-modification'],
       dateCreation: msg['_mg-creation'],
       datePublication: msg['datePublication'],
       texte: msg.texte,
       quilldelta: msg.quilldelta,
       securite: msg.securite,
       documentPret: true,
     });

   })
   .catch(err=>{
     console.error("Erreur requete document plume");
     console.error(err);
   });
  }

  componentDidMount() {
    this.chargerDocument(this.state.uuid);
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
          <div>Titre document : {this.state.titre}</div>
          <div>Date création : {dateformatter.format_datetime(this.state.dateCreation)}</div>
          <div>Derniere modification : {dateformatter.format_datetime(this.state.dateModification)}</div>
          <div>Date publication : {dateformatter.format_datetime(this.state.datePublication)}</div>
          <div>Catégories : {this.state.categories}</div>
        </div>
      </div>
    );
  }

  afficherActions() {
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <button onClick={this.props.fonctionsGestion.editerDocument} value={this.state.uuid}>Editer</button>
          <button onClick={this.props.fonctionsGestion.supprimerDocument} value={this.state.uuid}>Supprimer</button>
          <button onClick={this.props.fonctionsGestion.publierDocument} value={this.state.uuid}>Publier</button>
          <button onClick={this.props.fonctionsEdition.fermerAffichage}>Fermer</button>
        </div>
      </div>
    );
  }

  afficherQuillEditeur() {
    let modules={toolbar: null};
    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <ReactQuill ref={this.refEditeurQuill} theme="snow"
                      defaultValue={this.state.quilldelta}
                      onChange={this.changerTexte}
                      readOnly={true}
                      modules={modules}/>
        </div>
      </div>
    )
  }

  render() {
    let mainArea;
    if(this.state.documentPret) {
      mainArea = (
        <div>
          {this.afficherInfoDoc()}
          {this.afficherActions()}
          {this.afficherQuillEditeur()}
        </div>
      );
    } else {
      mainArea = (
        <div>Chargement du document en cours</div>
      )
    }
    return (
      <div className="w3-col m12">
        {this.afficherEntete()}
        {mainArea}
      </div>
    );
  }

}

class PlumeEditeur extends React.Component {

  constructor(props) {
    super(props);

    this.refEditeurQuill = React.createRef();

    let uuid = null, documentPret = true;
    if(props.editionDocument !== 'nouveau') {
      uuid = props.editionDocument;
      documentPret = false; // En fait c'est pour indiquer chargement en cours
    }

    this.state = {
      uuid: uuid,
      titre: '',
      dateCreation: '',
      dateModification: '',
      categories: '',
      texte: '',
      quilldelta: '',
      securite: '2.prive',
      modifie: false,
      sauvegardeEnCours: false,
      documentPret: documentPret,
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
          // console.debug("Nouveau document cree: UUID " + msg.uuid);
          this.setState({
            uuid: msg.uuid,
            dateModification: msg['_mg-derniere-modification'],
            dateCreation: msg['_mg-creation'],
            sauvegardeEnCours: false,
          });
        } else {
          // console.debug("Modification document completee");
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
    this.setState({texte: content, modifie: true});
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

  chargerDocument(uuid) {
    let domaine = 'requete.millegrilles.domaines.Plume';
    let requete = {
      'filtre': {
          '_mg-libelle': 'plume',
          'uuid': uuid,
      },
    };
    let requetes = {'requetes': [requete]};
    webSocketManager.transmettreRequete(domaine, requetes)
    .then( docsRecu => {
      // console.debug("Reponse requete, document recu");
      // console.debug(docsRecu);
      return docsRecu[0][0];  // Recuperer avec un then(resultats=>{})
   })
   .then(msg => {
     // console.debug("Contenu charge: ");
     // console.debug(msg);

     this.setState({
       titre: msg.titre,
       categories: msg.categories.join(' '),
       dateModification: msg['_mg-derniere-modification'],
       dateCreation: msg['_mg-creation'],
       texte: msg.texte,
       quilldelta: msg.quilldelta,
       securite: msg.securite,
       sauvegardeEnCours: false,
       documentPret: true,
     }, ()=>{
       // console.debug("Etat apres chargement");
       // console.debug(this.state);
       // let editor = this.refEditeurQuill.current.getEditor();
       // editor.setContents(this.state.quilldelta);
       // this.refEditeurQuill.setContents(this.state.quilldelta);
     });
   })
   .catch(err=>{
     console.error("Erreur requete documents plume");
     console.error(err);
   });
  }

  componentDidMount() {
    // Verifier si on edite un fichier existant ou un nouveau fichier
    if(this.state.uuid) {
      // Charger le document
      this.chargerDocument(this.state.uuid);
    }
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
            <input type="text" value={this.state.titre} size='50' onChange={this.changerTitre} />
          </div>
          <div>Date création : {dateformatter.format_datetime(this.state.dateCreation)}</div>
          <div>Derniere modification : {dateformatter.format_datetime(this.state.dateModification)}</div>
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
    let toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction

        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],

        //['link', 'image', 'imageLink'],
        ['link', 'image'],

        ['clean']                                         // remove formatting button
    ];
    // function imageHandler() {
    //     var range = this.quill.getSelection();
    //     var value = prompt('What is the image URL');
    //     if(value){
    //         this.quill.insertEmbed(range.index, 'image', value, 'USER');
    //     }
    // }

    let modules = {
      toolbar: {
        container: toolbarOptions,
        handlers: {
          // imageLink: imageHandler
        }
      }
    }

    return (
      <div className="w3-card w3-round w3-white">
        <div className="w3-container w3-padding">
          <ReactQuill ref={this.refEditeurQuill} theme="snow"
                      defaultValue={this.state.quilldelta}
                      onChange={this.changerTexte}
                      modules={modules} />
        </div>
      </div>
    )
  }

  render() {
    let mainArea;
    if(this.state.documentPret) {
      mainArea = (
        <div>
          {this.afficherInfoDoc()}
          {this.afficherActions()}
          {this.afficherQuillEditeur()}
        </div>
      );
    } else {
      mainArea = (
        <div>Chargement du document en cours</div>
      )
    }
    return (
      <div className="w3-col m12">
        {this.afficherEntete()}
        {mainArea}
      </div>
    );
  }

}
