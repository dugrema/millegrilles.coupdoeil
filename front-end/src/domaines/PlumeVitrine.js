import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ButtonGroup, ListGroup, InputGroup,
         Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';

export class PlumeVitrine extends React.Component {

  componentDidMount() {
    // webSocketManager.subscribe(subscriptions_annonces, this._recevoirMessageAnnoncesRecentes);
    // this.chargerAnnoncesRecentes();
  }

  componentWillUnmount() {
    // webSocketManager.unsubscribe(subscriptions_annonces);
  }

  render() {
    return (
      <div>
        <TitreVitrine/>
        <SectionAccueil {...this.props}/>
      </div>
    )
  }

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

  state = {
    colonne: 'col1',
    texteCol1: '',
    texteCol2: '',
    texteCol3: '',
  }

  render() {

    return (
      <Feuille>
        <Row><Col><h3><Trans>plume.vitrine.sectionAccueil</Trans></h3></Col></Row>

        <Form>
          <Form.Group controlId="formMessageBienvenue">
            <Form.Label><Trans>plume.vitrine.messageBienvenue</Trans></Form.Label>
            <Form.Control type="messageBienvenue" placeholder="Bienvenue sur Vitrine" />
          </Form.Group>

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

  _renderAccueilColonnes() {
    let languePrincipale = this.props.documentIdMillegrille.langue;
    let languesAdditionnelles = this.props.documentIdMillegrille.languesAdditionnelles;

    let colonnes = [];
    for(let i=1; i<=3; i++) {
      let texte = this.state['texteCol' + i];
      let titre = this.state['titreCol' + i];
      let inputGroupsTitre = [
        <InputGroupColonneTitre key={languePrincipale} col={i} texte={titre}
                           principal langue={languePrincipale}
                           changerTexteAccueil={this._changerTexteAccueil} />
      ];
      let inputGroupsTexte = [
        <InputGroupColonneTexte key={languePrincipale} col={i} texte={texte}
                           principal langue={languePrincipale}
                           changerTexteAccueil={this._changerTexteAccueil} />
      ];
      for(let idx in languesAdditionnelles) {
        let langue = languesAdditionnelles[idx];
        let titre = this.state['titreCol' + i + '_' + langue] || '';
        let texte = this.state['texteCol' + i + '_' + langue] || '';
        inputGroupsTitre.push(
          <InputGroupColonneTitre col={i} texte={titre}
                             key={langue} langue={langue}
                             changerTexteAccueil={this._changerTexteAccueil} />
        );
        inputGroupsTexte.push(
          <InputGroupColonneTexte col={i} texte={texte}
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
