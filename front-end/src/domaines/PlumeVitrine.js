import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles'
import { Form, Button, ButtonGroup, ListGroup,
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
        <SectionAccueil/>
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
    colonne: 'colonne1',
  }

  render() {
    return (
      <Feuille>
        <Row><Col><h3><Trans>plume.vitrine.sectionAccueil</Trans></h3></Col></Row>

        <Form>
          <Form.Group controlId="formMessageBienvenue">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="messageBienvenue" placeholder="Bienvenue sur Vitrine" />
          </Form.Group>
        </Form>

        <Form>
          <Row>
            <Tabs activeKey={this.state.colonne} onSelect={this._setColonne}>
              <Tab eventKey="col1" title="Colonne 1">
                Colonne 1
              </Tab>
              <Tab eventKey="col2" title="Colonne 2">
                Colonne 2
              </Tab>
              <Tab eventKey="col3" title="Colonne 3">
                Colonne 3
              </Tab>
            </Tabs>
          </Row>
        </Form>

      </Feuille>
    );
  }

  _setColonne = colonne => {
    this.setState({colonne});
  }

}
