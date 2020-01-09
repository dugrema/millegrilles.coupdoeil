import React from 'react';
import { Form, Button, ButtonGroup, ListGroup,
         Container, Row, Col } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import Backend from 'react-dnd-html5-backend'
import { DndProvider, useDrag, useDrop } from "react-dnd";
import webSocketManager from '../WebSocketManager';
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
        <Container className='w3-card w3-round w3-white w3-card_BR'>
          <div className='w3-container w3-padding'>

            <Row><Col><h2><Trans>parametres.noeudsPublics.titre</Trans></h2></Col></Row>
            <Row><Col><p><Trans>parametres.noeudsPublics.description</Trans></p></Col></Row>

          </div>
        </Container>

        <DndProvider backend={Backend}>
          {this._renderNoeuds()}
        </DndProvider>

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

    return (
      <Container key={noeud.url_web} className='w3-card w3-round w3-white w3-card_BR'>
        <Form>
          <div className='w3-container w3-padding'>
            <Row><Col><h3><Trans values={{url: noeud.url_web}}>parametres.noeudsPublics.titreNoeud</Trans></h3></Col></Row>

            <Row><Col>Menu</Col></Row>
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
      if(source.type === destination.type) {
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
    console.debug("Sauvegarder " + url_web);

    for(let idx in this.state.noeuds) {
      var noeudPublic = this.state.noeuds[idx];
      if(noeudPublic.url_web === url_web) {
        console.debug("Sauvegarder " + url_web + " match");
        console.debug(noeudPublic);

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
      console.debug("Drop " + item.menuItem + " sur " + props.menuItem);
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
