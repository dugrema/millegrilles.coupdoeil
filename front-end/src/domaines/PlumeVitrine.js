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
        </Form>

        <Form>
          <Form.Group controlId="formSecionAccueil">
            <Form.Label><Trans>plume.vitrine.sectionAccueil</Trans></Form.Label>
            <Tabs activeKey={this.state.colonne} onSelect={this._setColonne}>
              {this._renderAccueilColonnes()}
            </Tabs>
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
      let inputGroups = [
        <InputGroupColonne key={languePrincipale} langue={languePrincipale} col={i}/>
      ];
      for(let idx in languesAdditionnelles) {
        let langue = languesAdditionnelles[idx];
        inputGroups.push(
          <InputGroupColonne key={langue} langue={langue} col={i}/>
        );
      }
      colonnes.push(
        <Tab eventKey={"col" + i} title={"Colonne " + i}>
          {inputGroups}
        </Tab>
      )
    }

    return colonnes;
  }

  _setColonne = colonne => {
    this.setState({colonne});
  }

}

function InputGroupColonne(props) {
  return (
    <InputGroup className="mb-3">
      <InputGroup.Prepend>
        <InputGroup.Text id={"texte-colonne_" + props.col}>
          <Trans>{'langues.' + props.langue}</Trans>
        </InputGroup.Text>
      </InputGroup.Prepend>
      <Form.Control as="textarea" rows="15" placeholder="Sans Nom"
                    name={"texteCol" + props.col} />
    </InputGroup>
  )
}
