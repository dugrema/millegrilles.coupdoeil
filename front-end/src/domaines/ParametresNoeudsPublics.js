import React from 'react';
import { Form, Button, ButtonGroup, ButtonToolbar, ListGroup, InputGroup,
         Container, Row, Col, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import Backend from 'react-dnd-html5-backend'
import { DndProvider, useDrag, useDrop } from "react-dnd";
import webSocketManager from '../WebSocketManager';
import { Feuille } from '../mgcomponents/Feuilles';
import './Parametres.css';

// const domaine = 'millegrilles.domaines.Parametres';
// const libelle_publique_configuration = 'publique.configuration';

// Modele de la configuration d'un noeud public
const noeudTemplate = {
  "url_web": "https://localhost",
  "menu": [
    "fichiers",
    "messages",
  ]
}

// Sections de Vitrine
const sectionsVitrine = [
  'blogs', 'albums', 'fichiers', 'messages', 'podcasts',
  'senseursPassifs'
];

// Regroupements possibles en sous-menus
const sousMenus = [
  'autres'
];

const subscriptions_noeudsPublics = [
  'noeuds.source.millegrilles_domaines_Parametres.documents.configuration.noeudPublic'
]

export class NoeudsPublics extends React.Component {

  state = {
    noeuds: [],
    nouveauUrl: '',
    modeDeploiement: '',
  }

  componentDidMount() {
    this.chargerNoeudsPublics();
    webSocketManager.subscribe(subscriptions_noeudsPublics, this._recevoirMessageNoeuds);
  }

  componentWillUnmount() {
    webSocketManager.unsubscribe(subscriptions_noeudsPublics);
  }

  render() {
    return(
      <div>
        <Feuille>

          <Row><Col><h2><Trans>parametres.noeudsPublics.titre</Trans></h2></Col></Row>
          <Row><Col><p><Trans>parametres.noeudsPublics.description</Trans></p></Col></Row>

        </Feuille>

        <DndProvider backend={Backend}>
          {this._renderNoeuds()}
        </DndProvider>

        <Feuille>

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

        </Feuille>

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

    var menuPrincipal = [];
    var sectionsDisponibles = [...sectionsVitrine];
    var sectionsSousMenus = [];
    for(let idx in noeud.menu) {
      let menuItem = noeud.menu[idx];

      if(menuItem instanceof Object) {
        menuPrincipal.push(
          <ListGroup.Item key={menuItem.type}>
            <Trans>{'parametres.menuVitrine.' + menuItem.type}</Trans>
          </ListGroup.Item>
        );

        let sousMenus = [];
        for(let sousMenuIdx in menuItem.menu) {
          let sousMenu = menuItem.menu[sousMenuIdx];
          let indexDisponible = sectionsDisponibles.indexOf(sousMenu);
          delete sectionsDisponibles[indexDisponible];
          sousMenus.push(
            <ListGroupItemDraggable
              key={sousMenu}
              menuUrl={noeud.url_web}
              menuItem={sousMenu}
              sousMenu={menuItem.type}
              deplacerMenu={this._deplacerMenu} />
          );
        }
        sectionsSousMenus.push(
          <Row key={menuItem.type + '.titre'}>
            <Col>
              <Trans>parametres.noeudsPublics.sousMenu</Trans> <Trans>{'parametres.menuVitrine.' + menuItem.type}</Trans>
            </Col>
          </Row>
        );
        sectionsSousMenus.push(
          <Row key={menuItem.type + '.liste'}>
            <Col>
              <ListGroup horizontal>
                {sousMenus}
              </ListGroup>
            </Col>
          </Row>
        )
      } else {
        let indexMenu = sectionsDisponibles.indexOf(menuItem);
        delete sectionsDisponibles[indexMenu];

        menuPrincipal.push(
          <ListGroupItemDraggable
            key={menuItem}
            menuUrl={noeud.url_web}
            menuItem={menuItem}
            sousMenu=''
            deplacerMenu={this._deplacerMenu} />
        )
      }
    }

    const sectionsDisponiblesElem = [];
    for(let idxDisponible in sectionsDisponibles) {
      let sectionDisponible = sectionsDisponibles[idxDisponible];
      sectionsDisponiblesElem.push(
        <ListGroupItemDraggable
          key={sectionDisponible}
          menuUrl={noeud.url_web}
          menuItem={sectionDisponible}
          sousMenu='disponible'
          deplacerMenu={this._deplacerMenu} />
      );
    }

    var formulaireModeDeploiement;
    if(this.state.modeDeploiement === 's3') {
      formulaireModeDeploiement = (
        <div>
          <Form.Row>
            <Form.Group as={Col} md={4} controlId="awsAccessKeyId" key="awsAccessKeyId">
              <Form.Label><Trans>parametres.noeudsPublics.awsAccessKeyId</Trans></Form.Label>
              <Form.Control placeholder="Ex. AKBCDEFG123456WXYZ" />
            </Form.Group>
            <Form.Group as={Col} md={4} controlId="awsSecretAccessKey" key="awsSecretAccessKey">
              <Form.Label><Trans>parametres.noeudsPublics.awsSecretAccessKey</Trans></Form.Label>
              <Form.Control type="password" placeholder="Password" />
            </Form.Group>
            <Form.Group as={Col} md={4} controlId="awsCredentialRegion">
              <Form.Label><Trans>parametres.noeudsPublics.awsCredentialRegion</Trans></Form.Label>
              <Form.Control placeholder="Ex. us-east-2" />
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Form.Group as={Col} sm={6} controlId="awsBucketName" key="awsBucketName">
              <Form.Label><Trans>parametres.noeudsPublics.awsBucketName</Trans></Form.Label>
              <Form.Control placeholder="Ex. my-bucket" />
            </Form.Group>
            <Form.Group as={Col} sm={6} controlId="awsBucketRegion" key="awsBucketRegion">
              <Form.Label><Trans>parametres.noeudsPublics.awsBucketRegion</Trans></Form.Label>
              <Form.Control placeholder="Ex. us-east-2" />
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Form.Group as={Col} md={6} controlId="awsBucketUrl" key="awsBucketUrl">
              <Form.Label><Trans>parametres.noeudsPublics.awsBucketUrl</Trans></Form.Label>
              <Form.Control placeholder="Ex. https://monbucket-bucket.s3.us-east-2.amazonaws.com" />
            </Form.Group>
            <Form.Group as={Col} md={6} controlId="awsBucketDir" key="awsBucketDir">
              <Form.Label><Trans>parametres.noeudsPublics.awsBucketDir</Trans></Form.Label>
              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text id="awsBucketDir">/</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control placeholder="Ex. mon_sous_repertoire/ (optionnel)" />
              </InputGroup>
            </Form.Group>
          </Form.Row>
        </div>
      );
    }

    return (
      <Feuille key={noeud.url_web}>
        <Form>
          <Row><Col><h2><Trans values={{url: noeud.url_web}}>parametres.noeudsPublics.titreNoeud</Trans></h2></Col></Row>

          <Row><Col><h3><Trans>parametres.noeudsPublics.menu</Trans></h3></Col></Row>
          <Row>
            <Col>
              <ListGroup horizontal>
                {menuPrincipal}
              </ListGroup>
            </Col>
          </Row>

          {sectionsSousMenus}

          <Row>
            <Col>Sections disponibles</Col>
          </Row>

          <Row>
            <Col>
              <ListGroup horizontal>
                {sectionsDisponiblesElem}
              </ListGroup>
            </Col>
          </Row>

          <Row>
            <Col>
              <h3><Trans>parametres.noeudsPublics.modeDeploiement</Trans></h3>
              <p><Trans>parametres.noeudsPublics.modeDeploiementExplication</Trans></p>
            </Col>
          </Row>

          <Row>
            <Col>
              <ButtonToolbar>
                <ToggleButtonGroup type="radio" name="modeDeploiement"
                    value={this.state.modeDeploiement}
                    onChange={this._toggleModeDeploiement}>
                  <ToggleButton value={'torrent'}>Torrent</ToggleButton>
                  <ToggleButton value={'s3'}>Amazon S3</ToggleButton>
                </ToggleButtonGroup>
              </ButtonToolbar>
            </Col>
          </Row>

          {formulaireModeDeploiement}

          <Row>
            <Col>
              <ButtonGroup>
                <Button variant="primary" onClick={this._sauvegarder} value={noeud.url_web}>
                  <Trans>parametres.noeudsPublics.sauvegarder</Trans>
                </Button>
                <Button variant="secondary" onClick={this._renommer} value={noeud.url_web}>
                  <Trans>parametres.noeudsPublics.renommer</Trans>
                </Button>
                <Button variant="danger" onClick={this._supprimerNoeud} value={noeud.url_web}>
                  <Trans>parametres.noeudsPublics.supprimerNoeudBouton</Trans>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Form>
      </Feuille>
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
      if(noeud.url_web === url) {
        console.error("Un noeud a deja l'url " + url);
        return false;
      }
    }

    var nouveauNoeud = {...noeudTemplate};
    nouveauNoeud.url_web = url;
    let domaine = 'millegrilles.domaines.Parametres.majNoeudPublic';
    webSocketManager.transmettreTransaction(domaine, nouveauNoeud)
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });

  }

  _supprimerNoeud = event => {
    const url = event.currentTarget.value;
    const noeuds = [];

    let domaine = 'millegrilles.domaines.Parametres.supprimerNoeudPublic';
    webSocketManager.transmettreTransaction(domaine, {url_web: url})
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      } else {
        // Filtrer le noeud a supprimer de la liste
        for(let idx in this.state.noeuds) {
          let noeud = this.state.noeuds[idx];
          if(noeud.url_web !== url) {
            noeuds.push(noeud);
          }
        }

        this.setState({noeuds});
      }
    })
    .catch(err=>{
      console.error("Erreur sauvegarde");
      console.error(err);
    });
  }

  _changerNouveauUrl = event => {
    let nouveauUrl = event.currentTarget.value;
    this.setState({nouveauUrl});
  }

  // Deplace un element de menu de la source vers destination
  // source et destinations ont le format {type: str, menuItem: str}
  // type est optionnel, defaut est menu principal
  // Pour destination, menuItem est optionnel. Par defaut l'item va a la fin (push)
  _deplacerMenu = (noeudUrl, source, destination) => {

    // console.debug("Deplacer menu de " + noeudUrl);
    // console.debug(source);
    // console.debug(destination);

    // Trouver le noeud par URL
    var menuNoeudModifie;
    for(var idxNoeud in this.state.noeuds) {
      let noeud = this.state.noeuds[idxNoeud];
      if(noeud.url_web === noeudUrl) {
        menuNoeudModifie = [...noeud.menu]; // On fait une copie du menu pour le modifier
        break;
      }
    }

    if(menuNoeudModifie) {
      if(source.sousMenu === 'disponible') {
        let indexDestination = menuNoeudModifie.indexOf(destination.menuItem)
        menuNoeudModifie.splice(indexDestination, 0, source.menuItem);  // Ajout item source
      } else if(destination.sousMenu === 'disponible') {
        let indexSource = menuNoeudModifie.indexOf(source.menuItem);
        menuNoeudModifie.splice(indexSource, 1);  // Retrait item source
      } else if(source.sousMenu === destination.sousMenu) {
        // On travaille dans le meme menu
        // Il suffit de reconstruire le menu
        let indexSource = menuNoeudModifie.indexOf(source.menuItem);
        menuNoeudModifie.splice(indexSource, 1);  // Retrait item source
        if(destination.menuItem) {
          let indexDestination = menuNoeudModifie.indexOf(destination.menuItem)
          menuNoeudModifie.splice(indexDestination, 0, source.menuItem);  // Ajout item source
        } else {
          // On fait juste ajouter le menu a la fin
          menuNoeudModifie.push(source.menuItem);
        }
      } else {
        // Plus tard
      }

      // Mettre la jour la collection des noeuds avec le nouveau menu.
      const noeuds = [...this.state.noeuds];
      noeuds[idxNoeud].menu = menuNoeudModifie;
      this.setState({noeuds});

    }

  }

  chargerNoeudsPublics() {
    let routingKey = 'requete.millegrilles.domaines.Parametres.noeudPublic';
    webSocketManager.transmettreRequete(routingKey, {})
    .then( docsRecu => {
      return docsRecu;
   })
   .then(noeudsPublics => {
     const noeuds = [];
     for(let idx in noeudsPublics) {
       let docProfil = noeudsPublics[idx];
       noeuds.push(docProfil)
     }

     this.setState({noeuds});
   })
   .catch(err=>{
     console.error("Erreur requete documents profils");
     console.error(err);
   });
  }

  _recevoirMessageNoeuds = (routingKey, message) => {
    const url = message.url_web;
    const noeuds = [...this.state.noeuds];
    let noeudTrouve = false;
    for(let idx in this.state.noeuds) {
      if(this.state.noeuds[idx].url_web === url) {
        noeuds[idx] = message;
        noeudTrouve = true;
        break;
      }
    }

    if(!noeudTrouve) {
      // C'est un nouveau noeud, on l'ajoute a la fin
      noeuds.push(message);
    }

    this.setState({noeuds});
  }

  _sauvegarder = event => {
    const url_web = event.currentTarget.value;

    for(let idx in this.state.noeuds) {
      var noeudPublic = this.state.noeuds[idx];
      if(noeudPublic.url_web === url_web) {

        const noeudTransaction = {
          url_web: url_web,
          menu: noeudPublic.menu,
        }
        // Transmettre ce noeud comme transaction
        let domaine = 'millegrilles.domaines.Parametres.majNoeudPublic';
        webSocketManager.transmettreTransaction(domaine, noeudTransaction)
        .then(reponse=>{
          if(reponse.err) {
            console.error("Erreur transaction");
          }
        })
        .catch(err=>{
          console.error("Erreur sauvegarde");
          console.error(err);
        });

        break;
      }
    }
  }

  _toggleModeDeploiement = modeDeploiement => {
    this.setState({modeDeploiement});
  }

}

function ListGroupItemDraggable(props) {

  const ref = React.createRef();
  const [, connectDrag] = useDrag({
    item: { menuItem: props.menuItem, type: "MENU_VITRINE", sousMenu: props.sousMenu },
  });
  const [, connectDrop] = useDrop({
    accept: "MENU_VITRINE",
    hover(item) {
      if(item.menuItem !== props.menuItem) {
        // props.deplacerMenu(props.menuUrl, {menuItem: item.menuItem}, {menuItem: props.menuItem})
      }
      // console.log("Hovering item menu : ", item.menuItem);
      // console.log("Hovered over menu : ", props.menuItem);
    },
    drop(item) {
      // console.debug("Drop " + item.menuItem + " sur " + props.menuItem);
      if(item.menuItem !== props.menuItem) {
        props.deplacerMenu(
          props.menuUrl,
          {sousMenu: item.sousMenu, menuItem: item.menuItem},
          {sousMenu: props.sousMenu, menuItem: props.menuItem}
        )
      }
    }
  });

  connectDrag(ref);
  connectDrop(ref);

  return (
    <ListGroup.Item ref={ref} className="draggable">
      <Trans>{'parametres.menuVitrine.' + props.menuItem}</Trans>
    </ListGroup.Item>
  );

}
