import React from 'react'
import {Row, Col, Button, ButtonGroup, InputGroup, FormControl, Alert} from 'react-bootstrap'
import axios from 'axios'

import {PageConfigurationNoeudBluetooth, isBluetoothAvailable} from './ConfigurationNoeudBluetooth'

export class PageConfigurationNoeudsListe extends React.Component {

  state = {
    bluetoothDisponible: false,  // Vrai si bluetooth est disponible
    modeBluetooth: false,        // Indique qu'on affiche la configuration en mode Bluetooth
    modeUrlManuel: false,        // Indique qu'on affiche la page pour saisir un URL (manuel)
    noeudId: '',                 // Noeud en cours de configuration
  }

  componentDidMount() {
    this._setup()
  }

  componentWillUnmount() {

  }

  _setup = async _ => {
    const bluetoothDisponible = await isBluetoothAvailable()

    const status = {
      bluetoothDisponible
    }

    this.setState(status)
  }

  setNoeudId = noeudId => {
    this.setState({noeudId})
  }

  setModeBluetooth = event => {
    this.setState({modeBluetooth: true})
  }

  setModeUrlManuel = event => {
    this.setState({modeUrlManuel: true})
  }

  retour = _ => {
    // Reset a l'ecran de base
    this.setState({modeBluetooth: false, modeUrlManuel: false, noeudId: ''})
  }

  render() {

    var page = null
    if(this.state.modeUrlManuel) {
      page = <ConfigurationNoeudUrl
                rootProps={this.props.rootProps}
                retour={this.retour}
                noeudId={this.state.noeudId} />
    } else if(this.state.modeBluetooth) {
      page = <PageConfigurationNoeudBluetooth
                rootProps={this.props.rootProps}
                retour={this.retour}
                noeudId={this.state.noeudId} />
    } else {
      page = <ConfigurationNoeuds
                scanBluetooth={this.setModeBluetooth}
                setModeUrlManuel={this.setModeUrlManuel}
                {...this.state} />
    }

    return page
  }

}

function ConfigurationNoeuds(props) {
  return (
    <div>
      <h1>Ajout de noeuds</h1>

      <h2>Methodes d'ajout</h2>

      <ButtonGroup aria-label="Boutons ajout noeud">
        <Button variant="primary">Scan reseau</Button>
        <Button variant="primary"
                onClick={props.setModeUrlManuel}>Adresse manuelle</Button>
        <Button variant="primary"
                onClick={props.scanBluetooth}
                disabled={!props.bluetoothDisponible}>
          <i className="fa fa-bluetooth fa-2x"/>
        </Button>
      </ButtonGroup>

    </div>
  )
}

class ConfigurationNoeudUrl extends React.Component {

  state = {
    url: '',
    csr: '',
    infoNoeud: '',

    err: '',
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  connecter = async event => {
    const url = this.state.url

    const pathInfoMonitor = 'https://' + url + '/installation/api/infoMonitor'
    const reponseInfoMonitor = await axios.get(pathInfoMonitor)
    this.setState({infoNoeud: reponseInfoMonitor.data})
    console.debug("Reponse info monitor : %O", reponseInfoMonitor)

    if( ! this.state.infoNoeud.certificat ) {
      const pathCsr = 'https://' + url + '/installation/api/csr'
      const reponseCsr = await axios.get(pathCsr)
      this.setState({csr: reponseCsr.data})
      console.debug("Reponse CSR : %O", reponseCsr)
    }
  }

  fermerErr = event => {
    this.setState({err: ''})
  }

  prendrePossession = async event => {
    const csr = this.state.csr,
          securite = this.state.infoNoeud.securite

    try {
      if(csr && securite) {
        const wsa = this.props.rootProps.websocketApp
        await prendrePossession(wsa, csr, securite, this.state.url)
      } else {
        this.setState({err: "Il manque le csr ou le niveau de securite"})
      }
    } catch(err) {
      console.error("Erreur prendrePossession : %O", err)
      this.setState({err: ''+err})
    }
  }

  render() {

    var err = ''
    if(this.state.err) {
      err = (
        <Alert variant="danger" onClose={this.fermerErr} dismissible>
          <Alert.Heading>Erreur</Alert.Heading>
          {this.state.err}
        </Alert>
      )
    }

    var informationNoeud = ''
    if(this.state.infoNoeud) {
      informationNoeud = (
        <>
          <hr />
          <InformationNoeud {...this.state.infoNoeud}
                            csr={this.state.csr}
                            prendrePossession={this.prendrePossession} />
        </>
      )
    }

    return (
      <>
        <h1>Ajout noeud avec URL</h1>

        {err}

        <Row>
          <Col>

            <label htmlFor="basic-url">URL pour se connecter au noeud</label>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text id="url-noeud-text">
                  https://
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl id="url-noeud" aria-describedby="url-noeud-text"
                           name="url" value={this.state.url}
                           onChange={this.changerChamp}
                           placeholder="www.monnoeud.com" />
            </InputGroup>

          </Col>
        </Row>

        <Row>
          <Col>
            <Button onClick={this.props.retour} variant="secondary">Retour</Button>
            <Button onClick={this.connecter}>Connecter</Button>
          </Col>
        </Row>

        {informationNoeud}
      </>
    )
  }
}

function InformationNoeud(props) {

  var notice = '', boutons = ''
  if(props.certificat) {
    notice = <Alert variant="warning">Le noeud est deja initialise avec un certificat</Alert>
  } else if(props.csr) {
    boutons = (
      <Button onClick={props.prendrePossession}>Prendre possession</Button>
    )
  }

  var domaine = ''
  if(props.domaine) {
    domaine = (
      <Row>
        <Col sm={2}>Domaine</Col>
        <Col sm={10}>{props.domaine}</Col>
      </Row>
    )
  }

  return (
    <>
      <Row>
        <Col sm={2}>IDMG</Col>
        <Col sm={10}>{props.idmg}</Col>
      </Row>
      {domaine}
      <Row>
        <Col sm={2}>Securite</Col>
        <Col sm={10}>{props.securite}</Col>
      </Row>
      <Row>
        <Col sm={2}>Noeud ID</Col>
        <Col sm={10}>{props.noeud_id}</Col>
      </Row>

      {notice}
      {boutons}

    </>
  )
}

export async function prendrePossession(wsa, csr, securite, url) {

  console.debug("Demander la creation d'un nouveau certificat %s pour %s", securite, url)

  const commande = {csr, securite}

  const resultatCertificat = await wsa.genererCertificatNoeud(commande)

  if(resultatCertificat) {

    const paramsInstallation = {
      certificatPem: resultatCertificat.certificatPem,
      chainePem: resultatCertificat.chaine,
      securite,
    }

    console.debug("Transmettre parametres installation noeud : %O", paramsInstallation)

    const urlComplet = 'https://' + url + '/installation/api/installer'
    const reponse = await axios({
      url: urlComplet,
      method: 'post',
      data: paramsInstallation,
      timeout: 5000,
    })
    console.debug("Recu reponse demarrage installation noeud\n%O", reponse)

  } else {
    throw new Error("Erreur : echec creation certificat")
  }

}