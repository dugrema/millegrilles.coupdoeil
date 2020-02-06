import React from 'react';
import { Feuille } from '../mgcomponents/Feuilles';
import { Button, Row, Col } from 'react-bootstrap';
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

  requeteErreurs = () => {
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
            <Row>
              <Col>
                <Button onClick={this.requeteErreurs}>
                  <Trans>global.rafraichir</Trans>
                </Button>
              </Col>
            </Row>
          </Feuille>

          <ListeErreurs
            erreurs={this.state.listeErreurs}
            supprimerErreur={this.supprimerErreur} />

        </div>
      </div>
    );
  }

  supprimerErreur = event => {
    const value = event.currentTarget.value;
    // console.debug("Supprimer " + value);

    const commande = {
      'id_erreur': value
    }

    // Note : normalement ce serait une transaction ou une commande
    //        mais le traitement d'erreur fait partie de l'admin systeme
    //        L'operation se fait au travers d'une requete protegee
    const domaine = 'requete.millegrilles.domaines.Parametres.supprimerErreur';
    return webSocketManager.transmettreCommande(domaine, commande)
    .then( result => {
      // console.debug("Resultats commande");
      // console.debug(result);

      // Retirer l'erreur de la liste
      const listeErreurs = this.state.listeErreurs.filter(erreur=>{
        return erreur['_id'] !== value;
      })
      this.setState({listeErreurs});
    });

  }

}

function ListeErreurs(props) {

  var erreurs = null;
  if(props.erreurs) {
    erreurs = props.erreurs.map(erreur=>{
      return (
        <AfficherErreur
          key={erreur['_id']}
          supprimerErreur={props.supprimerErreur}
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
        <Col lg={3}><Trans>parametres.erreurs.date</Trans></Col>
        <Col lg={8}>
          <Trans values={{date: new Date(props['_mg-creation']*1000)}}>global.dateHeure</Trans>
          <span> </span>
          (<DateTimeFormatter date={props['_mg-creation']}/>)
        </Col>
        <Col lg={1}>
          <Button variant="danger" onClick={props.supprimerErreur} value={props['_id']}>
            <i className="fa fa-close"/>
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={3}>parametres.</Col>
        <Col lg={9}>{props.routing_key}</Col>
      </Row>

      <Row>
        <Col lg={3}><Trans>parametres.erreurs.erreur</Trans></Col>
        <Col lg={9}>
          {descriptionErreur}
        </Col>
      </Row>

      <Row>
        <Col>
          <Trans>parametres.erreurs.messageOriginal</Trans>
        </Col>
      </Row>
      <Row>
        <Col>
          <pre>{messageErreur}</pre>
        </Col>
      </Row>

      <Row>
        <Col>
          <Trans>parametres.erreurs.traceback</Trans>
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
