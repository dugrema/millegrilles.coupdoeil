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
                  webSocketManager={this.props.webSocketManager}
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

  constructor(props) {
    super(props);
    this.state = {
      listeMillegrilles: [],
    }
    this.subscriptions = [
        'noeuds.source.millegrilles_domaines_Hebergement.documents.millegrille.hebergee',
    ];
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    this.props.webSocketManager.subscribe(this.subscriptions, this.processMessage);

    // Aller chercher la liste des MilleGrilles hebergees
    const routing = 'requete.millegrilles.domaines.Hebergement.requeteMilleGrillesHebergees';
    const requete = {}
    this.props.webSocketManager.transmettreRequete(routing, requete)
    .then(reponse=>{
      console.debug("Reponse millegrilles hebergees");
      console.debug(reponse);
      this.setState({listeMillegrilles: reponse});
    });

  }

  componentWillUnmount() {
    this.props.webSocketManager.unsubscribe(this.subscriptions);
  }

  processMessage = (routing, message) => {
    console.debug("Message recu, routing : %s", routing);
    console.debug(message);
  }

  render() {

    // const liste = [
    //   {'idmg': '2zHt8UFJhAdH8XzcPfb4Evsn4kcZrvZ7fxBT97a', 'etat': 'actif'},
    //   {'idmg': '3M87pZxVVWbT1dVLeRarQnge1mvADTs4trG7Caa', 'etat': 'actif'},
    // ];
    const liste = this.state.listeMillegrilles.sort((a,b)=>{
      if(a===b) return 0;
      if(a.idmg && b.idmg) return a.idmg.localeCompare(b.idmg);
      if(!b) return 1;
      return -1;
    })

    const listeRendered = liste.map(millegrille=>{

      const boutons = []
      const actif = millegrille.etat === 'actif';
      boutons.push(
        <Button key="activer" variant="secondary" disabled={actif}><Trans>global.activer</Trans></Button>
      );
      boutons.push(
        <Button key="desactiver" variant="secondary" disabled={!actif}><Trans>global.desactiver</Trans></Button>
      );
      boutons.push(
        <Button key="supprimer" variant="danger"><Trans>global.supprimer</Trans></Button>
      );

      return (
        <Row key={millegrille.idmg}>
          <Col lg={6}>
            {millegrille.idmg}
          </Col>
          <Col lg={1}>
            {millegrille.etat}
          </Col>
          <Col lg={5}>
            <ButtonGroup aria-label="Operations MilleGrille">
              {boutons}
            </ButtonGroup>
          </Col>
        </Row>
      );
    });

    return(
      <div>
        <Feuille>

          <Row><Col><h2 className="w3-opacity"><Trans>hebergement.millegrillesHebergees.titre</Trans></h2></Col></Row>

        </Feuille>

        <Feuille>

          <div className="table">
            <Row className="table-header">
              <Col lg={6}><Trans>hebergement.millegrillesHebergees.idmg</Trans></Col>
              <Col lg={1}><Trans>hebergement.millegrillesHebergees.etat</Trans></Col>
              <Col lg={5}><Trans>hebergement.millegrillesHebergees.actions</Trans></Col>
            </Row>
            {listeRendered}
          </div>

          <Row>
            <Col>
              <ButtonGroup aria-label="Operations MilleGrilles hebergees">
                <Button variant="primary"><Trans>global.ajouter</Trans></Button>
              </ButtonGroup>
            </Col>
          </Row>

        </Feuille>
      </div>
    );
  }
}
