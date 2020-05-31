import React from 'react';
import { Row, Col, Button, ButtonGroup} from 'react-bootstrap';
import { Feuille } from '../components/Feuilles';
import { Trans } from 'react-i18next';

import './Hebergement.css';

export class Hebergement extends React.Component {

  constructor(props) {
    super(props);

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
    this.props.rootProps.websocketApp.subscribe(this.config.subscriptions, this.processMessage);
  }

  componentWillUnmount() {
    // Retirer les routingKeys de documents
    this.props.rootProps.websocketApp.unsubscribe(this.config.subscriptions);
  }

  afficherEcran = event => {
    const {value} = event.currentTarget;
    this.setState({ecranCourant: value});
  }

  retourInitiale = () => {
    this.setState({ecranCourant: null});
  }

  render() {
    const sousEcran = this.state.ecranCourant;
    let contenu;
    if(sousEcran === 'millegrillesHebergees') {
      contenu = <MillegrillesHebergees
                  rootProps={this.props.rootProps}
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

const MESSAGE_MAJ_DOCUMENT = 'noeuds.source.millegrilles_domaines_Hebergement.documents.millegrille.hebergee';

class MillegrillesHebergees extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      listeMillegrilles: [],
      desactiverBoutons: false,
    }
    this.subscriptions = [MESSAGE_MAJ_DOCUMENT,];
  }

  componentDidMount() {
    // Enregistrer les routingKeys de documents
    this.props.rootProps.websocketApp.subscribe([MESSAGE_MAJ_DOCUMENT], this.majDocument);

    // Aller chercher la liste des MilleGrilles hebergees
    const routing = 'requete.millegrilles.domaines.Hebergement.requeteMilleGrillesHebergees';
    const requete = {}
    this.props.rootProps.websocketApp.transmettreRequete(routing, requete)
    .then(reponse=>{
      // console.debug("Reponse millegrilles hebergees");
      // console.debug(reponse);
      this.setState({listeMillegrilles: reponse});
    });

  }

  componentWillUnmount() {
    this.props.rootProps.websocketApp.unsubscribe(this.subscriptions);
  }

  // Mise a jour document MilleGrille hebergee
  majDocument = (routing, message) => {
    // console.debug("Message recu, routing : %s", routing);
    // console.debug(message);
    const dictDocs = {};
    for(let idx in this.state.listeMillegrilles) {
      const info = this.state.listeMillegrilles[idx];
      dictDocs[info.idmg] = info;
    }

    // Remplacer / ajouter document
    dictDocs[message.idmg] = message;

    // Extraire et sauvegarder liste
    const listeMillegrilles = Object.values(dictDocs);
    this.setState({listeMillegrilles})
  }

  ajouterMillegrille = event => {
    this.setState({desactiverBoutons: true});
    const routing = 'commande.millegrilles.domaines.Hebergement.creerMilleGrilleHebergee';
    const commande = {};
    this.props.rootProps.websocketApp.transmettreCommande(routing, commande)
    .catch(err=>{
      console.error("Erreur bouton ajouter millegrille");
      console.error(err);
    })
    .finally(()=>{
      this.setState({desactiverBoutons: false});
    });
  }

  activerMillegrille = event => {
    const {value} = event.currentTarget;
    this.setState({desactiverBoutons: true});
    const routing = 'millegrilles.domaines.Hebergement.activerMilleGrilleHebergee';
    const transaction = {idmg: value};
    this.props.rootProps.websocketApp.transmettreTransaction(routing, transaction)
    .catch(err=>{
      console.error("Erreur bouton activer millegrille");
      console.error(err);
    })
    .finally(()=>{
      this.setState({desactiverBoutons: false});
    });
  }

  desactiverMillegrille = event => {
    const {value} = event.currentTarget;
    this.setState({desactiverBoutons: true});
    const routing = 'millegrilles.domaines.Hebergement.desactiverMilleGrilleHebergee';
    const transaction = {idmg: value};
    this.props.rootProps.websocketApp.transmettreTransaction(routing, transaction)
    .catch(err=>{
      console.error("Erreur bouton desactiver millegrille");
      console.error(err);
    })
    .finally(()=>{
      this.setState({desactiverBoutons: false});
    });
  }

  supprimerMillegrille = event => {
    const {value} = event.currentTarget;
    this.setState({desactiverBoutons: true});
    const routing = 'millegrilles.domaines.Hebergement.supprimerMilleGrilleHebergee';
    const transaction = {idmg: value};
    this.props.rootProps.websocketApp.transmettreTransaction(routing, transaction)
    .then(reponse=>{
      const listeMillegrilles = this.state.listeMillegrilles.filter(info=>{
        // Reponse recue, on retire la MilleGrille de la liste
        if(info.idmg === value) return false;
        return true;
      })
      this.setState({listeMillegrilles});
    })
    .catch(err=>{
      console.error("Erreur bouton supprimer millegrille");
      console.error(err);
    })
    .finally(()=>{
      this.setState({desactiverBoutons: false});
    });
  }

  render() {

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
        <Button key="activer"
          onClick={this.activerMillegrille}
          value={millegrille.idmg}
          variant="secondary"
          disabled={actif || this.state.desactiverBoutons}><Trans>global.activer</Trans>
        </Button>
      );
      boutons.push(
        <Button key="desactiver"
          onClick={this.desactiverMillegrille}
          value={millegrille.idmg}
          variant="secondary"
          disabled={!actif || this.state.desactiverBoutons }><Trans>global.desactiver</Trans>
        </Button>
      );
      boutons.push(
        <Button key="supprimer"
          onClick={this.supprimerMillegrille}
          value={millegrille.idmg}
          variant="danger"
          disabled={this.state.desactiverBoutons}><Trans>global.supprimer</Trans>
        </Button>
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
                <Button variant="primary"
                  onClick={this.ajouterMillegrille}
                  disabled={this.state.desactiverBoutons}><Trans>global.ajouter</Trans></Button>
              </ButtonGroup>
            </Col>
          </Row>

        </Feuille>
      </div>
    );
  }
}
