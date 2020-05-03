import React from 'react';
import { Alert, Form, Row, Col,
         Button, ButtonGroup, InputGroup, FormControl} from 'react-bootstrap';
import { Feuille } from '../mgcomponents/Feuilles';
import { Trans } from 'react-i18next';

import './Hebergement.css';

export class Hebergement extends React.Component {

  constructor(props) {
    super(props);

    this.webSocketManager = props.webSocketManager;

    this.state = {
      ecranCourant: null,
    }

    //   subscriptions: Le nom des routing keys qui vont etre ecoutees
    this.config = {
      subscriptions: [
        // 'noeuds.source.millegrilles_domaines_Hebergement.xxx',
      ]
    };
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    this.webSocketManager.subscribe(this.config.subscriptions, this.processMessage);
  }

  componentWillUnmount() {
    // Retirer les routingKeys de documents
    this.webSocketManager.unsubscribe(this.config.subscriptions);
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

    const sousEcran = this.state.ecranCourant;
    let contenu;
    if(sousEcran === 'millegrillesHebergees') {
      contenu = <MillegrillesHebergees
                  fonctionsNavigation={{afficherEcran: this.afficherEcran, retourInitiale: this.retourInitiale}}
                  />;
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

      <Row><Col><h2 className="w3-opacity"><Trans>hebergement.initiale.titre</Trans></h2></Col></Row>

      <Row>
        <ul>
          <li>
            <Button className="aslink bouton" onClick={props.fonctionsNavigation.afficherEcran} value="millegrillesHebergees">
              <Trans>hebergement.initiale.millegrillesHebergees</Trans>
            </Button>
          </li>
        </ul>
      </Row>

    </Feuille>
  );
}

class MillegrillesHebergees extends React.Component {

  render() {

    return(
      <div>
        <Feuille>

          <Row><Col><h2 className="w3-opacity"><Trans>hebergement.millegrillesHebergees.titre</Trans></h2></Col></Row>

        </Feuille>

        <Feuille>

          <Row>
            <Col>
              Boutons: ajouter millegrille hebergee
            </Col>
          </Row>

          <Row>
            <Col>
              Liste millegrilles hebergees, boutons : activer, desactiver, supprimer
            </Col>
          </Row>

        </Feuille>
      </div>
    );
  }
}
