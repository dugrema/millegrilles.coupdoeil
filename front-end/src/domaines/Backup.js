import React from 'react';
import webSocketManager from '../WebSocketManager';
import {MilleGrillesCryptoHelper, CryptageAsymetrique} from '../mgcomponents/CryptoSubtle';
import {chiffrerPrivateKeyPEM} from '../mgcomponents/CryptoForge';

import { Alert, Form, Container, Row, Col,
         Button, ButtonGroup, InputGroup, FormControl} from 'react-bootstrap';
import { Feuille } from '../mgcomponents/Feuilles';
import { Trans, Translation } from 'react-i18next';

import './Backup.css';

const cryptoHelper = new MilleGrillesCryptoHelper();
const cryptageAsymetrique = new CryptageAsymetrique();

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
      contenu = <PageBackupCles
                  />;
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

class PageBackupCles extends React.Component {

  state = {
    'motDePasse': '',

    'certificatRacine': null,
    'cleChiffreeRacine': null,

    'certificatBackup': null,
    'clePriveeBackup': null,
    'clePubliqueBackup': null,
  }

  componentDidMount() {
    // console.debug("Component did mount PageBackupCles");
    // console.debug(sessionStorage);
    // console.debug(sessionStorage.clePubliqueMaitredescles);

    // S'assurer que la cle publique du maitre des cles est disponible
    if( ! sessionStorage.clePubliqueMaitredescles ) {
      // console.debug("Charger cle publique du maitre des cles");
      webSocketManager.emit('demandeClePubliqueMaitredescles', {})
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

  changerMotDePasse = event => {
    const {value} = event.currentTarget;
    this.setState({motDePasse: value});
  }

  genererMotDePasse = event => {
    var charsetLetters = "abcdefghijklmnopqrstuvwxyz",
        charsetDigits = "0123456789",
        retVal = "";

    var groupings = [
      charsetLetters,
      charsetLetters.toUpperCase(),
      charsetDigits,
    ]

    var groupingsAleatoire = [];
    for(let i=0; i<4; i++) {
      var idxGroupe = Math.floor(Math.random() * 3);
      groupingsAleatoire.push(groupings[idxGroupe]);
    }

    var motDePasseArray = groupingsAleatoire.reduce((liste, groupe)=>{
      var retVal = '';
      var nombreElements = Math.floor(Math.random() * 3) + 3;
      for (var i = 0, n = groupe.length; i < nombreElements; ++i) {
          retVal += groupe.charAt(Math.floor(Math.random() * n));
      }
      liste.push(retVal);
      return liste;
    }, []);

    // console.debug("Array mot de passe");
    // console.debug(motDePasseArray);

    this.setState({motDePasse: motDePasseArray.join('-')});
  }

  recupererCleRacine = event => {
    cryptoHelper.crypterCleSecrete(
      this.state.motDePasse, sessionStorage.clePubliqueMaitredescles)
    .then(({cleSecreteCryptee}) => {

      // console.debug("Mot de passe chiffre");
      // console.debug(cleSecreteCryptee);

      const routingRequete = 'requete.millegrilles.domaines.MaitreDesCles.requeteCleRacine';
      const requete = {
        'mot_de_passe_chiffre': cleSecreteCryptee,
      }
      webSocketManager.transmettreRequete(routingRequete, requete)
      .then(reponse=>{
        // console.debug("Information racine");
        // console.debug(reponse);
        this.setState({
          certificatRacine: reponse.cert_racine,
          cleChiffreeRacine: reponse.cle_racine,
        })
      })
      .catch(err=>{
        console.error("Erreur reception cle racine");
        console.error(err);
      })

    })
    .catch(err=>{
      console.error("Erreur chargement cle racine");
    })

  }

  genererCleBackup = event => {
    cryptageAsymetrique.genererKeyPair()
    .then(reponse=>{
      // console.debug("Reponse generation cle privee backup");
      // console.debug(reponse);

      const privateKeyPEM = ['-----BEGIN RSA PRIVATE KEY-----', reponse.clePrivee, '-----END RSA PRIVATE KEY-----'].join('\n');
      // console.debug(privateKeyPEM);

      const clePriveeChiffree = chiffrerPrivateKeyPEM(privateKeyPEM, this.state.motDePasse);
      this.setState({clePriveeBackup: clePriveeChiffree, clePubliqueBackup: reponse.clePublique});

    })
    .catch(err=>{
      console.error("Erreur creation cle privee pour backup");
      console.error(err);
    });
  }

  render() {

    var racine = null;
    if(this.state.cleChiffreeRacine != '') {
      racine = (
        <Feuille>
          <Row>
            <Col>
              <p>Certificat racine</p>
            </Col>
          </Row>
          <Row>
            <Col>
              <pre>
                {this.state.certificatRacine}
              </pre>
            </Col>
          </Row>
          <Row>
            <Col>
              <p>Cle chiffree racine</p>
            </Col>
          </Row>
          <Row>
            <Col>
              <pre>
                {this.state.cleChiffreeRacine}
              </pre>
            </Col>
          </Row>
        </Feuille>
      )
    }

    var backup = null;
    if(this.state.clePriveeBackup) {
      backup = (
        <Feuille>
          <Row>
            <Col>
              <p>Certificat backup</p>
            </Col>
          </Row>
          <Row>
            <Col>
              <pre>
                {this.state.certificatBackup}
              </pre>
            </Col>
          </Row>
          <Row>
            <Col>
              <p>Cle chiffree backup</p>
            </Col>
          </Row>
          <Row>
            <Col>
              <pre>
                {this.state.clePriveeBackup}
              </pre>
            </Col>
          </Row>
        </Feuille>
      );
    }

    return (
      <div>
        <Feuille>
          <Row><Col><h2 className="w3-opacity"><Trans>backup.cles.titre</Trans></h2></Col></Row>

          <Row>
            <Col>
              <p><Trans>backup.cles.instructions_1</Trans></p>
            </Col>
          </Row>

          <Row>
            <Col>
              <Alert variant="warning">
                <Alert.Heading><Trans>backup.cles.avertissementTitre</Trans></Alert.Heading>
                <p><Trans>backup.cles.avertissement_1</Trans></p>
                <p><Trans>backup.cles.avertissement_2</Trans></p>
              </Alert>
            </Col>
          </Row>

          <Row>
            <Col>
              <p><Trans>backup.cles.instructions_2</Trans></p>
              <p><Trans>backup.cles.instructions_3</Trans></p>
            </Col>
          </Row>
        </Feuille>

        <Feuille>
          <Row><Col><h2 className="w3-opacity"><Trans>backup.cles.titreMotDePasse</Trans></h2></Col></Row>
          <Form>
            <InputGroup>
              <FormControl
                placeholder="Mot de passe"
                aria-label="Mot de passe"
                aria-describedby="formMotDePasse"
                onChange={this.changerMotDePasse}
                value={this.state.motDePasse}
              />
              <InputGroup.Append>
                <Button variant="secondary" onClick={this.genererMotDePasse}><Trans>backup.cles.boutonGenerer</Trans></Button>
              </InputGroup.Append>
            </InputGroup>
          </Form>
        </Feuille>

        <Feuille>
          <Row>
            <Col>
              <ButtonGroup aria-label="Operations racine">
                <Button onClick={this.recupererCleRacine}>
                  <Trans>backup.cles.boutonRecupererCleRacine</Trans>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Feuille>

        {racine}

        <Feuille>
          <Row>
            <Col>
              <ButtonGroup aria-label="Operations backup">
                <Button onClick={this.genererCleBackup}>
                  <Trans>backup.cles.boutonGenererCleBackup</Trans>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Feuille>

        {backup}

      </div>
    );
  }

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
              <ButtonGroup aria-label="Operations Backup">
                <Button onClick={this.declencherBackup}>
                  <Trans>backup.lancer.boutonDeclencher</Trans>
                </Button>
                <Button onClick={this.restaurerBackup} variant="secondary">
                  <Trans>backup.lancer.boutonRestaurer</Trans>
                </Button>
                <Button onClick={this.regenerer} variant="secondary">
                  <Trans>backup.lancer.boutonRegenerer</Trans>
                </Button>
              </ButtonGroup>
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