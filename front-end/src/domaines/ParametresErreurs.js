import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles';
import { Form, Button, ButtonGroup, ButtonToolbar, ListGroup, InputGroup,
         Row, Col, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import webSocketManager from '../WebSocketManager';
import { Trans } from 'react-i18next';
import { DateTimeFormatter } from '../mgcomponents/ReactFormatters';

import './ParametresErreurs.css';

export class ParametresErreurs extends React.Component {

  state = {
    listeErreurs: []
  }

  componentDidMount() {
    this.requeteErreurs();
  }

  requeteErreurs() {
    let limit = 200;

    // const currentIndex = this.state.startingIndex;
    const domaine = 'requete.millegrilles.domaines.Parametres.erreurs';
    const requete = {};

    return webSocketManager.transmettreRequete(domaine, requete)
    .then( listeErreurs => {
      // console.debug("Resultats requete");
      // console.debug(listeErreurs);
      this.setState({listeErreurs});
    });

  }

  render() {
    return (
      <div className="w3-col m12 w3-row-padding">
        <div className="w3-row-padding">

          <Feuille>
            <Row><Col><h2><Trans>parametres.erreurs.titre</Trans></h2></Col></Row>
          </Feuille>

          <ListeErreurs erreurs={this.state.listeErreurs}/>

        </div>
      </div>
    );
  }

}

function ListeErreurs(props) {

  var erreurs = null;
  if(props.erreurs) {
    erreurs = props.erreurs.map(erreur=>{
      return (
        <AfficherErreur
          key={erreur['_id']}
          {...erreur} />
      );
    })
  }

  return (
    <div>
      {erreurs}
    </div>
  );
}

function AfficherErreur(props) {
  var descriptionErreur = props.erreur.erreur;
  var messageErreur = props.erreur.message_original;

  // Enlever wrapping b''
  messageErreur = messageErreur.slice(2, messageErreur.length -1);
  // console.debug("Message erreur")
  // console.debug(messageErreur)
  messageErreur = JSON.stringify(JSON.parse(messageErreur), null, 2);

  var stackTrace = props.erreur.stacktrace.reduce((result, valeur)=>{
    valeur = valeur.replace(/\\n/g, '');
    result = result + valeur;
    return result;
  },'');

  return (
    <Feuille>

      <Row>
        <Col lg={3}>Date</Col>
        <Col lg={8}>
          <Trans values={{date: new Date(props['_mg-creation']*1000)}}>global.dateHeure</Trans>
          <span> </span>
          (<DateTimeFormatter date={props['_mg-creation']}/>)
        </Col>
        <Col lg={1}>
          <Button variant="danger"><i className="fa fa-close"/></Button>
        </Col>
      </Row>

      <Row>
        <Col lg={3}>Routing key</Col>
        <Col lg={9}>{props.routing_key}</Col>
      </Row>

      <Row>
        <Col lg={3}>Erreur :</Col>
        <Col lg={9}>
          {descriptionErreur}
        </Col>
      </Row>

      <Row>
        <Col>
          Message original
        </Col>
      </Row>
      <Row>
        <Col>
          <pre>{messageErreur}</pre>
        </Col>
      </Row>

      <Row>
        <Col>
          Stacktrace / Traceback
        </Col>
      </Row>
      <Row>
        <Col>
          <pre>{stackTrace}</pre>
        </Col>
      </Row>

    </Feuille>
  );
}
