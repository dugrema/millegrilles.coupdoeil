import React from 'react';
import { Form, Button, ButtonGroup, ListGroup,
         Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';

const SUJET_CHARS_MAX = 70, TEXTE_CHARS_MAX = 200;

const subscriptions_annonces = [
  'noeuds.source.millegrilles_domaines_Plume.documents.annonces.recentes'
]

export class PlumeAnnonces extends React.Component {

  state = {
    sujetNouvelleAnnonce: '',
    texteNouvelleAnnonce: '',
    compteCharsRestantsSujet: SUJET_CHARS_MAX,
    compteCharsRestantsTexte: TEXTE_CHARS_MAX,
    annoncesRecentes: null,
  }

  componentDidMount() {
    webSocketManager.subscribe(subscriptions_annonces, this._recevoirMessageAnnoncesRecentes);
    this.chargerAnnoncesRecentes();
  }

  componentWillUnmount() {
    webSocketManager.unsubscribe(subscriptions_annonces);
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

        <RenderAnnoncesRecentes
          annoncesRecentes={this.state.annoncesRecentes} />

      </Row>
    );
  }

  actions = {
    publierAnnonce: () => {
      if(this.state.texteNouvelleAnnonce && this.state.texteNouvelleAnnonce !== '') {
        const transaction = {
          texte: this.state.texteNouvelleAnnonce,
        }
        if(this.state.sujetNouvelleAnnonce && this.state.sujetNouvelleAnnonce !== '') {
          transaction.sujet = this.state.sujetNouvelleAnnonce;
        }

        let domaine = 'millegrilles.domaines.Plume.creerAnnonce';
        webSocketManager.transmettreTransaction(domaine, transaction)
        .then(reponse=>{
          if(reponse.err) {
            console.error("Erreur transaction");
          }

          // Reset formulaire
          this.setState({
            sujetNouvelleAnnonce: '',
            texteNouvelleAnnonce: '',
            compteCharsRestantsSujet: SUJET_CHARS_MAX,
            compteCharsRestantsTexte: TEXTE_CHARS_MAX,
          })
        })
        .catch(err=>{
          console.error("Erreur sauvegarde");
          console.error(err);
        });
      } else {
        console.error("Publier annonce, erreur: texte vide");
      }
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

  chargerAnnoncesRecentes() {
    let routingKey = 'requete.millegrilles.domaines.Plume.chargerAnnoncesRecentes';
    webSocketManager.transmettreRequete(routingKey, {})
    .then(annoncesRecentes => {
      console.debug("Message annonces recentes");
      console.debug(annoncesRecentes);
      this.setState({annoncesRecentes});
    })
    .catch(err=>{
      console.error("Erreur requete annonces recentes");
      console.error(err);
    });
  }

  _recevoirMessageAnnoncesRecentes = (routingKey, message) => {
    console.debug("Message annonces recentes");
    console.debug(message);
    this.setState({annoncesRecentes: message});
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

  console.debug("Props annonces recentes");
  console.debug(props);

  const annonces = [];
  if(props.annoncesRecentes) {
    for(let idx in props.annoncesRecentes.annonces) {
      let annonce = props.annoncesRecentes.annonces[idx];

      var sujet, texte, dateElement;
      if(annonce.sujet) {
        sujet = (
          <h3 className="sujet-message">
            {annonce.sujet}
          </h3>
        );
      }
      if(annonce.texte) {
        texte = (
          <p className="texte-message">
            {annonce.texte}
          </p>
        );
      }
      if(annonce['_mg-creation']) {
        dateElement = renderDateModifiee(annonce['_mg-creation']);
      }

      annonces.push(
        <Row key={annonce.uuid} className="message">
          <Col sm={2}>
            {dateElement}
          </Col>
          <Col sm={10}>
            {sujet}
            {texte}
          </Col>
        </Row>
      );
    }
  }

  return (
    <Container className="w3-card w3-round w3-white w3-card_BR">
      <Row>
        <Col>
          <h2 className="w3-opacity"><Trans>plume.annonces.recentes</Trans></h2>
        </Col>
      </Row>

      {annonces}

    </Container>
  );
}

function renderDateModifiee(dateModifieeEpoch) {
  const anneeCourante = new Date().getFullYear();
  const dateModifiee = new Date(dateModifieeEpoch * 1000);
  let labelDate;
  if(dateModifiee.getFullYear() === anneeCourante) {
    labelDate = 'global.dateModifiee';
  } else {
    labelDate = 'global.dateAnneeModifiee';
  }

  var dateElement = (
    <div className="date-message">
      <div className="date-modifiee">
        <Trans values={{date: dateModifiee}}>{labelDate}</Trans>
      </div>
      <div className="heure-modifiee">
        <Trans values={{date: dateModifiee}}>global.heureModifiee</Trans>
      </div>
    </div>
  )

  return dateElement;
}
