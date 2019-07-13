import React from 'react';
import logo from './logo.svg';
import './App.css';
import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client';

// const urlApi = 'https://dev2.maple.mdugre.info:3001';  // Autre site, dev.
const urlApi = '';  // Meme serveur

const fakeAuth = {
  isAuthenticated: false,
  challenge: null,
  key: null,
  id: 'a1ID',
  email: 'test@test.com',
  async authenticate(cb) {
    const challenge = await fetch(urlApi + '/api/login', {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: JSON.stringify({ email: 'test@test' })
    })
    .then(response => response.json());

    const credentials = await solveLoginChallenge(challenge);
    const { loggedIn } = await fetch(
        urlApi + '/api/login-challenge',
        {
            method: 'POST',
            headers: {
                'content-type': 'Application/Json'
            },
            body: JSON.stringify(credentials)
        }
    ).then(response => response.json());

    if (loggedIn) {
      this.isAuthenticated = true;
      this.challenge = challenge.challenge;
      console.debug('You are logged in');
    } else {
      console.error('Invalid credential');
    }
    cb(this.isAuthenticated); // Callback
  },
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
  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

class Login extends React.Component {
  state = {
    redirectToReferrer: false,
    loggedIn: false
  };

  register = () => {
    fakeAuth.register(() => {
      this.setState({ redirectToReferrer: true });
      console.log("Callback register complete");
    });
  };

  /* login = () => {
    console.log("Login called: 1")
    fakeAuth.authenticate(() => {
      //this.setState({loggedIn: true});
      this.props.setLoginState(true);
      console.log("Callback authenticate complete");
    });
  };*/

  checkStatus = () => {
    fetch(urlApi + '/api/requete', {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json',
            'auth-token': fakeAuth.challenge
        },
        body: JSON.stringify({
          "requetes": [
            {
              "filtre": {
                "_mg-libelle": "profil.usager"
              }
            }
          ]
        })
    }).then(response => {
      console.log("Status login: " + response);
    });
  };

  render() {
    // if (redirectToReferrer) return <Redirect to={from} />;

    return (
      <div>
        <p>You must log in to view the page</p>
        <button onClick={this.props.login_method}>Log in</button>
        <p>Register now!</p>
        <button onClick={this.register}>Register</button>
        <p>Check status</p>
        <button onClick={this.checkStatus}>Check</button>
      </div>
    );
  }
}

class App extends React.Component {
  state = {
    loggedIn: false
  }

  login = () => {
    console.log("Login called: 2")
    fakeAuth.authenticate(() => {
      this.setState({loggedIn: true});
      console.log("Callback authenticate complete");
    });
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
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }

  render() {
    if(this.state.loggedIn) {
      // App principale une fois logged in
      return this.renderApplication();
    } else {
      return this.renderLogin();
    }
  }
}

export default App;
