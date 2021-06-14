import React from 'react'
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import openSocket from 'socket.io-client'

import {proxy as comlinkProxy, wrap as comlinkWrap, releaseProxy} from 'comlink'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

import {setupWorkers, cleanupWorkers, preparerWorkersAvecCles} from './workers/workers.load'

import { Trans } from 'react-i18next'

import {getCertificats, getClesPrivees} from './components/pkiHelper'
import {ApplicationCoupdoeil} from './containers/App'

import './containers/App.css'
import './containers/Layout.css'

import manifest from './manifest.build.js'
// const manifest = {
//   date: "DUMMY",
//   version: "DUMMY",
// }

const NOM_USAGER_PROPRIETAIRE = 'proprietaire'

export default class AppTopLevel extends React.Component {

  state = {
    modeProtege: false,         // Mode par defaut est lecture seule (prive)
    sousMenuApplication: null,
    connexionSocketIo: null,

    webWorker: '',
    webWorkerInstance: '',

    cleMillegrilleChargee: false,
    signateurTransaction: '',
  }

  componentDidMount() {
    setupWorkers(this).then( async _ =>{
      console.debug("Workers charges, info session : %O, proppys : %O", this.state, this.props)

      this.setState({
        signateurTransaction: {preparerTransaction: this.state.chiffrageWorker.formatterMessage}, // Legacy
      })

      await this.preparerWorkersAvecCles()
      this.toggleProtege()  // Tenter upgrade protege automatiquement
    })

  }

  componentWillUnmount() {
    if(this.state.webWorker) {
      console.debug("Nettoyage worker, release proxy")
      this.state.webWorker[releaseProxy]()
      this.state.webWorkerInstance.terminate()
    }
  }

  callbackCleMillegrille = comlinkProxy(chargee => {
    console.debug("Recu changement etat cle de millegrille dans le web worker : chargee = %s", chargee)
    this.setState({cleMillegrilleChargee: chargee===true})
  })

  async preparerWorkersAvecCles() {
    console.debug("Preparation workers avec cle %O", this.state)
    const {nomUsager, chiffrageWorker, connexionWorker} = this.state
    if(nomUsager) {
      await preparerWorkersAvecCles(nomUsager, chiffrageWorker, connexionWorker)
      console.debug("preparerWorkersAvecCles pret")
    } else {
      console.warn("Nom d'usager manquant")
    }
  }

  setEtatProtege = comlinkProxy(reponse => {
    console.debug("Callback etat protege : %O", reponse)
    const modeProtege = reponse.etat
    console.debug("Toggle mode protege, nouvel etat : %O", reponse)
    this.setState({modeProtege})
  })

  deconnexionSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO deconnecte : %O", event)
    this.setState({modeProtege: false})
  })

  reconnectSocketIo = comlinkProxy(event => {
    console.debug("Socket.IO reconnecte : %O", event)
    if(!this.state.modeProtege) {
      this.toggleProtege()
    }
  })

  setSousMenuApplication = sousMenuApplication => {
    console.debug("Set sous-menu application")
    this.setState({sousMenuApplication})
  }

  toggleProtege = async () => {
    if( this.state.modeProtege ) {
      // Desactiver mode protege
      this.state.connexionWorker.downgradePrive()
    } else {
      // Activer mode protege, upgrade avec certificat (implicite)
      console.debug("toggleProtege")
      try {
        const resultat = await this.state.connexionWorker.upgradeProteger()
      } catch(err) {
        console.error("Erreur upgrade protege %O", err)
      }
    }
  }

  desactiverProtege = () => {
    console.debug("Revenir a mode prive")
    if(this.state.connexionSocketIo) {

      this.state.connexionSocketIo.emit('downgradePrive', reponse=>{
        if(reponse && reponse.err) {
          console.error("Erreur downgrade vers mode prive")
        }
        this.setState({modeProtege: false})
      })

    } else {
      this.setState({modeProtege: false})
    }
  }

  render() {

    const rootProps = {
      ...this.state, manifest,
      toggleProtege: this.toggleProtege,
      // setCleMillegrille: this.setCleMillegrille,
    }

    const workers = {
      connexion: this.state.connexionWorker,
      chiffrage: this.state.chiffrageWorker,
    }

    let page;
    if(!this.state.nomUsager || !this.state.connexionWorker) {
      // Connecter avec Socket.IO
      page = <p>Chargement en cours</p>
    } else {
      // 3. Afficher application
      page = <ApplicationCoupdoeil setSousMenuApplication={this.setSousMenuApplication}
                                   workers={workers}
                                   rootProps={rootProps} />
    }

    return <LayoutCoudpoeil
              changerPage={this.changerPage}
              page={page}
              rootProps={rootProps}
              sousMenuApplication={this.state.sousMenuApplication}
              appProps={this.props} />
  }

}

export class LayoutCoudpoeil extends React.Component {

  render() {
    // Application independante (probablement pour DEV)
    return (
      <div className="flex-wrapper">
        <div>
          <Entete changerPage={this.props.changerPage}
                  sousMenuApplication={this.props.sousMenuApplication}
                  rootProps={this.props.rootProps} />
          <Contenu page={this.props.page}/>
        </div>
        <Footer rootProps={this.props.rootProps}/>
      </div>
    )
  }
}

function Entete(props) {
  return (
    <Container>
      <Menu changerPage={props.changerPage} sousMenuApplication={props.sousMenuApplication} rootProps={props.rootProps}/>
      <h1>Coup D'Oeil</h1>
    </Container>
  )
}

function Contenu(props) {
  return (
    <Container>
      {props.page}
    </Container>
  )
}

function Footer(props) {

  const idmg = props.rootProps.idmg
  var qrCode = 'QR'

  return (
    <Container fluid className="footer bg-info">
      <Row>
        <Col sm={2} className="footer-left"></Col>
        <Col sm={8} className="footer-center">
          <div className="millegrille-footer">
            <div>IDMG : {idmg}</div>
            <div>
              <Trans>application.coupdoeilAdvert</Trans>{' '}
              <span title={props.rootProps.manifest.date}>
                <Trans values={{version: props.rootProps.manifest.version}}>application.coupdoeilVersion</Trans>
              </span>
            </div>
          </div>
        </Col>
        <Col sm={2} className="footer-right">{qrCode}</Col>
      </Row>
    </Container>
  )
}

function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  var menuItems = props.sousMenuApplication

  var renderCleMillegrille = ''

  const clearCleMillegrille = _=>{props.rootProps.webWorker.clearCleMillegrilleSubtle()}
  if(props.rootProps.cleMillegrilleChargee) {
    renderCleMillegrille = (
      <Nav className="justify-content-end">
        <Nav.Link onClick={clearCleMillegrille}><i className="fa fa-key"/></Nav.Link>
      </Nav>
    )
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        {menuItems}
        {renderCleMillegrille}
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
        </Nav>
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}
