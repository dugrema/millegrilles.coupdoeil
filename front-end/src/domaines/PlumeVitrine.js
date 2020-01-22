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
      colonne: 'col1',
    }

    this.languesListHelper.forEach(l=>{
      for(let idx=1; idx<=3; idx++) {
        let suffixe = 'Col' + idx;
        if(l !== '') suffixe += '_' + l;

        state['texte' + suffixe] = '';
        state['titre' + suffixe] = '';
      }

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
      let languePrepend = 'langues.' + l;
      if(l==='') {
        languePrepend = 'langues.' + this.languePrincipale;
      }
      let suffixe = '';
      if(l) suffixe = '_' + l;

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
          let colonnes = [];
          for(let idx in section.cartes) {
            let col = parseInt(idx) + 1;
            let carte = section.cartes[idx];
            for(let champCarte in carte) {
              let champ = extraireChampMultilingue(champCarte, 'Col' + col);
              // console.debug("Champ carte " + champCarte + ' = ' + champ);
              // Conserver la valeur
              majState[champ] = carte[champCarte];
            }
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

    let colonnes = [];
    for(let i=1; i<=3; i++) {
      let inputGroupsTitre = [
        <InputGroupColonneTitre key={languePrincipale} col={i} texte={this.state['titreCol' + i]}
                           principal langue={languePrincipale}
                           changerTexteAccueil={this._changerTexteAccueil} />
      ];
      let inputGroupsTexte = [
        <InputGroupColonneTexte key={languePrincipale} col={i} texte={this.state['texteCol' + i]}
                           principal langue={languePrincipale}
                           changerTexteAccueil={this._changerTexteAccueil} />
      ];
      for(let idx in languesAdditionnelles) {
        let langue = languesAdditionnelles[idx];
        inputGroupsTitre.push(
          <InputGroupColonneTitre col={i} texte={this.state['titreCol' + i + '_' + langue]}
                             key={langue} langue={langue}
                             changerTexteAccueil={this._changerTexteAccueil} />
        );
        inputGroupsTexte.push(
          <InputGroupColonneTexte col={i} texte={this.state['texteCol' + i + '_' + langue]}
                             key={langue} langue={langue}
                             changerTexteAccueil={this._changerTexteAccueil} />
        );
      }
      colonnes.push(
        <Tab key={i} eventKey={"col" + i} title={"Colonne " + i}>
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
    let value = event.currentTarget.value;

    let dictUpdate = {};
    dictUpdate[name] = value;

    this.setState(dictUpdate);
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

}

function InputGroupColonneTitre(props) {
  let texteColName = 'titreCol' + props.col;
  if(!props.principal) {
    texteColName = texteColName + '_' + props.langue;
  }

  return (
    <Form.Group controlId={"form" + texteColName}>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>
            <Trans>{'langues.' + props.langue}</Trans>
          </InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control placeholder="Sans Nom"
                      name={texteColName} value={props.texte}
                      onChange={props.changerTexteAccueil}/>
      </InputGroup>
    </Form.Group>
  )
}

function InputGroupColonneTexte(props) {
  let texteColName = 'texteCol' + props.col;
  if(!props.principal) {
    texteColName = texteColName + '_' + props.langue;
  }

  return (
    <Form.Group controlId={"form" + texteColName}>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>
            <Trans>{'langues.' + props.langue}</Trans>
          </InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control as="textarea" rows="15" placeholder="Sans Nom"
                      name={texteColName} value={props.texte}
                      onChange={props.changerTexteAccueil}/>
      </InputGroup>
    </Form.Group>
  )
}
