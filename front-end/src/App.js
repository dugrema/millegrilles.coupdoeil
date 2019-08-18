import React from 'react';
// import logo from './logo.svg';
// import './App.css';
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
    }).then(response => response.json());

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
    ).then(response => response.json());

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
    redirectToReferrer: false
  };

  register = () => {
    fakeAuth.register(() => {
      this.setState({ redirectToReferrer: true });
      // console.log("Callback register complete");
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

  render() {
    // if (redirectToReferrer) return <Redirect to={from} />;

    return (
      <div>
        <h1>Bienvenue a Coup D'Oeil</h1>

        <p>Veuillez selectionner une action.</p>

        <form onSubmit={event => event.preventDefault()}>
          <p>
            <button onClick={this.props.login_method}>Authentifier</button> avec
            un token USB deja associe a votre MilleGrille.
          </p>

          <p>
            Engistrer un nouveau token avec un pin:
            <input type="text" name="pin" />
            <button onClick={this.registerPin}>Cliquer pour enregistrer</button>
          </p>

          <p>
            Effectuer une empreinte sur votre nouvelle MilleGrille:
            <button onClick={this.register}>Empreinte</button>
          </p>

        </form>
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
        <header className="App-header">
          <Login login_method={this.login}/>
        </header>
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
