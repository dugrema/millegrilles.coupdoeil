import React from 'react';
// import logo from './logo.svg';
import { Alert, Container, Row, Col, Button, InputGroup, Form, FormControl } from 'react-bootstrap';
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client';
import openSocket from 'socket.io-client';

import Ecran from './Ecran';
import webSocketManager from './WebSocketManager';
import {CryptageAsymetrique} from './mgcomponents/CryptoSubtle'

import './App.css';

// const urlApi = 'https://dev2.maple.mdugre.info:3001';  // Autre site, dev.
const urlApi = '';  // Meme serveur

const fakeAuth = {
  isAuthenticated: false,
  challenge: null,
  key: null,
  id: 'a1ID',
  email: 'test@test.com',
  async register(cb) {

    const challenge = await fetch(urlApi + '/api/initialiser-empreinte', {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: JSON.stringify({ id: 'uuid', email: 'test@test' })
    })
    .then(response => response.json())
    .catch(err => {
      cb(err);
    });

    // console.log("Challenge recu");
    // console.log(challenge);
    const credentials = await solveRegistrationChallenge(challenge);

    // console.log("Transmission de la reponse au challenge");
    // console.log(credentials);
    const { loggedIn } = await fetch(
        urlApi + '/api/effectuer-empreinte',
        {
            method: 'POST',
            headers: {
                'content-type': 'Application/Json'
            },
            body: JSON.stringify(credentials)
        }
    )
    .then(response => response.json())
    .catch(err => {
      console.error("Catcher erreur")
      cb(err);
    });

    if (loggedIn) {
        // console.log('registration successful');
        this.isAuthenticated = true;
    } else {
      console.error('registration failed');
    }

    cb(); // Callback
  }
};

class Login extends React.Component {
  state = {
    redirectToReferrer: false,
    empreinte: false,
    operationEnCours: false,
    certificatsNavigateurExiste: localStorage.getItem('certificat.expiration'),
  };

  componentWillUnmount() {
    if(this.timerResetAuthentification) {
      clearTimeout(this.timerResetAuthentification);
    }
  }

  register = () => {
    this.setState({operationEnCours: true});
    fakeAuth.register(err => {
      if(err) {
        console.error("Erreur");
        console.error(err);
      }

      this.setState({ redirectToReferrer: true, operationEnCours: false });
      // console.log("Callback register complete");
    })
    .catch(err => {
      console.log("Erreur");
      console.log(err);

      let erreur = "L'empreinte a déjà été complétée avec succès. Si vous avez perdu votre clé, il faudra reinitialiser la MilleGrille."
      this.setState({messageErreur: erreur, operationEnCours: false });

    });
  };

  registerPin = event => {
    const form = event.currentTarget.form;
    var pin = form.pin.value;

    this.setState({operationEnCours: true});

    fetch(urlApi + '/api/initialiser-ajout-token', {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: JSON.stringify({ id: 'uuid', email: 'test@test', pin: pin })
    }).then(response => {
      if(response.status === 200) {
        response.json().then(challenge => {
          // console.debug("Challenge recu");
          // console.debug(challenge);
          solveRegistrationChallenge(challenge).then(credentials => {
            // console.debug("Transmission de la reponse au challenge");
            // console.debug(credentials);
            fetch(
                urlApi + '/api/effectuer-ajout-token',
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'Application/Json'
                    },
                    body: JSON.stringify(credentials)
                }
            ).then(response => {
              response.json().then(({ loggedIn }) => {
                if (loggedIn) {
                    console.log('registration successful');
                    this.isAuthenticated = true;
                } else {
                  console.error('registration failed');
                }
              });
            });
          });
        });
      } else {
        // console.error("initialiser-ajout-token() Response code: " + response.status)
        if(response.status === 403) {
          this.setState({messageErreur: "Erreur enregistrement token, pin invalide."});
        } else {
          this.setState({messageErreur: "Erreur enregistrement token, serveur inaccessible. Erreur : " + response.status});
        }
      }
    })
    .catch(err=>{
      this.setState({messageErreur: "Erreur enregistrement token, serveur inaccessible."});
    })
    .finally(()=>{
      this.setState({operationEnCours: false});
    });
  }

  creerCertificatNavigateur = event => {
    const form = event.currentTarget.form;
    var pin = form.pinnav.value;
    var sujet = form.sujet.value;

    const cryptageAsymetrique = new CryptageAsymetrique();

    this.setState({operationEnCours: true});

    cryptageAsymetrique.genererKeyPair()
    .then(({clePrivee, clePublique})=>{
      sessionStorage.clePublique = clePublique;
      sessionStorage.clePrivee = clePrivee;
      return clePublique;
    }).then(clePublique=>{
      return fetch(urlApi + '/api/generercertificat', {
          method: 'POST',
          headers: {
              'content-type': 'Application/Json'
          },
          body: JSON.stringify({
            pin: pin,
            cle_publique: clePublique,
            sujet: sujet,
          })
      }).then(response => {
        if(response.status === 200) {
          response.json().then(certificatInfo => {
            // console.debug("Certificat recu");
            // console.debug(certificatInfo);

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
        } else {
          if(response.status === 403) {
            this.setState({messageErreur: "Erreur enregistrement navigateur, pin invalide."});
          } else {
            this.setState({messageErreur: "Erreur enregistrement navigateur, serveur inaccessible. Erreur : " + response.status});
          }
        }
      })
      .catch(err=>{
        this.setState({messageErreur: "Erreur enregistrement navigateur, erreur d'access au serveur."});
      })

    })
    .finally(()=>{
      this.setState({operationEnCours: false});
    });;

  }

  login_method = event => {
    this.setState({operationEnCours: true});
    this.timerResetAuthentification = setTimeout(()=>{
      this.resetAuthentification();
    }, 15000);
    this.props.login_method(event);
  }

  resetAuthentification() {
    this.setState({
      operationEnCours: false,
      messageErreur: "Erreur d'authentification, serveur non disponible",
    });
  }

  resetCertificatLocal = event => {
    localStorage.removeItem('certificat.cert');
    localStorage.removeItem('certificat.expiration');
    localStorage.removeItem('certificat.fingerprint');
    localStorage.removeItem('certificat.fullchain');
    localStorage.removeItem('certificat.clepublique');
    localStorage.removeItem('certificat.cleprivee');
    this.setState({certificatsNavigateurExiste: false});
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
      <Row key="authentifier">
        <Col lg={12}>
          <p>Accéder à votre MilleGrille.</p>
        </Col>
        <Col lg={12}>
          <Button onClick={this.login_method} disabled={this.state.operationEnCours}>Authentifier</Button>
        </Col>
      </Row>
    );

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
      listeOptions.push(
        <Row key="desactiverNavigateur">
          <Form>
            <Col lg={12}>
              <p>Desactiver votre navigateur et supprimer les certificats locaux.</p>
            </Col>
            <Col>
              <Button variant="secondary" onClick={this.resetCertificatLocal} disabled={this.state.operationEnCours}>Desactiver navigateur</Button>
            </Col>
          </Form>
        </Row>
      );
    }

    listeOptions.push(
      <Row key="activerUsb">
        <Form>
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
        </Form>
      </Row>
    );

    listeOptions.push(
      <Row key="empreinte">
        <Col lg={12}>
          <p>
            Effectuer une empreinte sur votre nouvelle MilleGrille. Fonctionne
            uniquement sur une nouvelle MilleGrille.
          </p>
        </Col>
        <Col lg={12}>
          <Button variant="secondary" onClick={this.register} disabled={this.state.operationEnCours}>Empreinte</Button>
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
          {listeOptions}
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

  // Repond a un challenge pour token USB
  repondreChallengeTokenUSB(socket, challenge, callback) {
    socket.on('login', confirmation=>{
      webSocketManager.setupWebSocket(socket);
      this.setState({loggedIn: confirmation, wss_socket: socket});
    });

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

    socket.on('login', confirmation=>{
      webSocketManager.setupWebSocket(socket);
      this.setState({loggedIn: confirmation, wss_socket: socket});
    });

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
      'erreur.login',
      erreur => {
        console.error("Erreur connexion");
        console.error(erreur);
        socket.disconnect();  // S'assurer de ne pas essayer de reconnecter automatiquement
      }
    )

  }

  login = () => {
    if(!this.state.wss_socket) {

      let socket;
      if(this.peutUtiliserCertificatLocal()) {

        // Ouvrir un socket avec certificat local.
        // Peut se reconnecter automatiquement
        socket = openSocket('/', {
          reconnection: true,
          reconnectionAttempts: 30,
          reconnectionDelay: 500,
          reconnectionDelayMax: 30000,
          randomizationFactor: 0.5
        });
        socket.on("authentifier", ()=>{
          socket.emit('authentification', {
            methode: 'certificatLocal',
            fingerprint: localStorage.getItem('certificat.fingerprint'),
            certificat: localStorage.getItem('certificat.fullchain'),
          });
        })

        socket.on("reconnect", ()=>{
          console.debug("Reconnexion");
        })

        this.enregistrerEvenementsGeneriques(socket);

      } else {

        // Le certificat local est absent ou invalide
        // On va se connecter avec Token USB
        socket = openSocket('/', {reconnection: false});
        socket.on("authentifier", ()=>{
          socket.emit('authentification', {
            methode: 'tokenUSB',
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

        this.enregistrerEvenementsGeneriques(socket);

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

export default App;
