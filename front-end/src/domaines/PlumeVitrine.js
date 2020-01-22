import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ButtonGroup, ListGroup, InputGroup,
         Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';

const ROUTING_VITRINE_ACCUEIL = 'noeuds.source.millegrilles_domaines_Plume.documents.vitrine.accueil';
const subscriptions_plumeVitrine = [
  ROUTING_VITRINE_ACCUEIL
]

export class PlumeVitrine extends React.Component {

  render() {
    return (
      <div>
        <TitreVitrine/>
        <SectionAccueil {...this.props}/>
      </div>
    )
  }

}

function extraireChampMultilingue(champ, suffixe) {
  // Extraire le nom de champ (e.g. champ_langue)
  let champStruct = champ.split('_');

  // Ajouter ColN (e.g. texteCol1)
  let champModif = champStruct[0] + suffixe;

  // Ajouter le language au besoin
  if(champStruct.length > 1) {
    champModif = champModif + '_' + champStruct[1];
  }

  return champModif;
}

function TitreVitrine(props) {
  return (
    <Feuille>
      <Row>
        <Col>
          <h2 className="w3-opacity"><Trans>plume.vitrine.titre</Trans></h2>
        </Col>
      </Row>
    </Feuille>
  )
}

class SectionAccueil extends React.Component {

  constructor(props) {
    super(props);

    this.languePrincipale = this.props.documentIdMillegrille.langue;
    const languesAdditionnelles = this.props.documentIdMillegrille.languesAdditionnelles;

    this.languesListHelper = [
      '', ...languesAdditionnelles
    ]

    const state = {
      colonne: '',
      colonnes: [],
    }

    this.languesListHelper.forEach(l=>{
    //   for(let idx=1; idx<=3; idx++) {
    //     let suffixe = 'Col' + idx;
    //     if(l !== '') suffixe += '_' + l;
    //
    //     state['texte' + suffixe] = '';
    //     state['titre' + suffixe] = '';
    //   }
    //
      let suffixe = '';
      if(l !== '') suffixe += '_' + l;
      state['messageBienvenue' + suffixe] = '';
    })

    // console.debug("Init state: ")
    // console.debug(state);

    this.state = state;
  }

  componentDidMount() {
    webSocketManager.subscribe(subscriptions_plumeVitrine, this._recevoirMessageAccueil);
    this.chargerDocumentAccueil();
  }

  componentWillUnmount() {
    webSocketManager.unsubscribe(subscriptions_plumeVitrine);
  }


  render() {

    const messageBienvenue = this.languesListHelper.map(l=>{
      let suffixe = '', languePrepend = 'langues.' + l;
      if(l==='') {
        languePrepend = 'langues.' + this.languePrincipale;
      } else {
        suffixe = '_' + l;
      }

      return (
        <Form.Group key={languePrepend} controlId={"formMessageBienvenue" + suffixe}>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>
                <Trans>{languePrepend}</Trans>
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control name={'messageBienvenue' + suffixe}
                          value={this.state['messageBienvenue' + suffixe]}
                          onChange={this._changerBienvenue}
                          placeholder="Bienvenue sur Vitrine" />
          </InputGroup>
        </Form.Group>
      );
    })

    return (
      <Feuille>
        <Row><Col><h3><Trans>plume.vitrine.sectionAccueil</Trans></h3></Col></Row>

        <Form>

          <p><Trans>plume.vitrine.messageBienvenue</Trans></p>
          {messageBienvenue}

          <Row>
            <Col>
              <Button onClick={this.ajouterColonne}>
                <Trans>plume.vitrine.ajouterColonne</Trans>
              </Button>
            </Col>
          </Row>

          <Tabs activeKey={this.state.colonne} onSelect={this._setColonne}>
            {this._renderAccueilColonnes()}
          </Tabs>

          <Form.Group controlId="formMessageBienvenue">
            <Button onClick={this.soumettre} value="sauvegarder">
              <Trans>global.sauvegarder</Trans>
            </Button>
            <Button onClick={this.soumettre} variant="danger" value="publier">
              <Trans>global.publier</Trans>
            </Button>
          </Form.Group>

        </Form>

      </Feuille>
    );
  }

  chargerDocumentAccueil() {
    const domaine = 'requete.millegrilles.domaines.Plume';
    const requete = {'requetes': [
      {
        'filtre': {
          '_mg-libelle': {'$in': ['vitrine.accueil']},
        }
      }
    ]};

    return webSocketManager.transmettreRequete(domaine, requete)
    .then( docsRecu => {
      // console.debug("Resultats requete");
      // console.debug(docsRecu);
      let accueilVitrine = docsRecu[0][0];
      this.extraireContenuAccueilVitrine(accueilVitrine)
    });
  }

  _recevoirMessageAccueil = (routingKey, doc) => {
    // console.debug("Recevoir fichier update");
    if(routingKey === ROUTING_VITRINE_ACCUEIL) {
      this.extraireContenuAccueilVitrine(doc)
    }
  }

  extraireContenuAccueilVitrine(accueilVitrine) {
    const majState = {};

    const champsMultilingue = ['messageBienvenue'];

    // Copier les champs multilingues "flat"
    for(let champ in accueilVitrine) {
      champsMultilingue.forEach(champMultilingue=>{
        if(champ.startsWith(champMultilingue)) {
          majState[champ] = accueilVitrine[champ];
        }
      })
    }

    if(accueilVitrine.portail) {
      for(let idxPortail in accueilVitrine.portail) {
        let section = accueilVitrine.portail[idxPortail];

        if(section.type === 'deck') {
          majState.colonnes = section.cartes;

          if(this.state.colonne === '') {
            majState.colonne = 'col0';
          }
        }
      }
    }

    // console.debug("MAJ state");
    // console.debug(majState);
    this.setState({...majState});
  }

  _renderAccueilColonnes() {
    let languePrincipale = this.props.documentIdMillegrille.langue;
    let languesAdditionnelles = this.props.documentIdMillegrille.languesAdditionnelles;

    const colonnes = [];
    for(let i in this.state.colonnes) {
      const colonne = this.state.colonnes[i];

      const inputGroupsTitre = [], inputGroupsTexte = [];
      this.languesListHelper.forEach(l => {
        let langue = l, suffix = l?'_'+l:'';
        if(!l) {
          langue = this.languePrincipale;
        }
        inputGroupsTitre.push(
          <InputGroupColonneTexte key={langue} col={i} texte={colonne['titre' + suffix]}
                             colname="titre" key={langue} langue={langue} suffix={l}
                             changerTexteAccueil={this._changerTexteAccueil} />
        );
        inputGroupsTexte.push(
          <InputGroupColonneTexte key={langue} col={i} texte={colonne['texte' + suffix]}
                             key={langue} langue={langue} suffix={l} rows={15}
                             changerTexteAccueil={this._changerTexteAccueil} />
        );
      })

      const noCol = parseInt(i) + 1;
      colonnes.push(
        <Tab key={i} eventKey={"col" + i} title={"Colonne " + noCol}>
          <p><Trans>plume.vitrine.accueilTitre</Trans></p>
          {inputGroupsTitre}
          <p><Trans>plume.vitrine.accueilTexte</Trans></p>
          {inputGroupsTexte}
        </Tab>
      )
    }

    return colonnes;
  }

  _setColonne = colonne => {
    this.setState({colonne});
  }

  _changerTexteAccueil = event => {
    let name = event.currentTarget.name;
    let col = event.currentTarget.dataset.col;
    let value = event.currentTarget.value;

    let colonnes = [...this.state.colonnes]; // Cloner
    let colonne = colonnes[col];
    colonne[name] = value;

    this.setState({colonnes});
  }

  _changerBienvenue = event => {
    let name = event.currentTarget.name;
    let value = event.currentTarget.value;

    let dictUpdate = {};
    dictUpdate[name] = value;

    this.setState(dictUpdate);
  }

  soumettre = event => {
    let operation = event.currentTarget.value;
    let domaine = 'millegrilles.domaines.Plume.majAccueilVitrine';
    let transaction = {...this.state, operation}; // Cloner l'etat
    delete transaction.colonne; // Colonne est une valeur interne

    webSocketManager.transmettreTransaction(domaine, transaction)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction majAccueilVitrine");
      }
    })
    .catch(err=>{
      console.error("Erreur transaction majAccueilVitrine");
      console.error(err);
    });
  }

  ajouterColonne = event => {
    var colonnes = this.state.colonnes;
    const champs = [
      'titre', 'texte'
    ]

    // Max de 3 colonnes
    if(colonnes.length < 3) {
      // Initialiser les valeurs
      const contenuColonne = {};
      this.languesListHelper.forEach(l=>{
        if(l !== '') l = '_' + l;
        champs.forEach(champ => contenuColonne[champ + l] = '' )
      })

      colonnes.push(contenuColonne);
    }

    // console.debug("Colonnes");
    // console.debug(colonnes);
    this.setState(colonnes);
  }

}

function InputGroupColonneTexte(props) {
  let texteColName = props.colname || 'texte';
  if(props.suffix && props.suffix !== '') {
    texteColName = texteColName + '_' + props.suffix;
  }

  let formControl;
  if(props.rows) {
    formControl = (
      <Form.Control placeholder="Sans Nom" as="textarea" rows={props.rows}
                  name={texteColName} value={props.texte} data-col={props.col}
                  onChange={props.changerTexteAccueil} />
    );
  } else {
    formControl = (
      <Form.Control placeholder="Sans Nom"
                    name={texteColName} value={props.texte}
                    onChange={props.changerTexteAccueil} data-col={props.col}/>
    );
  }

  return (
    <Form.Group controlId={"form" + texteColName + props.col}>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>
            <Trans>{'langues.' + props.langue}</Trans>
          </InputGroup.Text>
        </InputGroup.Prepend>
        {formControl}
      </InputGroup>
    </Form.Group>
  )
}
