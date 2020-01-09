import React from 'react';
import { Form, Button, ButtonGroup, ListGroup,
         Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';

const SUJET_CHARS_MAX = 70, TEXTE_CHARS_MAX = 200;

export class PlumeAnnonces extends React.Component {

  state = {
    sujetNouvelleAnnonce: '',
    texteNouvelleAnnonce: '',
    compteCharsRestantsSujet: SUJET_CHARS_MAX,
    compteCharsRestantsTexte: TEXTE_CHARS_MAX,
  }

  render() {
    return(
      <Row className="w3-row-padding">

        <Container className="w3-card w3-round w3-white w3-card_BR">
          <Row>
            <Col>
              <h2 className="w3-opacity"><Trans>plume.annonces.titre</Trans></h2>
              <p><Trans>plume.annonces.description</Trans></p>
            </Col>
          </Row>
        </Container>

        <RenderNouvelleAnnonce
          actions={this.actions}
          update={this.update}
          {...this.state} />

        <RenderAnnoncesRecentes />

      </Row>
    );
  }

  actions = {
    publierAnnonce: () => {
      console.debug("Publier annonce");
    }
  }

  update = {
    changerSujetNouvelleAnnonce: event => {
      let sujetNouvelleAnnonce = event.currentTarget.value;
      let compteCharsRestantsSujet = SUJET_CHARS_MAX - sujetNouvelleAnnonce.length;
      if(compteCharsRestantsSujet >= 0) {
        this.setState({sujetNouvelleAnnonce, compteCharsRestantsSujet});
      }
    },
    changerTexteNouvelleAnnonce: event => {
      let texteNouvelleAnnonce = event.currentTarget.value;
      let compteCharsRestantsTexte = TEXTE_CHARS_MAX - texteNouvelleAnnonce.length;
      if(compteCharsRestantsTexte >= 0) {
        this.setState({texteNouvelleAnnonce, compteCharsRestantsTexte});
      }
    }
  }

}

function RenderNouvelleAnnonce(props) {

  return (
    <Container className="w3-card w3-round w3-white w3-card_BR">
      <Row>
        <Col>
          <h2 className="w3-opacity"><Trans>plume.annonces.nouvelleAnnonce</Trans></h2>
          <p><Trans>plume.annonces.descriptionNouvelleAnnonce</Trans></p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Form className="formNouvelleAnnonce">
            <Form.Group controlId="formSujetAnnonce">
              <Form.Label><Trans>plume.annonces.sujetNouvelleAnnonce</Trans></Form.Label>
              <Form.Control type="plaintext" placeholder="Un sujet (optionnel)"
                            value={props.sujetNouvelleAnnonce}
                            onChange={props.update.changerSujetNouvelleAnnonce} />
              <Form.Text className="text-muted">
                <Trans values={{restants: props.compteCharsRestantsSujet}}>
                  plume.annonces.sujetNouvelleAnnonceInfo
                </Trans>
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="formTexteAnnonce">
              <Form.Label><Trans>plume.annonces.texteNouvelleAnnonce</Trans></Form.Label>
              <Form.Control type="plaintext" placeholder="Texte de l'annonce"
                            as="textarea" rows="4"
                            value={props.texteNouvelleAnnonce}
                            onChange={props.update.changerTexteNouvelleAnnonce} />
              <Form.Text className="text-muted">
                <Trans values={{restants: props.compteCharsRestantsTexte}}>
                  plume.annonces.texteNouvelleAnnonceInfo
                </Trans>
              </Form.Text>
            </Form.Group>
            <Button onClick={props.actions.publierAnnonce}>
              <Trans>plume.annonces.nouvelleAnnonceBoutonPublier</Trans>
            </Button>
          </Form>
        </Col>
      </Row>

    </Container>
  );
}

function RenderAnnoncesRecentes(props) {

  return (
    <Container className="w3-card w3-round w3-white w3-card_BR">
      <Row>
        <Col>
          <h2 className="w3-opacity"><Trans>plume.annonces.recentes</Trans></h2>
        </Col>
      </Row>
    </Container>
  );
}
