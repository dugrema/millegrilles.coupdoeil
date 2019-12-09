import React from 'react';
// import logo from './logo.svg';
import './App.css';
import Ecran from './Ecran';
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client';
import openSocket from 'socket.io-client';
import webSocketManager from './WebSocketManager';
import {CryptageAsymetrique} from './mgcomponents/CryptoSubtle'

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

    console.log("Challenge recu");
    console.log(challenge);
    const credentials = await solveRegistrationChallenge(challenge);

    console.log("Transmission de la reponse au challenge");
    console.log(credentials);
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
        console.log('registration successful');
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
  };

  register = () => {
    fakeAuth.register(err => {
      if(err) {
        console.error("Erreur");
        console.error(err);
      }

      this.setState({ redirectToReferrer: true });
      // console.log("Callback register complete");
    })
    .catch(err => {
      console.log("Erreur");
      console.log(err);

      let erreur = "L'empreinte a déjà été complétée avec succès. Si vous avez perdu votre clé, il faudra reinitialiser la MilleGrille."
      this.setState({messageErreur: erreur});

    });
  };

  registerPin = event => {
    const form = event.currentTarget.form;
    var pin = form.pin.value;

    fetch(urlApi + '/api/initialiser-ajout-token', {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: JSON.stringify({ id: 'uuid', email: 'test@test', pin: pin })
    }).then(response => {
      if(response.status === 200) {
        response.json().then(challenge => {
          console.debug("Challenge recu");
          console.debug(challenge);
          solveRegistrationChallenge(challenge).then(credentials => {
            console.debug("Transmission de la reponse au challenge");
            console.debug(credentials);
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
        console.error("initialiser-ajout-token() Response code: " + response.status)
      }
    });
  }

  creerCertificatNavigateur = event => {
    const form = event.currentTarget.form;
    var pin = form.pinnav.value;
    var sujet = form.sujet.value;

    const cryptageAsymetrique = new CryptageAsymetrique();

    cryptageAsymetrique.genererKeyPair()
    .then(({clePrivee, clePublique})=>{
      sessionStorage.clePublique = clePublique;
      sessionStorage.clePrivee = clePrivee;
      return clePublique;
    }).then(clePublique=>{
      fetch(urlApi + '/api/generercertificat', {
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

          });
        } else {
          console.error("initialiser-ajout-token() Response code: " + response.status)
        }
      });

    });

  }

  render() {
    // if (redirectToReferrer) return <Redirect to={from} />;

    let erreur = null;
    if(this.state.messageErreur) {
      erreur = (
        <div className="w3-col m12 optionrow">
          <div className="w3-col m1 w3-red">
            Erreur
          </div>
          <div className="w3-col m9">
            {this.state.messageErreur}
          </div>
        </div>
      );
    }

    let options = (
      <form onSubmit={event => event.preventDefault()}>
        <div className="w3-col m12 optionrow">
          <div className="w3-col m2 bouton">
            <button onClick={this.props.login_method}>Authentifier</button>
          </div>
          <div className="w3-col m10">
            Accéder avec un token USB deja associé a votre MilleGrille.
          </div>
        </div>

        <div className="w3-col m12 optionrow">
          <div className="w3-col m2 bouton">
            <button onClick={this.registerPin}>Activer USB</button>
          </div>
          <div className="w3-col m10">
            Activer un nouveau token avec un pin:
            <input type="number" name="pin" className="pin" />
          </div>
        </div>


        <div className="w3-col m12 optionrow">
          <div className="w3-col m2 bouton">
            <button onClick={this.creerCertificatNavigateur}>Activer Navigateur</button>
          </div>
          <div className="w3-col m4">
            PIN :
            <input type="number" name="pinnav" className="pin" />
          </div>
          <div className="w3-col m6">
            Nom (e.g. iPhone) :
            <input type="text" name="sujet"/>
          </div>
        </div>


        <div className="w3-col m12 optionrow">
          <div className="w3-col m2 bouton">
            <button onClick={this.register}>Empreinte</button>
          </div>
          <div className="w3-col m10">
            Effectuer une empreinte sur votre nouvelle MilleGrille. Fonctionne
            uniquement sur une nouvelle MilleGrille.
          </div>
        </div>

      </form>
    );

    return (
      <div className="w3-col m12">
        <div className="w3-container">
          <div className="w3-col m12">
            <h1>Bienvenue à Coup D&apos;Oeil</h1>
          </div>

          {erreur}

          {options}

          <div className="w3-col m12">
            <p>Veuillez sélectionner une action.</p>
          </div>

        </div>
      </div>
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
      console.log("Certificat date expiration: " + dateExpiration + ", currentDate: " + currentDate);
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
    console.debug("Challenge certificat recu, on repond");
    console.debug(challenge);

    socket.on('login', confirmation=>{
      webSocketManager.setupWebSocket(socket);
      this.setState({loggedIn: confirmation, wss_socket: socket});
    });

    callback({reponseChallenge: challenge.challenge});

  }

  enregistrerEvenementsGeneriques(socket) {
    socket.on('erreur', erreur=>{
      console.error("Erreur recue par WSS");
      console.error(erreur);
    })

    socket.on('disconnect', () => {
      if(this.state.wss_socket === socket) {
        console.warn("Socket " + socket.id + " disconnected");
        this.setState({wss_socket: null, loggedIn: false});
      } else {
        console.info("Dangling socket closed: " + socket.id);
      }
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
        socket = openSocket('/', {reconnection: true});
        this.enregistrerEvenementsGeneriques(socket);

        socket.emit('authentification', {
          methode: 'certificatLocal',
          fingerprint: localStorage.getItem('certificat.fingerprint'),
        });

      } else {

        // Le certificat local est absent ou invalide
        // On va se connecter avec Token USB
        socket = openSocket('/', {reconnection: false});
        this.enregistrerEvenementsGeneriques(socket);

        socket.emit('authentification', {
          methode: 'tokenUSB',
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
