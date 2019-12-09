import React from 'react';
// import logo from './logo.svg';
import './App.css';
import Ecran from './Ecran';
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client';
import openSocket from 'socket.io-client';
import webSocketManager from './WebSocketManager';

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

    fetch(urlApi + '/api/generercertificat', {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: JSON.stringify({
          pin: pin,
          cle_publique: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqYE8pRzlFVwAgc2uB3ot6Ffd8pPpG4Sb8btFdjArvYcbuWvsRntBUgm/w6c831GpEoOrDr/EoEPRgTjJ81zxa1tkFprsmw9t8HJ0IOV9WF6p1X8gvf4FZaeLW6wTcA6LGhk1lRoN0jIr0VhNBejX4Xl7m7B1hR+pgmafG9Qm9acAZx2+opi9cYkG0lcl33R/106x8nnaF3jwjhBjFEazH5roHN9W253Y1subRXYC0Uq6SIlzN2HDPLn0oHLujAmf0NP6PrqHmDxfrnWc+KKuSJD2Dyf8w07AjJwJgpmWa9JrcqvYjR/BViI06/CqrtJpSAHpCguSQB3QbidSzbFF3wIDAQAB',
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

        });
      } else {
        console.error("initialiser-ajout-token() Response code: " + response.status)
      }
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

  login = () => {
    if(!this.state.wss_socket) {
      // Ouvrir un nouveau socket vers le serveur
      let socket = openSocket('/', {reconnection: false});

      // Enregistrer evenements generiques
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
      // 1. Ecouter le challenge du serveur
      socket.on('challenge', (challenge, cb) => {

        socket.on('login', confirmation=>{
          webSocketManager.setupWebSocket(socket);
          this.setState({loggedIn: confirmation, wss_socket: socket});
        });

        // 2. Resoudre challenge et repondre au serveur pour activer connexion
        solveLoginChallenge(challenge)
        .then(credentials => {
          // console.debug("Tranmission evenement challenge_reply");
          //socket.emit('challenge_reply', credentials);
          cb(credentials); // Callback du challenge via websocket
        })
        .catch(err=>{
          console.error("Erreur challenge reply");
          console.error(err);
          try{this.state.wss_socket.disconnect();} catch(err) {}
          this.setState({wss_socket: null});
        });

      });

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
