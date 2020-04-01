import React from 'react';
import webSocketManager from '../WebSocketManager';

import { Alert, Form, Container, Row, Col,
         Button, ButtonGroup, InputGroup} from 'react-bootstrap';
import { Feuille } from '../mgcomponents/Feuilles';
import { Trans, Translation } from 'react-i18next';

import './Backup.css';

export class Backup extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      ecranCourant: null,
    }

    //   subscriptions: Le nom des routing keys qui vont etre ecoutees
    this.config = {
      subscriptions: [
        'noeuds.source.millegrilles_domaines_Backup.tada',
      ]
    };

  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    webSocketManager.subscribe(this.config.subscriptions, this.processMessage);
  }

  afficherEcran = event => {
    const {value} = event.currentTarget;
    this.setState({ecranCourant: value});
  }

  retourInitiale = () => {
    this.setState({ecranCourant: null});
  }

  render() {
    let ecranCourant = this.state.ecranCourant;

    let contenu;
    if(ecranCourant === 'backupCles') {
      contenu = null;
    } else if(ecranCourant === 'configurer') {
      contenu = null;
    } else if(ecranCourant === 'lancerBackup') {
      contenu = <PageOperationsBackup />;
    } else {
      contenu = <PageInitiale
                  fonctionsNavigation={{afficherEcran: this.afficherEcran}}
                  />;
    }

    return (
      <div className="w3-col m9 w3-row-padding">
        <div className="w3-row-padding">
          {contenu}
        </div>
      </div>
    );
  }

}

function PageInitiale(props) {

  return (
    <Feuille>

      <Row><Col><h2 className="w3-opacity"><Trans>backup.initiale.titre</Trans></h2></Col></Row>

      <Row>
        <ul>
          <li>
            <Button className="aslink" onClick={props.fonctionsNavigation.afficherEcran} value="backupCles">
              <Trans>backup.initiale.lienBackupCles</Trans>
            </Button>
          </li>
          <li>
            <Button className="aslink" onClick={props.fonctionsNavigation.afficherEcran} value="configurer">
              <Trans>backup.initiale.configurer</Trans>
            </Button>
          </li>
          <li>
            <Button className="aslink" onClick={props.fonctionsNavigation.afficherEcran} value="lancerBackup">
              <Trans>backup.initiale.lancerBackup</Trans>
            </Button>
          </li>
        </ul>
      </Row>

    </Feuille>
  );
}

class PageOperationsBackup extends React.Component {

  declencherBackup = event => {
    const routing = 'commande.global.declencherBackupHoraire';
    webSocketManager.transmettreCommande(
      routing,
      {
        heure: Math.trunc(new Date().getTime() / 1000),
        securite: '2.prive',
      },
      {nowait: true}
    );
  }

  resetBackup = event => {
    // console.debug("Commande reset backup");
    const routing = 'commande.global.resetBackup';
    webSocketManager.transmettreCommande(
      routing,
      {},
      {nowait: true}
    );
  }

  restaurerBackup = event => {
    // console.debug("Commande restaurer backup");
    const routing = 'commande.backup.preparerStagingRestauration';
    webSocketManager.transmettreCommande(
      routing,
      {},
      {nowait: true}
    );
  }

  regenerer = event => {
    const routing = 'commande.global.regenerer';
    webSocketManager.transmettreCommande(
      routing,
      {},
      {nowait: true}
    );
  }

  render() {
    return (
      <div>

        <Feuille>
          <Row><Col><h2 className="w3-opacity"><Trans>backup.lancer.titre</Trans></h2></Col></Row>
          <Row><Col><Trans>backup.lancer.instructions_1</Trans></Col></Row>
        </Feuille>

        <Feuille>
          <Row>
            <Col><Trans>backup.lancer.instructions_2</Trans></Col>
          </Row>
          <Row>
            <Col>
              <Button onClick={this.declencherBackup}>
                <Trans>backup.lancer.boutonDeclencher</Trans>
              </Button>
              <Button onClick={this.restaurerBackup} variant="secondary">
                <Trans>backup.lancer.boutonRestaurer</Trans>
              </Button>
              <Button onClick={this.regenerer} variant="secondary">
                <Trans>backup.lancer.boutonRegenerer</Trans>
              </Button>
            </Col>
          </Row>
        </Feuille>

        <Feuille>
          <Row>
            <Col lg={8}>
              <Trans>backup.lancer.instructions_reset</Trans>
            </Col>
            <Col lg={4}>
              <Button onClick={this.resetBackup} variant="danger">
                <Trans>backup.lancer.boutonResetBackup</Trans>
              </Button>
            </Col>
          </Row>

        </Feuille>

      </div>
    );
  }

}
