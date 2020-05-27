import React from 'react';
// import logo from './logo.svg';
import { Alert, Container, Row, Col, Button, InputGroup, Form, FormControl } from 'react-bootstrap';
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client';
import openSocket from 'socket.io-client';

import Ecran from './Ecran';
import webSocketManager from './WebSocketManager';
import {CryptageAsymetrique} from './mgcomponents/CryptoSubtle'
import {DateTimeAfficher} from './mgcomponents/ReactFormatters'

import './App.css';

const urlApi = '';  // Meme serveur

const cryptageAsymetrique = new CryptageAsymetrique();

class Login extends React.Component {
  state = {
    idMillegrille: '',
    hebergement: false,
    redirectToReferrer: false,
    empreinte: true,
    operationEnCours: false,
    certificatsNavigateurExiste: localStorage.getItem('certificat.expiration'),
  };

  componentDidMount() {
    // Initialiser idmg a parir de localStorage
    const idmgSauvegarde = localStorage.getItem('idmg');
    if(idmgSauvegarde) {
      this.setState({idMillegrille: idmgSauvegarde});
    }

    // Charger l'information a partir du serveur (config/info.json)
    const infoUrl = urlApi + '/coupdoeil/config/info.json';
    fetch(infoUrl).then(response => {
      if(response.status === 200) {
        response.json().then(reponseJson => {
          // console.debug("Reponse config/info.json");
          // console.debug(reponseJson);
          const idmgConfig = reponseJson.idmg;
          var hebergement = reponseJson.modeHebergement;
          var empreinte = reponseJson.empreinte || false;

          const stateUpdate = {hebergement, empreinte};
          if(!idmgSauvegarde) {
            stateUpdate.idMillegrille = idmgConfig;
            localStorage.setItem('idmg', idmgConfig);
          } else if(!hebergement) {
            // Hebergement inactif, override du idmg sauvegarde
            stateUpdate.idMillegrille = idmgConfig;
            localStorage.setItem('idmg', idmgConfig);
          }
          this.setState(stateUpdate);
        });
      }
    })
    .catch(err=>{
      console.error("Erreur recuperation config/info.json");
      console.error(err);
    });

    // Nettoyer la session du navigateur
    const sessionKeys = ['clePubliqueMaitredescles', 'fingerprintMaitredescles'];
    sessionKeys.forEach(key=>sessionStorage.removeItem(key));

  }

  componentWillUnmount() {
    if(this.timerResetAuthentification) {
      clearTimeout(this.timerResetAuthentification);
    }
  }

  register = () => {
    this.setState({operationEnCours: true, action: "effectuerEmpreinte"}, ()=>{
      this.timerResetAuthentification = setTimeout(()=>{
        this.resetAuthentification();
      }, 5000);
      this.props.login_method(this.state)
    });
  };

  registerPin = event => {
    const form = event.currentTarget.form;
    var pin = form.pin.value;

    this.setState({operationEnCours: true, pin, action: "ajouterTokenUSB"}, ()=>{
      this.timerResetAuthentification = setTimeout(()=>{
        this.resetAuthentification();
      }, 5000);
      this.props.login_method(this.state)
    });

  }

  creerCertificatNavigateur = event => {
    const form = event.currentTarget.form;
    var pin = form.pinnav.value;
    var sujet = form.sujet.value;

    this.setState({operationEnCours: true, pin, sujet, action: "genererCertificat"}, ()=>{
      this.timerResetAuthentification = setTimeout(()=>{
        this.resetAuthentification();
      }, 5000);
      this.props.login_method(this.state)
    });

  }

  login_method = event => {
    // console.debug(event.currentTarget);
    this.setState({operationEnCours: true, action: 'authentifier',}, ()=>{
      this.timerResetAuthentification = setTimeout(()=>{
        this.resetAuthentification();
      }, 15000);
      this.props.login_method(this.state);
    });
  }

  resetAuthentification() {
    this.setState({
      operationEnCours: false,
      messageErreur: "Erreur d'authentification, serveur non disponible",
    });
  }

  resetCertificatLocal = event => {
    const keys = ['certificat.fullchain', 'certificat.clepublique', 'certificat.cleprivee', 'certificat.fingerprint', 'certificat.cert', 'certificat.expiration'];
    keys.forEach(key=>localStorage.removeItem(key));
    this.setState({certificatsNavigateurExiste: false});
  }

  changerId = event => {
    const {value} = event.currentTarget;
    this.setState({idMillegrille: value});
    localStorage.setItem('idmg', value);

    this.resetCertificatLocal();
  }

  render() {
    // if (redirectToReferrer) return <Redirect to={from} />;

    let message = null;
    if(this.state.messageErreur) {
      message = (
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>
            {this.state.messageErreur}
          </p>
        </Alert>
      );
    } else if(this.state.messageConfirmation) {
      message = (
        <Alert variant="success">
          <Alert.Heading>Succes</Alert.Heading>
          <p>
            {this.state.messageConfirmation}
          </p>
        </Alert>
      );
    }

    var listeOptions = [];
    listeOptions.push(
      <SelectionMillegrille key="idMillegrille"
        idMillegrille={this.state.idMillegrille}
        changerId={this.changerId}
        hebergement={this.state.hebergement} />
    );

    if( this.state.hebergement || ! this.state.empreinte ) {
      listeOptions.push(
        <Row key="empreinte">
          <Col lg={12}>
            <p>
              Effectuer une empreinte sur votre nouvelle MilleGrille.
            </p>
          </Col>
          <Col lg={12}>
            <Button variant="primary" onClick={this.register} disabled={this.state.operationEnCours}>Empreinte</Button>
          </Col>
        </Row>
      );
    }

    if( this.state.hebergement || this.state.empreinte ) {
      listeOptions.push(
        <Row key="authentifier">
          <Col lg={12}>
            <p>Accéder à votre MilleGrille.</p>
          </Col>
          <Col lg={12}>
            <Button onClick={this.login_method} disabled={this.state.operationEnCours}>Authentifier</Button>
          </Col>
        </Row>
      );
    }

    if( ! this.state.certificatsNavigateurExiste ) {
      listeOptions.push(
        <Row key="activerNavigateur">
          <Form>
            <Col lg={12}>
              <p>Activer votre navigateur avec un PIN.</p>
            </Col>

            <Col lg={12}>
              <Form.Group controlId="sujet">
                <InputGroup className="pinInput">
                  <InputGroup.Prepend>
                    <InputGroup.Text id="sujet">Nom</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    placeholder="e.g. iPhone, maison, tablette"
                    aria-label="Sujet"
                    aria-describedby="sujet"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col lg={12}>
              <Form.Group controlId="pinnav">
                <InputGroup className="pinInput">
                  <InputGroup.Prepend>
                    <InputGroup.Text id="pin">PIN</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    placeholder="123456"
                    aria-label="PIN"
                    aria-describedby="pin"
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col lg={12}>
              <Button variant="secondary" onClick={this.creerCertificatNavigateur} disabled={this.state.operationEnCours}>Activer Navigateur</Button>
            </Col>
          </Form>
        </Row>
      );
    } else {
      // Le navigateur a deja un certificat
      var expirationCert = localStorage.getItem('certificat.expiration');
      listeOptions.push(
        <Row key="desactiverNavigateur">
          <Col lg={12}>
            <p>
              Desactiver votre navigateur et supprimer les certificats locaux.
              Expiration: <DateTimeAfficher date={expirationCert}/>
            </p>
          </Col>
          <Col>
            <Button variant="secondary" onClick={this.resetCertificatLocal} disabled={this.state.operationEnCours}>Desactiver navigateur</Button>
          </Col>
        </Row>
      );
    }

    listeOptions.push(
      <Row key="activerUsb">
        <Col lg={12}>
          <p>Activer un nouveau token avec un pin.</p>
        </Col>

        <Col lg={12}>
          <Form.Group controlId="pin">
            <InputGroup className="pinInput">
              <InputGroup.Prepend>
                <InputGroup.Text id="pin">PIN</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                placeholder="123456"
                aria-label="PIN"
                aria-describedby="pin"
              />
            </InputGroup>
          </Form.Group>
        </Col>

        <Col lg={12}>
          <Button variant="secondary" onClick={this.registerPin} disabled={this.state.operationEnCours}>Activer USB</Button>
        </Col>
      </Row>
    );

    return (
      <Container>
        <Row>
          <Col>
            <h1>Bienvenue à Coup D&apos;Oeil</h1>
          </Col>
        </Row>

        {message}

        <Row>
          <Col>
            <p>Veuillez sélectionner une action.</p>
          </Col>
        </Row>

        <Container className="formLogin">
          <Form>
            {listeOptions}
          </Form>
        </Container>

      </Container>
    );
  }
}

class App extends React.Component {
  state = {
    loggedIn: false,
    wss_socket: null
  }

  peutUtiliserCertificatLocal() {
    if(localStorage.getItem('certificat.expiration') &&
       localStorage.getItem('certificat.cert') &&
       localStorage.getItem('certificat.clepublique') &&
       localStorage.getItem('certificat.cleprivee') &&
       localStorage.getItem('certificat.fingerprint')
     ) {

      // On a tous les elements necessaires pour login via cert
      // Verifier si le certificat est expire.
      let dateExpiration = localStorage.getItem('certificat.expiration') * 1000;
      let currentDate = new Date().getTime();
      // console.log("Certificat date expiration: " + dateExpiration + ", currentDate: " + currentDate);
      if(dateExpiration > currentDate) {
        // Le certificat n'est pas expire, on peut l'utiliser.
        return true;
      }

    }

    return false;
  }

  async repondreChallengeTokenUSBRegistration(socket, challenge, callback) {
    solveRegistrationChallenge(challenge)
    .then(credentials=>{
      callback(credentials);
    })
    .catch(err=>{
      console.error("Erreur challenge reply registration security key");
      console.error(err);
      try{this.state.wss_socket.disconnect();} catch(err) {}
      this.setState({wss_socket: null});
    });
  }

  // Repond a un challenge pour token USB
  repondreChallengeTokenUSB(socket, challenge, callback) {

    // 2. Resoudre challenge et repondre au serveur pour activer connexion
    solveLoginChallenge(challenge)
    .then(credentials => {
      // console.debug("Tranmission evenement challenge_reply");
      //socket.emit('challenge_reply', credentials);
      callback(credentials); // Callback du challenge via websocket
    })
    .catch(err=>{
      console.error("Erreur challenge reply");
      console.error(err);
      try{this.state.wss_socket.disconnect();} catch(err) {}
      this.setState({wss_socket: null});
    });
  }

  // Repond a un challenge pour certificat local
  repondreChallengeCertificat(socket, challenge, callback) {
    // console.debug("Challenge certificat recu, on repond");
    // console.debug(challenge);

    // Decrypter le challenge avec la cle privee
    const challengeCrypte = challenge.challengeCrypte;
    const cryptageAsymetrique = new CryptageAsymetrique();

    cryptageAsymetrique.decrypterCleSecrete(
      challengeCrypte, localStorage.getItem('certificat.cleprivee'))
    .then(cleSecreteDecryptee=>{
      // console.log("Resultat cle secrete decryptee: " + cleSecreteDecryptee);
      callback({reponseChallenge: cleSecreteDecryptee});
    })
    .catch(err=>{
      console.error("Erreur DecryptCleSecrete");
      console.error(err);
    })

  }

  enregistrerEvenementsGeneriques(socket) {
    socket.on('erreur', erreur=>{
      console.error("Erreur recue par WSS");
      console.error(erreur);
    })

    socket.on('login', confirmation=>{
      // console.debug("Message login recu : %s", confirmation);
      webSocketManager.setupWebSocket(socket);
      this.setState({loggedIn: confirmation, wss_socket: socket});
    });

    // Gerer l'authentification:
    socket.on(
      'challengeTokenUSB',
      (challenge, cb) => {this.repondreChallengeTokenUSB(socket, challenge, cb)}
    );
    socket.on(
      'challengeCertificat',
      (challenge, cb) => {this.repondreChallengeCertificat(socket, challenge, cb)}
    );
    socket.on(
      'challengeTokenUSBRegistration',
      (challenge, cb) => {this.repondreChallengeTokenUSBRegistration(socket, challenge, cb)}
    );

    socket.on(
      'erreur.login',
      erreur => {
        console.error("Erreur connexion");
        console.error(erreur);
        socket.disconnect();  // S'assurer de ne pas essayer de reconnecter automatiquement
      }
    )

  }

  login = ({idMillegrille, action, pin, sujet}) => {

    // console.debug("ID MilleGrille: %s, action: %s", idMillegrille, action);

    if(!this.state.wss_socket) {

      let socket;
      if( action === 'genererCertificat' ) {

        cryptageAsymetrique.genererKeyPair()
        .then(({clePrivee, clePublique})=>{
          sessionStorage.clePublique = clePublique;
          sessionStorage.clePrivee = clePrivee;
          return clePublique;
        }).then(clePublique=>{

          console.debug("Cle publique generee, ouverture Socket.IO");

          // Ouvrir un socket avec pin pour demander certificat
          // Peut se reconnecter automatiquement (sauf si creation certificat invalide)
          socket = this.openSocketHelper({reconnection: true});
          socket.on("certificatGenere", certificatInfo => {
            console.debug("Certificat recu");
            console.debug(certificatInfo);

            // Sauvegarder information dans storage local
            localStorage.setItem('certificat.cert', certificatInfo.cert);
            localStorage.setItem('certificat.expiration', certificatInfo.certificat_info.not_valid_after);
            localStorage.setItem('certificat.fingerprint', certificatInfo.certificat_info.fingerprint);
            localStorage.setItem('certificat.fullchain', certificatInfo.fullchain.join('\n'));

            // Transferer les cles publiques et privees de session vers local
            localStorage.setItem('certificat.clepublique', sessionStorage.clePublique);
            localStorage.setItem('certificat.cleprivee', sessionStorage.clePrivee);

            delete sessionStorage.clePublique;
            delete sessionStorage.clePrivee;

            this.setState({
              messageConfirmation: "Certificat cree avec succes",
              messageErreur: false,
              certificatsNavigateurExiste: true,
            });
          });

          socket.on("authentifier", ()=>{
            socket.emit('authentification', {
              methode: 'genererCertificat',
              idMillegrille,
              pin,
              sujet,
              clePublique,
            });
          });

          socket.on("reconnect", ()=>{
            socket.disconnect(); // Annuler la reconnexion
            console.warn("Annuler reconnexion lors de la creation de certificat")
          })

        });

      } else if( action === 'ajouterTokenUSB' ) {

        // Ouvrir un socket avec pin pour demander certificat
        // Peut se reconnecter automatiquement (sauf si creation certificat invalide)
        socket = this.openSocketHelper({reconnection: false});
        socket.on("authentifier", ()=>{
          socket.emit('authentification', {
            methode: 'ajouterTokenUSB',
            idMillegrille,
            pin,
          });
        });

      } else if( action === 'effectuerEmpreinte' ) {

        // Ouvrir un socket avec pin pour demander certificat
        // Peut se reconnecter automatiquement (sauf si creation certificat invalide)
        socket = this.openSocketHelper({reconnection: false});
        socket.on("authentifier", ()=>{
          socket.emit('authentification', {
            methode: 'effectuerEmpreinte',
            idMillegrille,
          });
        });

      } else if(this.peutUtiliserCertificatLocal()) {

        // Ouvrir un socket avec certificat local.
        // Peut se reconnecter automatiquement
        socket = this.openSocketHelper({reconnection: true});
        socket.on("authentifier", ()=>{
          socket.emit('authentification', {
            methode: 'certificatLocal',
            idMillegrille,
            fingerprint: localStorage.getItem('certificat.fingerprint'),
            certificat: localStorage.getItem('certificat.fullchain'),
          });
        })

        socket.on("reconnect", ()=>{
          console.debug("Reconnexion");
        })

      } else {

        // Le certificat local est absent ou invalide
        // On va se connecter avec Token USB
        socket = this.openSocketHelper({reconnection: false});
        socket.on("authentifier", ()=>{
          socket.emit('authentification', {
            methode: 'tokenUSB',
            idMillegrille,
          });
        })

        socket.on('disconnect', () => {
          if(this.state.wss_socket === socket) {
            console.warn("Socket " + socket.id + " disconnected");
            this.setState({wss_socket: null, loggedIn: false});
          } else {
            console.info("Dangling socket closed: " + socket.id);
          }
        });

      }

    } else {
      throw new ReferenceError("Login: WebSocket deja ouvert");
    }
  };

  renderLogin() {
    // Login page
    return (
      <div className="App">
        <Login
          login_method={this.login}
          empreinte={this.state.empreinte}
        />
      </div>
    );
  }

  renderApplication() {
    return (
      <div className="App">
        <Ecran/>
      </div>
    );
  }

  openSocketHelper(opts) {
    if (!opts) opts = {};
    let socket;

    if(opts.reconnection) {
      socket = openSocket('/', {
        path: '/coupdoeil/socket.io',
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 500,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5
      });
    } else {
      socket = openSocket('/', {path: '/coupdoeil/socket.io', reconnection: false});
    }

    this.enregistrerEvenementsGeneriques(socket);

    return socket;
  }

  render() {
    // Main render de l'application.
    if(this.state.loggedIn) {
      // App principale une fois logged in
      return this.renderApplication();
    } else {
      // Authentification et initialisation
      return this.renderLogin();
    }
  }
}

// Affiche options de selections de la MilleGrille
function SelectionMillegrille(props) {

  let contenu;
  if(props.hebergement) {
    contenu = (
      <Row key="millegrille">
        <Col lg={12}>
          <p>Identifier la MilleGrille avec son identificateur (idmg) ou son nom</p>
        </Col>
        <Col lg={12}>
          <Form.Group controlId="millegrille">
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text id="millegrille">IDMG ou nom</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl
                value={props.idMillegrille}
                onChange={props.changerId}
                placeholder="e.g. vPXTaPjpUErFjV5d8pKrAHHqKhFUr7GSEruCL7, maple"
                aria-label="millegrille"
                aria-describedby="millegrille"
              />
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
    );
  } else {
    contenu = (
      <Row>
        <Col lg={12}>
          <p>MilleGrille {props.idMillegrille}</p>
        </Col>
      </Row>
    );
  }

  return contenu;

}


export default App;
