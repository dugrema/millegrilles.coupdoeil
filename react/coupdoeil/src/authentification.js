import React, { Component } from "react";
import './App.css';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from "react-router-dom";

import {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} from "@webauthn/server"

import { solveRegistrationChallenge, solveLoginChallenge } from '@webauthn/client';

////////////////////////////////////////////////////////////
// 1. Click the public page
// 2. Click the protected page
// 3. Log in
// 4. Click the back button, note the URL each time

function Authentification() {
  return (
    <Router>
      <div>
        <AuthButton />
        <ul>
          <li>
            <Link to="/public">Public Page</Link>
          </li>
          <li>
            <Link to="/protected">Protected Page</Link>
          </li>
        </ul>
        <Route path="/public" component={Public} />
        <Route path="/login" component={Login} />
        <PrivateRoute path="/protected" component={Protected} />
      </div>
    </Router>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  async authenticate(cb) {
    this.isAuthenticated = true;
    // setTimeout(cb, 100); // fake async

    const id = 'a1ID';
    const email = 'test@test.com';

    cb(); // Callback

  },
  async register(cb) {
    this.isAuthenticated = true;
    // setTimeout(cb, 100); // fake async

    const id = 'a1ID';
    const email = 'test@test.com';

    const challengeResponse = generateRegistrationChallenge({
        relyingParty: { name: 'ACME' },
        user: { id, name: email }
    });
    // const crjson = JSON.stringify(challengeResponse);
    // const cr_parsed = JSON.parse(crjson);

    console.log(challengeResponse);
    console.log("On applique les credentials");
    const credentials = await solveRegistrationChallenge(challengeResponse);
    console.log("Credentials recu?")
    console.log(credentials);

    // const json_creds = JSON.stringify(credentials);
    // console.log(json_creds);
    // const creds_var = JSON.parse(json_creds);

    const { key, challenge } = parseRegisterRequest(credentials);
    console.log("Creds parsed key / challenge");
    console.log(key);
    console.log(challenge);

    cb(); // Callback

  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

const AuthButton = withRouter(
  ({ history }) =>
    fakeAuth.isAuthenticated ? (
      <p>
        Welcome!{" "}
        <button
          onClick={() => {
            fakeAuth.signout(() => history.push("/"));
          }}
        >
          Sign out
        </button>
      </p>
    ) : (
      <p>You are not logged in.</p>
    )
);

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        fakeAuth.isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

function Public() {
  return <h3>Public</h3>;
}

function Protected() {
  return <h3>Protected</h3>;
}

class Login extends Component {
  state = { redirectToReferrer: false };

  register = () => {
    fakeAuth.register(() => {
      this.setState({ redirectToReferrer: true });
      console.log("Callback register complete");
    });
  };

  login = () => {
    fakeAuth.authenticate(() => {
      this.setState({ redirectToReferrer: true });
      console.log("Callback authenticate complete");
    });
  };

  render() {
    let { from } = this.props.location.state || { from: { pathname: "/" } };
    let { redirectToReferrer } = this.state;

    if (redirectToReferrer) return <Redirect to={from} />;

    return (
      <div>
        <p>You must log in to view the page at {from.pathname}</p>
        <button onClick={this.login}>Log in</button>
        <p>Register now!</p>
        <button onClick={this.register}>Register</button>
      </div>
    );
  }
}

export default Authentification;
