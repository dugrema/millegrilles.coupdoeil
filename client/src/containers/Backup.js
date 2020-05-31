import React from 'react';
import QRCode from 'qrcode.react';
import Dropzone from 'react-dropzone';

import {MilleGrillesCryptoHelper, CryptageAsymetrique} from '../api/CryptoSubtle';
import {chiffrerPrivateKeyPEM} from '../api/CryptoForge';

import { Alert, Form, Row, Col,
         Button, ButtonGroup, InputGroup, FormControl} from 'react-bootstrap';
import { Feuille } from '../components/Feuilles';
import { Trans } from 'react-i18next';

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
    this.props.rootProps.websocketApp.subscribe(this.config.subscriptions, this.processMessage);
    // console.debug(this.props);
  }

  afficherEcran = event => {
    const {value} = event.currentTarget;
    this.setState({ecranCourant: value});
  }

  retourInitiale = () => {
    this.setState({ecranCourant: null})
  }

  render() {
    let ecranCourant = this.state.ecranCourant

    let contenu;
    if(ecranCourant === 'backupCles') {
      contenu = <PageBackupCles
                  idmg={this.props.idmg}
                  rootProps={this.props.rootProps}
                  />
    } else if(ecranCourant === 'configurer') {
      contenu = null
    } else if(ecranCourant === 'lancerBackup') {
      contenu = <PageOperationsBackup rootProps={this.props.rootProps}/>
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
            <Button className="aslink bouton" onClick={props.fonctionsNavigation.afficherEcran} value="backupCles">
              <Trans>backup.initiale.lienBackupCles</Trans>
            </Button>
          </li>
          <li>
            <Button className="aslink bouton" onClick={props.fonctionsNavigation.afficherEcran} value="configurer">
              <Trans>backup.initiale.configurer</Trans>
            </Button>
          </li>
          <li>
            <Button className="aslink bouton" onClick={props.fonctionsNavigation.afficherEcran} value="lancerBackup">
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

  changerMotDePasse = event => {
    const {value} = event.currentTarget;
    this.setState({motDePasse: value});
  }

  genererMotDePasse = async event => {
    var charsetLetters = "abcdefghijklmnopqrstuvwxyz",
        charsetDigits = "0123456789";

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

    await new Promise((resolve, reject)=>{
      this.setState({motDePasse: motDePasseArray.join('-')}, ()=>{resolve()});
    });
  }

  recupererCleRacine = async event => {

    // S'assurer qu'un mot de passe a ete fourni, sinon en generer un
    if(!this.state.motDePasse || this.state.motDePasse === '') {
      await this.genererMotDePasse();
    }

    cryptoHelper.crypterCleSecrete(
      this.state.motDePasse, sessionStorage.clePubliqueMaitredescles)
    .then(({cleSecreteCryptee}) => {

      // console.debug("Mot de passe chiffre");
      // console.debug(cleSecreteCryptee);

      const routingRequete = 'requete.millegrilles.domaines.MaitreDesCles.requeteCleRacine';
      const requete = {
        'mot_de_passe_chiffre': cleSecreteCryptee,
      }
      this.props.rootProps.websocketApp.transmettreRequete(routingRequete, requete)
      .then(reponse=>{
        // console.debug("Information racine");
        // console.debug(reponse);
        this.setState(
          {
            certificatRacine: reponse.cert_racine,
            cleChiffreeRacine: reponse.cle_racine,
          },
          ()=>{this.genererUrlDataDownload()}
        )
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

  genererCleBackup = async event => {

    // S'assurer qu'un mot de passe a ete fourni, sinon en generer un
    if(!this.state.motDePasse || this.state.motDePasse === '') {
      await this.genererMotDePasse();
    }

    cryptageAsymetrique.genererKeyPair()
    .then(reponse=>{
      // console.debug("Reponse generation cle privee backup");
      // console.debug(reponse);

      const privateKeyPEM = ['-----BEGIN RSA PRIVATE KEY-----', reponse.clePrivee, '-----END RSA PRIVATE KEY-----'].join('\n');
      // console.debug(privateKeyPEM);
      const publicKeyPEM = ['-----BEGIN PUBLIC KEY-----', reponse.clePublique, '-----END PUBLIC KEY-----'].join('\n');

      // Transmettre la cle publique pour recuperer certificat
      const routing = 'commande.millegrilles.domaines.MaitreDesCles.signerCleBackup';
      const commande = {
        'cle_publique': publicKeyPEM
      }
      // console.debug(commande);

      this.props.rootProps.websocketApp.transmettreCommande(routing, commande)
      .then(reponseSignature=>{
        // console.debug(reponseSignature)
        const clePriveeChiffree = chiffrerPrivateKeyPEM(privateKeyPEM, this.state.motDePasse);
        this.setState(
          {
            clePriveeBackup: clePriveeChiffree,
            clePubliqueBackup: reponse.clePublique,
            certificatBackup: reponseSignature.cert,
          },
          ()=>{this.genererUrlDataDownload()}
        );
      });

    })
    .catch(err=>{
      console.error("Erreur creation cle privee pour backup");
      console.error(err);
    });
  }

  genererUrlDataDownload() {
    const jsonContent = {
      idmg: this.props.idmg
    }
    var urlCleRacine = null, urlCertRacine = null;

    if(this.state.motDePasse) {
      jsonContent.motDePasse = this.state.motDePasse;
    }

    if(this.state.certificatRacine || this.state.cleChiffreeRacine) {
      const racine = {
        certificat: this.state.certificatRacine,
        cleChiffree: this.state.cleChiffreeRacine,
      }
      jsonContent.racine = racine;

      const blobCleRacine = new Blob([this.state.cleChiffreeRacine], {type: 'application/text'});
      urlCleRacine = window.URL.createObjectURL(blobCleRacine);
      const blobCertRacine = new Blob([this.state.certificatRacine], {type: 'application/text'});
      urlCertRacine = window.URL.createObjectURL(blobCertRacine);

    }

    if(this.state.certificatBackup || this.state.clePriveeBackup) {
      const backup = {
        certificat: this.state.certificatBackup,
        cleChiffree: this.state.clePriveeBackup,
      }
      jsonContent.backup = backup;
    }

    const stringContent = JSON.stringify(jsonContent);
    // const blobFichier = new Blob([new Uint8Array(bufferDecrypte)], {type: 'application/json'});
    const blobFichier = new Blob([stringContent], {type: 'application/json'});
    let dataUrl = window.URL.createObjectURL(blobFichier);
    this.setState({dataUrl, urlCleRacine, urlCertRacine})
  }

  render() {

    var racine = null, backup = null;

    if(this.state.certificatRacine || this.state.cleChiffreeRacine) {
      racine = (
        <div>
          <div className="pagebreak"></div>
          <Feuille>
            <h2>Certificat et cle racine</h2>
            <RenderPair
              certificat={this.state.certificatRacine}
              clePrivee={this.state.cleChiffreeRacine}
              nom="racine"
              />
          </Feuille>
        </div>
      )
    } else {
      racine = (
        <Feuille>
          <Row>
            <Col>
              <ButtonGroup aria-label="Operations racine">
              <Button onClick={this.recupererCleRacine} className="bouton">
                  <Trans>backup.cles.boutonRecupererCleRacine</Trans>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Feuille>
      );
    }

    if(this.state.certificatBackup || this.state.clePriveeBackup) {
      backup = (
        <div>
          <div className="pagebreak"></div>
          <Feuille>
            <h2>Certificat et cle de backup</h2>
            <RenderPair
              certificat={this.state.certificatBackup}
              clePrivee={this.state.clePriveeBackup}
              nom="backup"
              />
          </Feuille>
        </div>
      )
    } else {
      backup = (
        <Feuille>
          <Row>
            <Col>
              <ButtonGroup aria-label="Operations backup">
                <Button onClick={this.genererCleBackup} className="bouton">
                  <Trans>backup.cles.boutonGenererCleBackup</Trans>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Feuille>
      );
    }

    var qrCodeMotDePasse = null;
    if(this.state.motDePasse) {
      qrCodeMotDePasse = <QRCode value={this.state.motDePasse} size={75} />
    }

    var boutonDownload, boutonDownloadCleRacine, boutonDownloadCertRacine;
    if(this.state.dataUrl) {
      var fichierDownload = 'backupCles_' + this.props.idmg + ".json";
      boutonDownload = (
        <span>
          Fichier de JSON cles :
          <a href={this.state.dataUrl} download={fichierDownload}>
            <i title="Telecharger" className="fa fa-download fa-2x"/>
          </a>
        </span>
      );
    }

    if(this.state.urlCleRacine) {
      var fichierDownloadRacine = this.props.idmg + ".key.pem";
      boutonDownloadCleRacine = (
        <span>
          Cle racine (PEM):
          <a href={this.state.urlCleRacine} download={fichierDownloadRacine}>
            <i title="Telecharger cle racine" className="fa fa-download fa-2x"/>
          </a>
        </span>
      );
    }

    if(this.state.urlCertRacine) {
      var fichierDownloadCertRacine = this.props.idmg + ".cert.pem";
      boutonDownloadCertRacine = (
        <span>
          Certificat racine (PEM) :
          <a href={this.state.urlCertRacine} download={fichierDownloadCertRacine}>
            <i title="Telecharger certificat racine" className="fa fa-download fa-2x"/>
          </a>
        </span>
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
          <Row>
            <Col lg={8}>
              <h2 className="w3-opacity"><Trans>backup.cles.titreMotDePasse</Trans></h2>
            </Col>
            <Col lg={4}>
              {qrCodeMotDePasse}
            </Col>
          </Row>
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
                <Button variant="secondary" className="bouton" onClick={this.genererMotDePasse}>
                    <Trans>backup.cles.boutonGenerer</Trans>
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Form>

          {boutonDownload}
          {boutonDownloadCleRacine}
          {boutonDownloadCertRacine}
        </Feuille>

        {racine}

        {backup}

      </div>
    );
  }

}

class PageOperationsBackup extends React.Component {

  state = {
    motDePasse: '',
    backupCle: '',
  }

  changerMotDePasse = event => {
    const {value} = event.currentTarget;
    this.setState({motDePasse: value});
  }

  changerBackupCle = event => {
    const {value} = event.currentTarget;
    this.setState({backupCle: value});
  }

  declencherBackup = event => {
    const routing = 'commande.global.declencherBackupHoraire';
    this.props.rootProps.websocketApp.transmettreCommande(
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
    this.props.rootProps.websocketApp.transmettreCommande(
      routing,
      {},
      {nowait: true}
    );
  }

  restaurerBackup = event => {
    // console.debug("Commande restaurer backup");
    const routing = 'commande.backup.preparerStagingRestauration';
    this.props.rootProps.websocketApp.transmettreCommande(
      routing,
      {},
      {nowait: true}
    );
  }

  regenerer = event => {
    const routing = 'commande.global.regenerer';
    this.props.rootProps.websocketApp.transmettreCommande(
      routing,
      {},
      {nowait: true}
    );
  }

  uploadFileProcessor = async acceptedFiles => {
    // Traitement d'un fichier a uploader.
    // console.debug(acceptedFiles);

    // console.debug("Fichiers")
    acceptedFiles.forEach( async file => {
      // Ajouter le fichier a l'upload queue
      // console.debug(file)
      if( file.type === 'application/json' ) {
        // console.debug("Fichier JSON");
        var reader = new FileReader();
        const {contenuFichier} = await new Promise((resolve, reject)=>{
          reader.onload = () => {
            var buffer = reader.result;
            // console.debug("Ficher charge dans buffer, taille " + buffer.byteLength);
            const contenuFichier =  String.fromCharCode.apply(null, new Uint8Array(buffer));
            resolve({contenuFichier});
          }
          reader.onerror = err => {
            reject(err);
          }
          reader.readAsArrayBuffer(file);
        });

        // console.debug(contenuFichier);
        const contenuJson = JSON.parse(contenuFichier);
        // console.debug(contenuJson);

        const {backup} = contenuJson;
        if(contenuJson.motDePasse) {
          this.setState({motDePasse: contenuJson.motDePasse});
        }
        if(backup) {
          if(backup.cleChiffree) {
            this.setState({backupCle: backup.cleChiffree});
          }
          if(backup.certificat) {
            this.setState({backupCertificat: backup.certificat});
          }
        }

      }
    });

  }

  restaurerCleBackup = async event => {
    const motDePasse = await cryptoHelper.crypterCleSecrete(
      this.state.motDePasse, sessionStorage.clePubliqueMaitredescles)
    .then(({cleSecreteCryptee}) => {
      return cleSecreteCryptee;
    });

    const routing = 'commande.millegrilles.domaines.MaitreDesCles.restaurerBackupCles';
    const commande = {
      'mot_de_passe_chiffre': motDePasse,
      "cle_privee": this.state.backupCle,
    }
    this.props.rootProps.websocketApp.transmettreCommande(
      routing,
      commande,
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
            <Col>
              <h2><Trans>backup.lancer.titreRestaurerCles</Trans></h2>
            </Col>
          </Row>
          <Row>
            <Col>
              <p><Trans>backup.lancer.instructionsRestaurerCles_1</Trans></p>
              <p><Trans>backup.lancer.instructionsRestaurerCles_2</Trans></p>
            </Col>
          </Row>
          <Row>
            <Col>
              Uploader :
              <Dropzone onDrop={this.uploadFileProcessor}>
                {({getRootProps, getInputProps}) => (
                  <section className="uploadIcon">
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <span className="fa fa-upload fa-2x"/>
                    </div>
                  </section>
                )}
              </Dropzone>
            </Col>
          </Row>
          <Form>
            <Row>
              <Col xl={6}>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text id="formMotDePasse"><Trans>backup.lancer.champMotDePasse</Trans></InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    placeholder="Mot de passe"
                    aria-label="Mot de passe"
                    aria-describedby="formMotDePasse"
                    onChange={this.changerMotDePasse}
                    value={this.state.motDePasse}
                  />
                </InputGroup>
              </Col>
              <Col xl={6}>
                <Form.Group controlId="clePEMTextarea">
                  <Form.Label>Cle format PEM</Form.Label>
                  <Form.Control as="textarea" rows="20" className="textAreaCle"
                    onChange={this.changerBackupCle}
                    value={this.state.backupCle}
                    />
                </Form.Group>
              </Col>
            </Row>
          </Form>
          <Row>
            <Col>
              <Button onClick={this.restaurerCleBackup}>
                <Trans>backup.lancer.boutonRestaurerCles</Trans>
              </Button>
            </Col>
          </Row>
        </Feuille>

        <Feuille>
          <Row>
            <Col>
              <h2><Trans>backup.lancer.actionsInterdites</Trans></h2>
            </Col>
          </Row>
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

function RenderPair(props) {
  var certificat = null, clePrivee = null;

  if(props.certificat) {
    certificat = (
      <div className="pem">
        <Row>
          <Col>
            <h3>Certificat</h3>
          </Col>
        </Row>
        <RenderPEM pem={props.certificat} nom={props.nom + '.cert'}/>
      </div>
    );
  }

  if(props.clePrivee) {
    clePrivee = (
      <div>
        <Row>
          <Col>
            <h3>Cle</h3>
          </Col>
        </Row>
        <RenderPEM pem={props.clePrivee} nom={props.nom + '.cle'}/>
      </div>
    );
  }

  return (
    <div>
      {clePrivee}
      {certificat}
    </div>
  );

}

class RenderPEM extends React.Component {

  state = {
    afficherPEM: false,
  }

  toggleAfficherPEM = event => {
    this.setState({afficherPEM: !this.state.afficherPEM});
  }

  render() {
    const tailleMaxQR = 750;
    const qrCodes = [];

    const nbCodes = Math.ceil(this.props.pem.length / tailleMaxQR);

    var afficherPEM = null;
    if(this.state.afficherPEM) {
      afficherPEM = (
        <Row>
          <Col>
            <pre>
              {this.props.pem}
            </pre>
          </Col>
        </Row>
      );
    }

    for(let idx=0; idx < nbCodes; idx++) {
      var debut = idx * tailleMaxQR, fin = (idx+1) * tailleMaxQR;
      if(fin > this.props.pem.length) fin = this.props.pem.length;
      var pemData = this.props.pem.slice(debut, fin);
      // Ajouter premiere ligne d'info pour re-assemblage
      pemData = this.props.nom + ';' + idx + '\n' + pemData;
      qrCodes.push(
        <Col md={6} key={idx}>
          <QRCode className="qrcode" value={pemData} size={400} />
        </Col>
      );
    }

    return(
      <div>
        <Row>
          {qrCodes}
        </Row>
        {afficherPEM}
        <Row>
          <Col>
            <Button className="bouton" variant="secondary" onClick={this.toggleAfficherPEM}>PEM</Button>
          </Col>
        </Row>
      </div>
    );
  }

}
