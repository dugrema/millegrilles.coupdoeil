import React from 'react';
import { Form, Button, ButtonGroup, Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import webSocketManager from '../WebSocketManager';
import { GestionEmailSmtp } from './ParametresGestionEmailSmtp';
import { GestionDeployeurPublic } from './ParametresGestionDeployeurPublic'
import './Parametres.css';

const domaine = 'millegrilles.domaines.Parametres';
const libelle_publique_configuration = 'publique.configuration';

// Modele de la configuration d'un noeud public
const noeudTemplate = {
  "url": "https://localhost",
  "menu": [
    "blogs",
    "albums",
    "fichiers",
    {
      "type": "autres",
      "menu": [
        "messages",
        "senseursPassifs",
        "podcasts"
      ]
    }
  ]
}

export class NoeudsPublics extends React.Component {

  state = {
    noeuds: [],
    nouveauUrl: '',
  }

  render() {
    return(
      <div>
        <Container className='w3-card w3-round w3-white w3-card_BR'>
          <div className='w3-container w3-padding'>

            <Row><Col><h2><Trans>parametres.noeudsPublics.titre</Trans></h2></Col></Row>
            <Row><Col><p><Trans>parametres.noeudsPublics.description</Trans></p></Col></Row>

          </div>
        </Container>

        {this._renderNoeuds()}

        <Container className='w3-card w3-round w3-white w3-card_BR'>
          <div className='w3-container w3-padding'>

            <Row>
              <Col>
                <h3><Trans>parametres.noeudsPublics.ajouterNoeudTitre</Trans></h3>
              </Col>
            </Row>

            <Row>
              <Col>
                <Form className="formNouveauNoeud">
                  <Form.Group controlId="formAjouterNoeudPublic">
                    <Form.Label><Trans>parametres.noeudsPublics.urlLibelle</Trans></Form.Label>
                    <Form.Control type="plaintext" placeholder="https://www.millegrilles.com"
                                  value={this.state.nouveauUrl}
                                  onChange={this._changerNouveauUrl} />
                    <Form.Text className="text-muted">
                      <Trans>parametres.noeudsPublics.urlTexte</Trans>
                    </Form.Text>
                  </Form.Group>
                  <Button onClick={this._ajouterNoeud}>
                    <Trans>parametres.noeudsPublics.ajouterNoeudBouton</Trans>
                  </Button>
                </Form>
              </Col>
            </Row>

          </div>
        </Container>

      </div>
    );
  }

  _renderNoeuds() {
    let noeuds = [];
    for(let idx in this.state.noeuds) {
      let noeud = this.state.noeuds[idx];
      noeuds.push(this._renderNoeud(noeud));
    }
    return noeuds;
  }

  _renderNoeud(noeud) {

    return (
      <Container key={noeud.url} className='w3-card w3-round w3-white w3-card_BR'>
        <Form>
          <div className='w3-container w3-padding'>
            <Row><Col><h3><Trans values={{url: noeud.url}}>parametres.noeudsPublics.titreNoeud</Trans></h3></Col></Row>
            <Row>
              <Col>
                <p>Formulaire</p>
                <ButtonGroup aria-label="Basic example">
                  <Button variant="primary" onClick={this._sauvegarder} value={noeud.url}>
                    <Trans>parametres.noeudsPublics.sauvegarder</Trans>
                  </Button>
                  <Button variant="secondary" onClick={this._renommer} value={noeud.url}>
                    <Trans>parametres.noeudsPublics.renommer</Trans>
                  </Button>
                  <Button variant="danger" onClick={this._supprimerNoeud} value={noeud.url}>
                    <Trans>parametres.noeudsPublics.supprimerNoeudBouton</Trans>
                  </Button>
                </ButtonGroup>
              </Col>
            </Row>
          </div>
        </Form>
      </Container>
    )
  }

  _ajouterNoeud = event => {
    const form = event.currentTarget.form;
    const url = form.formAjouterNoeudPublic.value;

    if(url === '') {
      console.error("URL invalide");
      return false;
    }

    const noeuds = [...this.state.noeuds];
    // Verifier qu'aucun noeud n'a cet URL
    for(let idx in noeuds) {
      let noeud = noeuds[idx];
      if(noeud.url === url) {
        console.error("Un noeud a deja l'url " + url);
        return false;
      }
    }

    var nouveauNoeud = {...noeudTemplate};
    nouveauNoeud.url = url;
    noeuds.push(nouveauNoeud);

    this.setState({noeuds},()=>{
      form.formAjouterNoeudPublic.value = '';
    });
  }

  _supprimerNoeud = event => {
    const url = event.currentTarget.value;
    const noeuds = [];

    // Filtrer le noeud a supprimer de la liste
    for(let idx in this.state.noeuds) {
      let noeud = this.state.noeuds[idx];
      if(noeud.url !== url) {
        noeuds.push(noeud);
      }
    }

    this.setState({noeuds});
  }

  _changerNouveauUrl = event => {
    let nouveauUrl = event.currentTarget.value;
    this.setState({nouveauUrl});
  }

}
