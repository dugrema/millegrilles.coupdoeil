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

  afficherEcran = nomEcran => {

  }

  render() {
    return <PageInitiale
              fonctionsNavigation={{afficherEcran: this.afficherEcran}}
              />
  }

}

function PageInitiale(props) {

  return (
    <div className="w3-col m9 w3-row-padding">
      <div className="w3-row-padding">
        <Feuille>

          <Row><Col><h2 className="w3-opacity"><Trans>backup.initiale.titre</Trans></h2></Col></Row>

          <Row>
            <ul>
              <li>
                <Button className="aslink" onClick={props.fonctionsNavigation.afficherEcran} value="backupCles">
                  <Trans>backup.initiale.lienBackupCles</Trans>
                </Button>
              </li>
            </ul>
          </Row>

        </Feuille>

      </div>
    </div>

  )
}
