import React from 'react';
import { Form, Button, ButtonGroup, ButtonToolbar, ListGroup, InputGroup,
         Row, Col, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import Backend from 'react-dnd-html5-backend'
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { Feuille } from '../components/Feuilles';
import { MilleGrillesCryptoHelper, bufferToBase64 } from '../api/CryptoSubtle'
import uuidv4 from 'uuid/v4';

import './Parametres.css';

const cryptoHelper = new MilleGrillesCryptoHelper();

// const domaine = 'millegrilles.domaines.Parametres';
// const libelle_publique_configuration = 'publique.configuration';

// Modele de la configuration d'un noeud public
const noeudTemplate = {
  "url_web": "https://localhost",
  "menu": [
    "fichiers",
    "messages",
  ],
  "mode_deploiement": "torrent",
}

// Sections de Vitrine
const sectionsVitrine = [
  'blogs', 'albums', 'fichiers', 'messages', 'podcasts',
  'senseursPassifs'
];

const subscriptions_noeudsPublics = [
  'noeuds.source.millegrilles_domaines_Parametres.documents.configuration.noeudPublic'
]

export class NoeudsPublics extends React.Component {

  state = {
    ordreNoeuds: [],
    nouveauUrl: '',
  }

  componentDidMount() {
    this.chargerNoeudsPublics();
    this.props.rootProps.websocketApp.subscribe(subscriptions_noeudsPublics, this._recevoirMessageNoeuds);

    // S'assurer que la cle publique du maitre des cles est disponible
    if(!sessionStorage.clePubliqueMaitredescles) {
      this.props.rootProps.websocketApp.emit('demandeClePubliqueMaitredescles', {})
      .then(infoCertificat=>{
        sessionStorage.clePubliqueMaitredescles = infoCertificat.clePublique;
        sessionStorage.fingerprintMaitredescles = infoCertificat.fingerprint;
      })
      .catch(err=>{
        console.error("Erreur demande cle publique du maitredescles");
        console.error(err);
      });
    }
  }

  componentWillUnmount() {
    this.props.rootProps.websocketApp.unsubscribe(subscriptions_noeudsPublics);
  }

  render() {
    return(
      <div className="w3-col m12 w3-row-padding">
        <div className="w3-row-padding">
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
      </div>
    );
  }

  _renderNoeuds() {
    let noeuds = [];
    for(let idx in this.state.ordreNoeuds) {
      let urlNoeud = this.state.ordreNoeuds[idx];
      let noeud = this.state[urlNoeud];
      noeuds.push(
        <NoeudPublic
          key={noeud.url_web}
          toggleModeDeploiement={this._toggleModeDeploiement}
          sauvegarder={this._sauvegarder}
          majValeurNoeud={this.majValeurNoeud}
          deplacerMenu={this._deplacerMenu}
          supprimerNoeud={this._supprimerNoeud}
          {...noeud} />
      );
    }
    return noeuds;
  }

  _ajouterNoeud = event => {
    const form = event.currentTarget.form;
    const url = form.formAjouterNoeudPublic.value;

    if(url === '') {
      console.error("URL invalide");
      return false;
    }
    if(this.state[url]) {
      console.error("Un noeud a deja l'url " + url);
      return false;
    }

    var nouveauNoeud = {...noeudTemplate};
    nouveauNoeud.url_web = url;
    let domaine = 'millegrilles.domaines.Parametres.majNoeudPublic';
    this.props.rootProps.websocketApp.transmettreTransaction(domaine, nouveauNoeud)
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

    let domaine = 'millegrilles.domaines.Parametres.supprimerNoeudPublic';
    this.props.rootProps.websocketApp.transmettreTransaction(domaine, {url_web: url})
    .then(reponse=>{
      if(reponse.err) {
        console.error("Erreur transaction");
      } else {
        // Filtrer le noeud a supprimer de la liste
        const ordreNoeuds = [];
        for(let idx in this.state.ordreNoeuds) {
          let url_web_noeud = this.state.ordreNoeuds[idx]
          if(url_web_noeud !== url) {
            ordreNoeuds.push(url_web_noeud);
          }
        }

        this.setState({ordreNoeuds});
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
    var noeudModifie = this.state[noeudUrl];

    if(noeudModifie) {
      var menuNoeudModifie = [...noeudModifie.menu];
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
      const noeud = Object.assign({}, this.state[noeudUrl]);
      noeud.menu = menuNoeudModifie;

      let stateUpdate = {};
      stateUpdate[noeudUrl] = noeud;
      this.setState(stateUpdate);

    }

  }

  majValeurNoeud = (urlNoeud, champ, valeur) => {
    const noeud = Object.assign({}, this.state[urlNoeud]);
    noeud[champ] = valeur;

    let stateUpdate = {};
    stateUpdate[urlNoeud] = noeud;
    this.setState(stateUpdate);
  }

  chargerNoeudsPublics() {
    let routingKey = 'requete.millegrilles.domaines.Parametres.noeudPublic';
    this.props.rootProps.websocketApp.transmettreRequete(routingKey, {})
    .then( docsRecu => {
      return docsRecu;
   })
   .then(noeudsPublics => {
     const ordreNoeuds = [], noeuds = {};
     for(let idx in noeudsPublics) {
       let docProfil = noeudsPublics[idx];
       ordreNoeuds.push(docProfil.url_web);
       noeuds[docProfil.url_web] = {awsSecretAccessKey: '', ...docProfil};
     }

     this.setState({ordreNoeuds, ...noeuds});
   })
   .catch(err=>{
     console.error("Erreur requete documents profils");
     console.error(err);
   });
  }

  _recevoirMessageNoeuds = (routingKey, message) => {
    const url = message.url_web;

    var ordreNoeuds = this.state.ordreNoeuds;
    if(!this.state[url]) {
      // C'est un nouveau noeud, on l'ajoute a la fin
      ordreNoeuds = [...ordreNoeuds, url];
    }

    var stateUpdate = {ordreNoeuds};
    stateUpdate[url] = {awsSecretAccessKey: '', ...message};

    this.setState(stateUpdate);
  }

  _sauvegarder = event => {
    const url_web = event.currentTarget.value;

    var noeudPublic = this.state[url_web];

    // Filtrer champs avec underscore (_)
    const noeudTransaction = {};
    var awsSecretAccessKey;
    for(let champ in noeudPublic) {
      if(champ === 'awsSecretAccessKey') {
        // Intercepter secret, on doit le chiffrer
        awsSecretAccessKey = noeudPublic[champ];
        if(noeudPublic[champ] && noeudPublic[champ] !== '') {
          awsSecretAccessKey = {awsSecretAccessKey: noeudPublic[champ]};
        }
      } else if(champ[0] !== '_' && champ !== 'en-tete' && champ !== 'awsSecretAccessKeyChiffre') {
        noeudTransaction[champ] = noeudPublic[champ];
      }
    }

    // Verifier si on a un nouveau mot de passe (secret)
    var promiseChiffrer, uuidTransaction;
    if(awsSecretAccessKey) {
      // Demander cert du maitredescles pour crypter mot de passe
      let clePubliqueMaitredescles = sessionStorage.clePubliqueMaitredescles;
      if(!clePubliqueMaitredescles) {
        throw new Error("Certificat maitre des cles non disponible");
      }
      uuidTransaction = uuidv4();
      // Chiffrer le mot de passe
      promiseChiffrer = cryptoHelper.crypter(awsSecretAccessKey, clePubliqueMaitredescles)
      .then(resultat=>{
        let awsSecretAccessKeyChiffre = bufferToBase64(resultat.bufferCrypte);
        noeudTransaction.awsSecretAccessKeyChiffre = awsSecretAccessKeyChiffre;

        // Transmettre la cle
        this.props.rootProps.websocketApp.transmettreCle(
          domaine, uuidTransaction,
          {
            url_web,
            champ: "awsSecretAccessKey",
          },
          resultat.cleSecreteCryptee, resultat.iv,
          sessionStorage.fingerprintMaitredescles);
      });

    } else {
      promiseChiffrer = Promise.resolve();
    }

    // Transmettre ce noeud comme transaction
    let domaine = 'millegrilles.domaines.Parametres.majNoeudPublic';
    let opts = null;
    if(uuidTransaction) {
      opts = {
        uuidTransaction
      }
    }
    promiseChiffrer.then(()=>{
      return this.props.rootProps.websocketApp.transmettreTransaction(domaine, noeudTransaction, opts)
    })
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

  _toggleModeDeploiement = (urlNoeud, modeDeploiement) => {
    var noeud = Object.assign({}, this.state[urlNoeud]);
    noeud.mode_deploiement = modeDeploiement;

    var stateUpdate = {};
    stateUpdate[urlNoeud] = noeud;
    this.setState(stateUpdate);
  }

}

function ListGroupItemDraggable(props) {

  const deplacerMenu = props.deplacerMenu;
  // console.debug(deplacerMenu);

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
        deplacerMenu(
          props.menuUrl,
          {sousMenu: item.sousMenu, menuItem: item.menuItem},
          {sousMenu: props.sousMenu, menuItem: props.menuItem}
        )
      }
    }
  });

  var label = <Trans>{'parametres.menuVitrine.' + props.menuItem}</Trans>;
  if(props.menuItem  === 'poubelle') {
    label = <i className="fa fa-trash-o" />
  } else {
    connectDrag(ref);
  }
  connectDrop(ref);

  return (
    <ListGroup.Item ref={ref} className="draggable">
      {label}
    </ListGroup.Item>
  );

}

class NoeudPublic extends React.Component {

  render() {
    var menuPrincipal = [];
    var sectionsDisponibles = [...sectionsVitrine];
    var sectionsSousMenus = [];
    for(let idx in this.props.menu) {
      let menuItem = this.props.menu[idx];

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
              menuUrl={this.props.url_web}
              menuItem={sousMenu}
              sousMenu={menuItem.type}
              deplacerMenu={this.props.deplacerMenu} />
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
            menuUrl={this.props.url_web}
            menuItem={menuItem}
            sousMenu=''
            deplacerMenu={this.props.deplacerMenu} />
        )
      }
    }

    const sectionsDisponiblesElem = [];
    for(let idxDisponible in sectionsDisponibles) {
      let sectionDisponible = sectionsDisponibles[idxDisponible];
      sectionsDisponiblesElem.push(
        <ListGroupItemDraggable
          key={sectionDisponible}
          menuUrl={this.props.url_web}
          menuItem={sectionDisponible}
          sousMenu='disponible'
          deplacerMenu={this.props.deplacerMenu} />
      );
    }

    sectionsDisponiblesElem.push(
      <ListGroupItemDraggable
        key="poubelle"
        menuUrl={this.props.url_web}
        menuItem="poubelle"
        sousMenu='disponible'
        deplacerMenu={this.props.deplacerMenu} />
    );

    var formulaireModeDeploiement;
    if(this.props.mode_deploiement === 's3') {
      formulaireModeDeploiement = (
        <FormulaireDeploiementS3
          changerchamp={this._changerChamp}
          {...this.props} />
      );
    }

    return (
      <Feuille key={this.props.url_web}>
        <Form>
          <Row><Col><h2><Trans values={{url: this.props.url_web}}>parametres.noeudsPublics.titreNoeud</Trans></h2></Col></Row>

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
                    value={this.props.mode_deploiement}
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
                <Button variant="primary" onClick={this.props.sauvegarder} value={this.props.url_web}>
                  <Trans>parametres.noeudsPublics.sauvegarder</Trans>
                </Button>
                <Button variant="secondary" onClick={this._renommer} value={this.props.url_web}>
                  <Trans>parametres.noeudsPublics.renommer</Trans>
                </Button>
                <Button variant="danger" onClick={this.props.supprimerNoeud} value={this.props.url_web}>
                  <Trans>parametres.noeudsPublics.supprimerNoeudBouton</Trans>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Form>
      </Feuille>
    );
  }

  _toggleModeDeploiement = valeur => {
    var urlNoeud = this.props.url_web;
    this.props.majValeurNoeud(urlNoeud, 'mode_deploiement', valeur);
  }

  _changerChamp = (urlNoeud, name, valeur) => {
    this.props.majValeurNoeud(urlNoeud, name, valeur);
  }

}

class FormulaireDeploiementS3 extends React.Component {

  render() {
    var placeholderAwsSecretAccessKey = 'AWS SECRET';
    if(this.props.awsSecretAccessKeyChiffre) {
      placeholderAwsSecretAccessKey = 'CHANGER AWS SECRET';
    }

    return (
      <div>
        <Form.Row>
          <Form.Group as={Col} md={4} controlId="awsAccessKeyId" key="awsAccessKeyId" >
            <Form.Label><Trans>parametres.noeudsPublics.awsAccessKeyId</Trans></Form.Label>
            <Form.Control placeholder="Ex. AKBCDEFG123456WXYZ" value={this.props.awsAccessKeyId} onChange={this._changerChamp} />
          </Form.Group>
          <Form.Group as={Col} md={4} controlId="awsSecretAccessKey" key="awsSecretAccessKey">
            <Form.Label><Trans>parametres.noeudsPublics.awsSecretAccessKey</Trans></Form.Label>
            <Form.Control type="password" placeholder={placeholderAwsSecretAccessKey}
              value={this.props.awsSecretAccessKey} onChange={this._changerChamp} />
          </Form.Group>
          <Form.Group as={Col} md={4} controlId="awsCredentialRegion">
            <Form.Label><Trans>parametres.noeudsPublics.awsCredentialRegion</Trans></Form.Label>
            <Form.Control placeholder="Ex. us-east-2" value={this.props.awsCredentialRegion} onChange={this._changerChamp} />
          </Form.Group>
        </Form.Row>

        <Form.Row>
          <Form.Group as={Col} sm={6} controlId="awsBucketName" key="awsBucketName">
            <Form.Label><Trans>parametres.noeudsPublics.awsBucketName</Trans></Form.Label>
            <Form.Control placeholder="Ex. my-bucket" value={this.props.awsBucketName} onChange={this._changerChamp} />
          </Form.Group>
          <Form.Group as={Col} sm={6} controlId="awsBucketRegion" key="awsBucketRegion">
            <Form.Label><Trans>parametres.noeudsPublics.awsBucketRegion</Trans></Form.Label>
            <Form.Control placeholder="Ex. us-east-2" value={this.props.awsBucketRegion} onChange={this._changerChamp} />
          </Form.Group>
        </Form.Row>

        <Form.Row>
          <Form.Group as={Col} md={6} controlId="awsBucketUrl" key="awsBucketUrl">
            <Form.Label><Trans>parametres.noeudsPublics.awsBucketUrl</Trans></Form.Label>
            <Form.Control placeholder="Ex. https://monbucket-bucket.s3.us-east-2.amazonaws.com" value={this.props.awsBucketUrl} onChange={this._changerChamp} />
          </Form.Group>
          <Form.Group as={Col} md={6} controlId="awsBucketDir" key="awsBucketDir">
            <Form.Label><Trans>parametres.noeudsPublics.awsBucketDir</Trans></Form.Label>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="awsBucketDir">/</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control placeholder="Ex. mon_sous_repertoire/ (optionnel)" value={this.props.awsBucketDir} onChange={this._changerChamp} />
            </InputGroup>
          </Form.Group>
        </Form.Row>
      </div>
    )
  }

  _changerChamp = event => {
    let name = event.currentTarget.id;
    let valeur = event.currentTarget.value;
    var urlNoeud = this.props.url_web;
    this.props.changerchamp(urlNoeud, name, valeur);
  }

}
