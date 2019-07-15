import React from 'react';

class NavBar extends React.Component {

  render() {
    return (
      <navbar></navbar>
    );
  }
}

class Contenu extends React.Component {

  render() {
    return (
      <div class="w3-container w3-content">
        <div class="w3-row">
          <div class="w3-col m3">
            Menu gauche
          </div>
          Contenu
        </div>
      </div>
    );
  }
}

class Footer extends React.Component {

  render() {
    return (

      <footer class="w3-container w3-theme-d3 w3-padding-16">
        <h5>Coup D'Oeil version abcd.1234</h5>
        <p>
          Coup D'Oeil fait partie du groupe de logiciels
          <a href="https://www.millegrilles.com">MilleGrilles</a>.
        </p>
        <p class="w3-container w3-theme-d5">
            Powered by <a href="https://www.w3schools.com/w3css/default.asp" target="_blank">w3.css</a>,
             Meteor, node.js, MongoDB, RabbitMQ, Python, nginx, docker, letsencrypt,
             d3, RaspberryPi, Intel Xeon, Debian, Font Awesome, git.
        </p>
      </footer>
    );
  }

}

class EcranApp extends React.Component {

  render() {
    return (
      <div>
        <NavBar/>
        <Contenu/>
        <Footer/>
      </div>
    );
  }

}

export default EcranApp;
