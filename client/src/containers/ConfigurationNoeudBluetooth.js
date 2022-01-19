import React from 'react'
import { Button, Row, Col, Form } from 'react-bootstrap'
import forge from '@dugrema/node-forge'


const serviceMillegrilleUuid            = '1a000000-7ef7-42d6-8967-bc01dd822388'
const characteristicIpsUuid             = '1a000002-7ef7-42d6-8967-bc01dd822388'
const characteristicSetWifiUuid         = '1a000003-7ef7-42d6-8967-bc01dd822388'
const characteristicPrisePossessionUuid = '1a000004-7ef7-42d6-8967-bc01dd822388'
const characteristicIdmgUuid            = '1a000005-7ef7-42d6-8967-bc01dd822388'
const characteristicCsrUuid             = '1a000007-7ef7-42d6-8967-bc01dd822388'
const characteristicGetNoeudidUuid      = '1a000008-7ef7-42d6-8967-bc01dd822388'
const characteristicGetWifiUuid         = '1a000009-7ef7-42d6-8967-bc01dd822388'

export class PageConfigurationNoeudBluetooth extends React.Component {

  state = {
    device: '',
    server: '',
    serviceMillegrilles: '',

    noeudId: '',
    idmg: '',
    ips: '',
    wifiInfo: '',
  }

  componentDidMount() {
    this.scanNoeudsBluetooth()
  }

  componentWillUnmount() {
    if(this.state.device && this.state.device.gatt.connected) {
      this.state.device.gatt.disconnect()
      console.debug("unmount : Bluetooth device deconnecte")
    }
  }

  onDisconnected = event => {
    console.debug("Bluetooth deconnecte")
    this.setState({server: '', serviceMillegrilles: ''})
    this.connecterGatt()
  }

  rafraichirBluetooth = async event => {
    const serviceMillegrilles = this.state.serviceMillegrilles
    const info = await chargerInformationNoeud(serviceMillegrilles)
    console.debug("Information bluetooth chargee\n%O", info)
    this.setState(info)
  }

  async scanNoeudsBluetooth() {

    console.debug("Scanner avec Bluetooth")
    const filters = [
      {services: [serviceMillegrilleUuid]},
    ]
    try {
      var device = await navigator.bluetooth.requestDevice({filters})
      device.addEventListener('gattserverdisconnected', this.onDisconnected)

      this.setState({device}, _=>{
        try {
          this.connecterGatt()
        } catch (err) {
          console.error("Erreur scan bluetooth\n%O", err)
          this.props.retour()
        }
      })

    } catch (err) {
      console.error("Erreur scan bluetooth\n%O", err)
      this.props.retour()
    }
  }

  async connecterGatt() {
    const device = this.state.device
    const server = await device.gatt.connect()
    const serviceMillegrilles = await server.getPrimaryService(serviceMillegrilleUuid)
    this.setState({device, server, serviceMillegrilles}, async _=>{
      // Charger characteristiques service
      try {
        this.rafraichirBluetooth()
      } catch (err) {
        console.error("Erreur chargement information noeud\n%O", err)
      }

    })
  }

  render() {

    var infoDevice = ''

    if(this.state.server) {
      var ips = ''
      if(this.state.ips) {
        ips = (
          <div>
            <Row>
              <Col md={2}>Ip4</Col>
              <Col md={10}>{this.state.ips.ipv4 || 'Non allouee'}</Col>
            </Row>
            <Row>
              <Col md={2}>Ip6</Col>
              <Col md={10}>{this.state.ips.ipv6 || 'Non allouee'}</Col>
            </Row>
          </div>
        )
      }

      infoDevice = (
        <div>
          <Row>
            <Col>Noeud {this.state.noeudId}</Col>
          </Row>
          <Row>
            <Col md={2}>Idmg</Col>
            <Col md={10}>{this.state.idmg || 'Non alloue'}</Col>
          </Row>
          {ips}
        </div>
      )
    } else {
      infoDevice = (
        <div>
          <Row>
            <Col>Chargement information en cours ...</Col>
          </Row>
        </div>
      )
    }

    var wifiInfo = null
    if(this.state.wifiInfo) {
      wifiInfo = <AfficherWifi
                    informationWifi={this.state.wifiInfo}
                    serviceMillegrilles={this.state.serviceMillegrilles} />
    }

    var prendrePossession = null
    if( this.state.noeudId && ! this.state.idmg ) {
      prendrePossession = <PrendrePosessionNoeud
                            rootProps={this.props.rootProps}
                            serviceMillegrilles={this.state.serviceMillegrilles} />
    }

    return (
      <div>
        <h1>Configuration via Bluetooth</h1>
        {infoDevice}
        {wifiInfo}
        {prendrePossession}
        <Button onClick={this.rafraichirBluetooth} variant="secondary">Rafraichir</Button>
        <Button onClick={this.props.retour}>Retour</Button>
      </div>
    )
  }
}

export async function isBluetoothAvailable() {
  console.debug("Test bluetooth available")
  if(navigator.bluetooth) {
    const disponible = await navigator.bluetooth.getAvailability()
    console.debug("Bluetooth etat : %s", disponible)
    return disponible
  }
  return false
}

async function chargerInformationNoeud(serviceMillegrilles) {
  const characteristicNoeudid = await serviceMillegrilles.getCharacteristic(characteristicGetNoeudidUuid)
  const characteristicIdmg = await serviceMillegrilles.getCharacteristic(characteristicIdmgUuid)
  const characteristicIps = await serviceMillegrilles.getCharacteristic(characteristicIpsUuid)
  const characteristicGetWifi = await serviceMillegrilles.getCharacteristic(characteristicGetWifiUuid)

  const dec = new TextDecoder('utf-8')

  const noeudIdValue = await characteristicNoeudid.readValue()
  console.debug("Valeur noeud id : %O", noeudIdValue)
  var noeudId = null
  if(noeudIdValue && noeudIdValue.getUint8(0) !== 1) {
    noeudId = dec.decode(noeudIdValue)
  }

  const wifiValue = await characteristicGetWifi.readValue()
  console.debug("Valeur wifi : %O", wifiValue)
  var wifiInfo = null
  try {
    wifiInfo = JSON.parse(dec.decode(wifiValue))
  } catch (err) {
    console.error("Erreur chargement information wifi : %O", err)
  }

  const ipsValue = await characteristicIps.readValue()
  console.debug("Valeur ips : %O", ipsValue)
  const ips = JSON.parse(dec.decode(ipsValue))

  const idmgValue = await characteristicIdmg.readValue()
  console.debug("Valeur idmg : %O", idmgValue)
  var idmg = null
  if(idmgValue && idmgValue.getUint8(0) !== 1) {
    idmg = dec.decode(idmgValue)
  }

  return {
    noeudId, idmg, ips, wifiInfo
  }
}

function AfficherWifi(props) {

  const connecte = props.informationWifi && props.informationWifi.connecte
  const configure = props.informationWifi && props.informationWifi.configure

  var information = []
  if(props.informationWifi) {
    if(configure) {
      information.push(
        <Row key="essid">
          <Col md={2}>ESSID</Col>
          <Col md={10}>{props.informationWifi.essid}</Col>
        </Row>
      )
    }

    if(connecte) {
      information.push(
        <Row key="quality">
          <Col md={2}>Quality</Col>
          <Col md={10}>{props.informationWifi.quality}</Col>
        </Row>
      )
    }
  }

  var formulaireSetupWifi = null
  if(!connecte) {
    formulaireSetupWifi = <WifiSetupForm
                            serviceMillegrilles={props.serviceMillegrilles} />
  }

  return (
    <div>
      <Row>
        <Col><h2>Wifi</h2></Col>
      </Row>

      {information}

      {formulaireSetupWifi}

    </div>
  )
}

class WifiSetupForm extends React.Component {

  state = {
    essid: '',
    motdepasse: '',
    pays: 'CA',
    settingWifi: false,
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  setWifi = event => {
    // Protection contre multiple clicks
    if(!this.state.settingWifi) {
      this.setState({settingWifi: true}, async _=>{
        try {
          await this._setWifi()
        } catch(err) {
          console.error("Erreur setup wifi : %O", err)
        } finally {
          this.setState({settingWifi: false})
        }
      })
    }
  }

  async _setWifi() {
    // Preparer message setWifi
    const messageDict = {
      essid: this.state.essid,
      password: this.state.motdepasse,
      country: this.state.pays,
    }

    const enc = new TextEncoder()
    const messageWifi = enc.encode(JSON.stringify(messageDict))

    // Get characteristic set wifi
    const characteristicSetWifi = await this.props.serviceMillegrilles.getCharacteristic(characteristicSetWifiUuid)
    await characteristicSetWifi.writeValue(messageWifi)
  }

  render() {
    return (
      <Form>

        <h3>Configurer Wifi</h3>

        <Form.Group controlId="essid">
          <Form.Label>ESSID</Form.Label>
          <Form.Control type="text" name="essid"
                        placeholder="Inscrire l'identificateur WIFI"
                        value={this.state.essid} onChange={this.changerChamp} />
        </Form.Group>

        <Form.Group controlId="motdepasse">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control type="password" name="motdepasse" value={this.state.motdepasse} onChange={this.changerChamp} />
        </Form.Group>

        <Form.Group controlId="pays">
          <Form.Label>Pays</Form.Label>
          <Form.Control type="text" name="pays" value={this.state.pays} onChange={this.changerChamp} />
        </Form.Group>

        <Button onClick={this.setWifi} variant="secondary" disabled={this.state.settingWifi}>Set Wifi</Button>

      </Form>
    )
  }
}

// Prise de possession d'un noeud via Bluetooth
class PrendrePosessionNoeud extends React.Component {

  state = {
    chargementEnCours: false,
    csr: '',
    certificat: '',
    chaine: '',
    echecTransmission: false,
    priseDePossessionCompletee: false,
  }

  componentDidMount() {
  }

  loadCSR = async _ => {
    console.debug("Debug chargement CSR")
    this.setState({chargementEnCours: true})
    try {
      const characteristicCsr = await this.props.serviceMillegrilles.getCharacteristic(characteristicCsrUuid)
      const resultatCsr = await recupererCSRBluetooth(characteristicCsr)
      if(resultatCsr) {
        const { csr, contenuCsr } = resultatCsr

        console.debug("CSR valide, subject:\n%O", csr.subject)
        this.setState({csr: contenuCsr}, _=>{this.genererCertificat()})
      } else {
        console.error("Erreur : CSR invalide")
        this.setState({chargementEnCours: false})
      }

    } catch(err) {
      console.error("Erreur reception CSR :\n%O", err)
      this.setState({chargementEnCours: false})
    }
  }

  genererCertificat = async _ => {
    console.debug("Creation certificat du noeud prive")
    try {
      const resultatCertificat = await recupererCertificat(this.props.rootProps.websocketApp, this.state.csr)
      if(resultatCertificat) {
        console.debug("Certificat recu :\n%O", resultatCertificat)
        this.setState({
          certificat: resultatCertificat.certificatPem,
          chaine: resultatCertificat.chaine
        }, _ => {this.prendrePossession()})
      } else {
        console.error("Erreur : echec creation certificat")
        this.setState({chargementEnCours: false})
      }

    } catch(err) {
      console.error("Erreur reception certificat prive :\n%O", err)
      this.setState({chargementEnCours: false})
    }
  }

  prendrePossession = async _ => {
    console.debug("Prendre possession du noeud prive")
    try {
      const characteristicPrendrePossession =
        await this.props.serviceMillegrilles.getCharacteristic(characteristicPrisePossessionUuid)

      await prendrePossession(characteristicPrendrePossession, this.state.certificat, this.state.chaine)

      this.setState({chargementEnCours: false, priseDePossessionCompletee: true})
    } catch(err) {
      console.error("Erreur transmission\n%O", err)
      this.setState({chargementEnCours: false, echecTransmission: true})
    }
  }

  retransmettre = async _ => {
    this.setState({chargementEnCours: true, priseDePossessionCompletee: false, echecTransmission: false}, _ => {
      this.prendrePossession()
    })
  }

  etatEtape(etape) {
    const etapeCourante = this._etapeCourante()
    if( etape < etapeCourante ) return "complete"
    if( ! this.state.echecTransmission && etape === etapeCourante ) return "en_cours"
    if( this.state.echecTransmission && etape === etapeCourante ) return "echec"
    return ''
  }

  _etapeCourante() {
    if(this.state.priseDePossessionCompletee) return 3
    if(this.state.certificat) return 2
    if(this.state.csr) return 1
    return 0
  }

  render() {

    var bouton = null
    if(!this.state.chargementEnCours && !this.state.priseDePossessionCompletee && !this.state.echecTransmission) {
      bouton = <Button onClick={this.loadCSR} variant="secondary">Prendre possession</Button>
    } else if(this.state.echecTransmission) {
      bouton = <Button onClick={this.retransmettre} variant="secondary" disabled={!this.props.serviceMillegrilles}>Reessayer</Button>
    }
    var etapes = null
    if(this.state.chargementEnCours || this.state.priseDePossessionCompletee || this.state.echecTransmission) {
      etapes = (
        <div>
          <Etape etat={this.etatEtape(0)}>Recuperer requete de certificat (CSR)</Etape>
          <Etape etat={this.etatEtape(1)}>Demander le certificat signe</Etape>
          <Etape etat={this.etatEtape(2)}>Prendre possession du noeud</Etape>
        </div>
      )
    }

    return (
      <div>
        <h2>Prendre possession</h2>

        {bouton}
        {etapes}

      </div>
    )

  }

}

function Etape(props) {

  var complete = ''
  if(props.etat === 'complete') {
    complete = <i className="fa fa-check"/>
  } else if(props.etat === 'en_cours') {
    complete = <i className="fa fa-spinner fa-pulse fa-1x fa-fw"/>
  } else if(props.etat === 'echec') {
    complete = <i className="fa fa-close"/>
  }

  return (
    <Row>
      <Col md={1}>{complete}</Col>
      <Col md={11}>{props.children}</Col>
    </Row>
  )
}

async function recupererCSRBluetooth(characteristicCSR) {
  var offset = 0, complet = false, contenuCsr = ''

  const enc = new TextEncoder()

  while(!complet) {
    const position = enc.encode(''+offset)
    await characteristicCSR.writeValue(position)

    const value = await characteristicCSR.readValue()

    console.debug("CSR:%O", value)
    if(value.byteLength > 0) {
      const dec = new TextDecoder('utf-8')
      const texteDecode = dec.decode(value)
      contenuCsr += texteDecode

      offset = contenuCsr.length
    } else {
      complet = true
    }
  }

  console.debug("Valeur recue : %O", contenuCsr)

  const csr = forge.pki.certificationRequestFromPem(contenuCsr);
  const csrOk = csr.verify()

  return csrOk ? { csr, contenuCsr } : null
}

async function recupererCertificat(websocketApp, csr) {
  const domaineAction = 'MaitreDesCles.signerCsr'
  const commande = {
    liste_csr: [csr],
    role: 'prive'
  }
  const resultat = await websocketApp.transmettreCommande(domaineAction, commande)
  console.debug("Certificat signe recu :\n%O", resultat)

  const certificatPem = resultat.certificats_pem[0]
  const chaine = resultat.chaines[0].pems

  return {certificatPem, chaine}
}

async function prendrePossession(characteristicPrendrePossession, certificatPem, chaine) {

  const message = {
    certificat: certificatPem,
    chaine
  }
  const messageStr = JSON.stringify(message)

  // var etatPosition = 'Debut envoit valeur'
  const enc = new TextEncoder()
  const messageBytes = enc.encode(messageStr)

  console.debug("messageBytes : %O",messageBytes)
  await transmettreBytes(characteristicPrendrePossession, messageBytes)
  console.debug("Transmission terminee")

}

async function transmettreBytes(characteristic, bytesTexte) {
  // Split le texte en chunks (max bluetooth web 512 bytes)
  const TAILLE_TRANSMISSION = 511
  const nbMessages = Math.round(bytesTexte.length / TAILLE_TRANSMISSION)
  console.debug("Preparation %d messages transmission", nbMessages)
  const arrayBufferMessage = new ArrayBuffer(TAILLE_TRANSMISSION+1)
  const viewMessage = new Uint8Array(arrayBufferMessage)
  for(let i=0; i<nbMessages; i++) {
    var offset = i * TAILLE_TRANSMISSION
    // Numero de paquet, 0x7f est le signal de dernier paquet
    console.debug("Valeur i=%s, valeur nbMessages - 1 = %s", i, nbMessages)
    if( i === (nbMessages - 1) )  {
      console.debug("Dernier paquet")
      viewMessage[0] = 0x7f
    } else {
      viewMessage[0] = i
    }

    // Remplir buffer
    for(let idx=0; idx<TAILLE_TRANSMISSION; idx++) {
      viewMessage[idx+1] = bytesTexte[offset+idx]
    }

    var tailleMessage = TAILLE_TRANSMISSION + 1
    var messageATransmettre = arrayBufferMessage
    if(bytesTexte.length < offset + tailleMessage) {
      // Tronquer le message
      tailleMessage = bytesTexte.length - offset + 1
      messageATransmettre = messageATransmettre.slice(0, tailleMessage)
    }

    console.debug("Transmettre paquet %d, taille %d", i, tailleMessage)
    await characteristic.writeValue(messageATransmettre)
  }
}
