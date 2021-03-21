import React from 'react'
import {Row, Col, Button, Form, InputGroup, FormControl, Alert} from 'react-bootstrap'
import path from 'path'
import axios from 'axios'

import {MilleGrillesCryptoHelper} from '@dugrema/millegrilles.common/lib/cryptoSubtle'
import { chargerCertificatPEM } from '@dugrema/millegrilles.common/lib/forgecommon'
import { prendrePossession } from './ConfigurationNoeudsListe'

export class CommandeHttp extends React.Component {

  state = {
    urlNoeud: '',
    etatNoeud: 'inconnu',
    confirmation: '',
    erreur: '',
  }

  componentDidMount() {
    // console.debug("Configuration MQ noeud, props : %O", this.props)

    const noeudInfo = this.props.noeudInfo
    var urlNoeud = noeudInfo.domaine || noeudInfo.ip_detectee
    this.setState({urlNoeud})

    // this.refresherNoeud = setInterval(_=>{
    //   this.verifierAccesNoeud()
    // }, 5000)
  }

  componentWillUnmount() {
    // clearInterval(this.refresherNoeud)
  }

  renouvelerCertificat = async event => {
    console.debug("Renouveler certificat du noeud %s", this.state.urlNoeud)
    const url = 'https:/' + path.join('/', this.state.urlNoeud, "installation/api/csr")
    const reponseCsr = await axios.get(url)
    console.debug("Reponse CSR : %O", reponseCsr)

    var csr = null
    if(reponseCsr.status === 410) {
      console.debug("Le CSR n'existe pas, demander au noeud d'en generer un nouveau")
      const url = 'https:/' + path.join('/', this.state.urlNoeud, "installation/api/genererCsr")
      console.debug("URL verification noeud : %O", url)

      // const signateurTransaction = this.props.rootProps.signateurTransaction
      // const commande = await signateurTransaction.preparerTransaction(commande, 'servicemonitor.genererCsr')

      const domaineAction = 'servicemonitor.genererCsr'
      // await signateurTransaction.preparerTransaction(transaction, domaineTransaction)
      const commande = await this.props.rootProps.chiffrageWorker.formatterMessage({}, domaineAction)

      const reponse = await axios({
        method: 'post',
        url,
        data: commande,
        timeout: 5000,
      })
      csr = reponse.data

    } else if(reponseCsr.status === 200) {
      csr = reponseCsr.data
    } else {
      this.setState({erreur: 'Erreur renouvellement certificat (CSR non recu)'})
      return
    }

    console.debug("CSR a utiliser\n%s", csr)
    const securite = this.state.noeudInfo.securite

    try {
      if(csr && securite) {
        const wsa = this.props.rootProps.websocketApp
        await prendrePossession(wsa, csr, securite, this.state.urlNoeud)
      } else {
        this.setState({erreur: "Il manque le csr ou le niveau de securite"})
      }
    } catch(err) {
      console.error("Erreur prendrePossession : %O", err)
      this.setState({erreur: err})
    }

  }

  verifierAccesNoeud = async event => {
    console.debug("Check noeud")

    const url = 'https:/' + path.join('/', this.state.urlNoeud, "installation/api/infoMonitor")
    console.debug("URL verification noeud : %O", url)
    try {
      const reponse = await axios.get(url)
      console.debug("Response noeud : %O, proppys: %O", reponse, this.props)

      const idmg = reponse.data.idmg
      if(idmg === this.props.rootProps.idmg) {
        var certificat = null, expirationCertificat = null
        try {
          certificat = chargerCertificatPEM(reponse.data.certificat)
          console.debug("Certificat noeud : %O", certificat)
        } catch(err) {console.warn("Erreur chargement certificat %O", err)}
        this.setState({
          etatNoeud: 'disponible',
          noeudInfo: reponse.data,
          certificat
        })
      } else {
        this.setState({
          etatNoeud: 'Mauvais idmg : ' + idmg,
          noeudInfo: '',
          certificat: '',
        })
      }
    } catch(err) {
      console.error("Erreur axios : %O", err)
      this.setState({etatNoeud: 'Erreur/non disponible'})
    }
  }

  changerTextfield = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  setErreur = erreur => {this.setState({erreur})}
  setConfirmation = confirmation => {this.setConfirmation({confirmation})}
  cacherErreur = event => {this.setState({erreur: ''})}
  cacherConfirmation = event => {this.setState({confirmation: ''})}

  render() {
    return (
      <>
        <h2>Configuration d'un noeud via Http</h2>

        <Alert show={this.state.erreur?true:false} variant="danger" onClose={this.cacherErreur} dismissible>
          <Alert.Heading>Erreur</Alert.Heading>
          {this.state.erreur.err?this.state.erreur.err:''+this.state.erreur}
        </Alert>
        <Alert show={this.state.confirmation?true:false} variant="success" onClose={this.cacherConfirmation} dismissible>
          <Alert.Heading>Confirmation</Alert.Heading>
          {this.state.confirmation}
        </Alert>

        <p>
          Transmet des commandes de configuration signees avec le certificat du navigateur.
        </p>

        <label htmlFor="hostmq">URL de connexion au noeud (https)</label>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text id="urlNoeud">
              https://
            </InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl id="urlNoeud"
                       aria-describedby="urlNoeud"
                       name="urlNoeud"
                       value={this.state.urlNoeud}
                       onChange={this.changerTextfield} />
          <InputGroup.Append>
            <Button variant="outline-secondary" onClick={this.verifierAccesNoeud}>Verifier</Button>
          </InputGroup.Append>
        </InputGroup>

        <AfficherInfoConfiguration noeudInfo={this.state.noeudInfo}
                                   certificat={this.state.certificat}
                                   renouveler={this.renouvelerCertificat}
                                   rootProps={this.props.rootProps} />

        <Row>
          <Col>Disponibilite du noeud via https</Col>
          <Col>{this.state.etatNoeud}</Col>
        </Row>

        <h2>Configurer MQ</h2>
        <ConfigurerMQ rootProps={this.props.rootProps}
                      urlNoeud={this.state.urlNoeud}
                      setErreur={this.setErreur}
                      setConfirmation={this.setConfirmation} />

        <h2>Configurer Domaine</h2>
        <ConfigurerDomaine rootProps={this.props.rootProps}
                           urlNoeud={this.state.urlNoeud}
                           setErreur={this.setErreur}
                           setConfirmation={this.setConfirmation}
                           ipDetectee={this.props.noeudInfo.ip_detectee} />
      </>
    )
  }
}

class ConfigurerMQ extends React.Component {

  state = {
    host: '',
    port: '',
  }

  changerTextfield = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  soumettre = async event => {
    var {host, port} = this.state
    var commande = {}
    if(!host && !port) {
      commande.supprimer_params_mq = true
    } else {
      commande.host = host
      commande.port = port
    }

    // const signateurTransaction = this.props.rootProps.signateurTransaction
    // await signateurTransaction.preparerTransaction(commande, 'Monitor.changerConfigurationMq')

    const domaineAction = 'Monitor.changerConfigurationMq'
    // await signateurTransaction.preparerTransaction(transaction, domaineTransaction)
    commande = await this.props.rootProps.chiffrageWorker.formatterMessage(commande, domaineAction)

    console.debug("Commande a transmettre : %O", commande)
    const url = 'https:/' + path.join('/', this.props.urlNoeud, '/installation/api/configurerMQ')
    try {
      const reponse = await axios({
        method: 'post',
        url,
        data: commande,
        timeout: 5000,
      })
      console.debug("Reponse configuration MQ : %O", reponse)
      this.setState({confirmation: "Configuration transmise"})
    } catch(err) {
      this.setState({erreur: ''+err})
    }
  }

  render() {
    return (
      <>
        <label htmlFor="hostmq">Configuration de la connexion MQ</label>
        <Row>
          <Col md={8}>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text id="hostmq">
                  Host
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl id="hostmq"
                           aria-describedby="hostmq"
                           name="host"
                           value={this.state.host}
                           onChange={this.changerTextfield} />
            </InputGroup>
          </Col>

          <Col md={4}>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text id="portmq">
                  Port
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl id="portmq"
                           aria-describedby="portmq"
                           name="port"
                           value={this.state.port}
                           onChange={this.changerTextfield} />
            </InputGroup>
          </Col>
        </Row>

        <Row>
          <Col>
            <Button onClick={this.soumettre}>Soumettre</Button>
          </Col>
        </Row>
      </>
    )
  }
}

class ConfigurerDomaine extends React.Component {

  state = {
    domaine: '',
    domaineValide: false,

    configurationAvancee: false,
    modeTest: false,
    modeCreation: 'webroot',

    cloudnsSubid: '',
    cloudnsPassword: '',
    dnssleep: '240',

    confirmation: '',
    erreur: '',
  }

  // Note: Look behind (?<!) pas supporte sur Safari (iOS)
  // RE_DOMAINE = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
  RE_DOMAINE = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/

  setInternetDisponible = event => {
    const eventInfo = event.currentTarget
    this.setState({internetDisponible: event.currentTarget.checked})
  }

  changerDomaine = event => {
    const value = event.currentTarget?event.currentTarget.value:event
    const valide = this.RE_DOMAINE.test(value)
    this.setState({domaine: value, domaineValide: valide})
  }

  changerTextfield = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  setCheckbox = event => {
    const {name, checked} = event.currentTarget
    this.setState({[name]: checked})
  }

  setModeCreation = event => {
    const {value} = event.currentTarget
    this.setState({modeCreation: value}, ()=>{console.debug("State :\n%O", this.state)})
  }

  verifierAccesNoeud = async event => {
    console.debug("Check noeud")

    const url = 'https:/' + path.join('/', this.state.urlNoeud, "installation/api/infoMonitor")
    console.debug("URL verification noeud : %O", url)
    try {
      const reponse = await axios.get(url)
      console.debug("Response noeud : %O", reponse)

      const idmg = reponse.data.idmg
      if(idmg === this.props.rootProps.idmg) {
        this.setState({etatNoeud: 'disponible'})
      } else {
        this.setState({etatNoeud: 'Mauvais idmg : ' + idmg})
      }
    } catch(err) {
      console.error("Erreur axios : %O", err)
      this.setState({etatNoeud: 'Erreur/non disponible'})
    }
  }

  soumettre = async event => {
    const infoInternet = this.state
    const commande = {
      domaine: infoInternet.domaine,
      modeTest: infoInternet.modeTest,
    }

    if(this.state.modeCreation === 'dns_cloudns') {
      commande['modeCreation'] = infoInternet.modeCreation
      commande['cloudnsSubid'] = infoInternet.cloudnsSubid
      commande['cloudnsPassword'] = infoInternet.cloudnsPassword
    }

    // const signateurTransaction = this.props.rootProps.signateurTransaction
    // await signateurTransaction.preparerTransaction(commande, 'Monitor.changerConfigurationDomaine')

    const domaineAction = 'Monitor.changerConfigurationDomaine'
    commande = await this.props.rootProps.chiffrageWorker.formatterMessage(commande, domaineAction)

    console.debug("Commande a transmettre : %O", commande)
    const url = 'https:/' + path.join('/', this.props.urlNoeud, '/installation/api/configurerDomaine')
    try {
      const reponse = await axios({
        method: 'post',
        url,
        data: commande,
        timeout: 5000,
      })
      console.debug("Reponse configuration domaine : %O", reponse)
      this.setState({confirmation: "Configuration transmise"})
    } catch(err) {
      this.setState({erreur: ''+err})
    }
  }

  cacherErreur = event => {this.setState({erreur: ''})}
  cacherConfirmation = event => {this.setState({confirmation: ''})}

  render() {

    return (
      <>
        <p>
          Configurer le domaine internet du noeud. Genere un certificat SSL.
        </p>

        <AfficherFormInternet changerTextfield={this.changerTextfield}
                              changerDomaine={this.changerDomaine}
                              setCheckbox={this.setCheckbox}
                              setModeCreation={this.setModeCreation}
                              domaineValide={this.state.domaineValide}
                              {...this.props} {...this.state} />

        <Row>
          <Col>
            <Button onClick={this.soumettre}>Soumettre</Button>
          </Col>
        </Row>
      </>
    )
  }
}

function AfficherFormInternet(props) {

  var flagDomaineInvalide = null;
  if( ! props.domaineValide ) {
    flagDomaineInvalide = <i className="fa fa-close btn-outline-danger"/>
  }

  var configurationAvancee = ''
  if(props.configurationAvancee) {
    var cloudnsParams = ''
    if (props.modeCreation === 'dns_cloudns') {
      cloudnsParams = (
        <div>
          <label htmlFor="cloudns-subid">Configuration ClouDNS</label>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text id="cloudns-subid">
                SubID (numero)
              </InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="cloudns-subid"
                         aria-describedby="cloudns-subid"
                         name="cloudnsSubid"
                         value={props.cloudnsSubid}
                         onChange={props.changerTextfield} />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text id="cloudns-password">
                Mot de passe
              </InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="cloudns-password"
                         aria-describedby="cloudns-password"
                         type="password"
                         name="cloudnsPassword"
                         value={props.cloudnsPassword}
                         onChange={props.changerTextfield} />
          </InputGroup>

          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text id="dns-sleep">
                DNS sleep
              </InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="dns-sleep"
                         aria-describedby="dns-sleep"
                         name="dnssleep"
                         value={props.dnssleep}
                         onChange={props.changerTextfield} />
          </InputGroup>

        </div>
      )
    }

    configurationAvancee = (
      <div>
        <Form.Check id="certificat-test">
          <Form.Check.Input type='checkbox' name="modeTest" value='true' onChange={props.setCheckbox} value={props.modeTest}/>
          <Form.Check.Label>Certificat de test</Form.Check.Label>
        </Form.Check>

        <Form.Group controlId="modeCreationCertificat">
          <Form.Label>Mode de creation certificat</Form.Label>
          <Form.Control as="select" value={props.modeCreation} onChange={props.setModeCreation}>
            <option value="webroot">Mode http (port 80)</option>
            <option value="dns_cloudns">ClouDNS</option>
          </Form.Control>
        </Form.Group>

        {cloudnsParams}
      </div>
    )
  }

  return (
    <>
      <Row>
        <Col>
          <h4>Configuration prealable</h4>

          <ul>
            <li>Nom de domaine</li>
            <li>Configurer les ports TCP 443 et 80 sur le routeur</li>
          </ul>

          <p>
            Adresse IPv4 detectee pour le noeud : {props.ipDetectee}
          </p>

        </Col>
      </Row>

      <Row>
        <Col>
          <h3>Configuration</h3>
        </Col>
      </Row>
      <Form>
        <label htmlFor="noeud-url">URL d'acces au noeud {flagDomaineInvalide}</label>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="noeud-addon3">
              https://
            </InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl id="noeud-url" aria-describedby="noeud-addon3" value={props.domaine} onChange={props.changerDomaine}/>
        </InputGroup>

        <Form.Check id="configuration-avancee">
          <Form.Check.Input type='checkbox' name="configurationAvancee" value='true' onChange={props.setCheckbox} value={props.configurationAvancee}/>
          <Form.Check.Label>Configuration avancee</Form.Check.Label>
        </Form.Check>

        {configurationAvancee}

      </Form>
    </>
  )
}

export class ConsignationNoeud extends React.Component {

  state = {
    modeConsignation: '',

    awss3_credentialsAccessKeyId: '',
    awss3_credentialsSecretAccessKey: '',
    awss3_credentialsRegion: '',
    awss3_bucketRegion: '',
    awss3_bucketName: '',
    awss3_bucketDirfichier: '',

    certificatMaitredescles: '',
  }

  componentDidMount() {
    // console.debug("PROPPYS : %O", this.props)

    // Aller chercher le certificat du maitre des cles pour chiffrer le mot de passe
    const wsa = this.props.rootProps.websocketApp
    wsa.getCertificatsMaitredescles().then(certs=>{
      // console.debug("Certs %O", certs)
      this.setState({certificatMaitredescles: certs})
    })

  }

  setChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  setModeConsignation = event => {
    const value = event.currentTarget.value
    this.setState({modeConsignation: value})
  }

  soumettre = async event => {
    // console.debug("Proppuss : %O, Statuss : %O", this.props, this.state)
    // const signateurTransaction = this.props.rootProps.signateurTransaction
    const webWorker = this.props.rootProps.chiffrageWorker,
          noeud_id = this.props.noeud_id,
          wsa = this.props.rootProps.websocketApp,
          consignationWeb = this.props.noeud.consignation_web || {}

    const modeConsignation = this.state.modeConsignation || consignationWeb.modeConsignation
    const transaction = {
      noeud_id,
      modeConsignation,
    }

    for(let champ in this.state) {
      // console.debug("Verif champ %s", champ)
      if(champ.startsWith(modeConsignation) && this.state[champ]) {
        var nomChamp = champ.split('_')[1]
        transaction[nomChamp] = this.state[champ]
      }
    }

    // Chiffrer mot de passe si fourni
    if(transaction.credentialsSecretAccessKey) {
      // console.debug("Chiffrer le nouveau mot de passe AWS S3")
      const contenuChiffre = await chiffrerChamp(
        webWorker, noeud_id, this.state.certificatMaitredescles, transaction.credentialsSecretAccessKey)
      const transactionMaitredescles = contenuChiffre.transactionMaitredescles

      transaction.credentialsSecretAccessKey = contenuChiffre.contenuChiffre

      // Soumettre transaction maitredescles
      // console.debug("Transaction maitre des cles : %O", transactionMaitredescles)
      try {
        const reponse = await wsa.soumettreTransactionMaitredescles(transactionMaitredescles)
        // console.debug("Reponse transaction maitre des cles : %O", reponse)

        if(reponse.err || !reponse.succes) {
          this.props.setErreur('Erreur sauvegarde configuration (transaction cle)\n' + reponse.message)
        }

      } catch(err) {
        console.error("Erreur sauvegarde transaction cle : %O", err)
        this.props.setErreur('Erreur sauvegarde configuration (transaction cle)\n' + err)
      }

    }

    // await signateurTransaction.preparerTransaction(transaction, 'Topologie.configurerConsignationWeb')
    const domaineAction = 'Topologie.configurerConsignationWeb'
    transaction = await webWorker.formatterMessage(transaction, domaineAction)

    // console.debug("Transaction information AWS S3: %O", transaction)
    const reponse = await wsa.configurerConsignationWeb(transaction)
    if(!reponse.err && reponse.succes) {
      // Ok, reset les valeurs dans this.state
      const resetValeurs = {}
      for(let champ in this.state) {
        if(champ.startsWith(modeConsignation) && this.state[champ]) {
          resetValeurs[champ] = ''
        }
      }
      this.setState(resetValeurs)
    }

  }

  render() {

    const consignationWeb = this.props.noeud.consignation_web || {}
    const modeConsignation = this.state.modeConsignation || consignationWeb.modeConsignation || 'cachenginx'
    // console.debug("PROPPYS: %O\nCONSIGNATIONWEB: %O\nMODE CONSIGNATION : %s", this.props, consignationWeb, modeConsignation)
    var configurationConsignation = ''
    if(modeConsignation === 'awss3') {
      configurationConsignation = (
        <AmazonWebServicesS3 setChamp={this.setChamp}
                             awss3_credentialsAccessKeyId={this.state.awss3_credentialsAccessKeyId || consignationWeb.credentialsAccessKeyId}
                             awss3_credentialsSecretAccessKey={this.state.awss3_credentialsSecretAccessKey}
                             awss3_credentialsSecretAccessKeyExiste={consignationWeb.credentialsSecretAccessKey}
                             awss3_credentialsRegion={this.state.awss3_credentialsRegion || consignationWeb.credentialsRegion}
                             awss3_bucketRegion={this.state.awss3_bucketRegion || consignationWeb.bucketRegion}
                             awss3_bucketName={this.state.awss3_bucketName || consignationWeb.bucketName}
                             awss3_bucketDirfichier={this.state.awss3_bucketDirfichier || consignationWeb.bucketDirfichier} />
      )
    } else if(modeConsignation === 'cachenginx') {
      configurationConsignation = (
        <>
          <h3>Cache Nginx</h3>
          <p>
            Les fichiers sont telecharges sur demande a partir du serveur consignationfichiers
            du noeud protege. Idealement la connexion upstream entre le serveur de fichiers et
            le serveur de nginx devrait etre plus rapide que la connexion internet outgoing.
          </p>
        </>
      )
    }

    return (
      <>
        <h2>Acces web des fichiers du noeud</h2>

        <InputGroup>
          <Form.Check id="modeconsignation-cachenginx"
                      type="radio"
                      name="modeConsignation"
                      value="cachenginx"
                      label="Cache Nginx"
                      checked={modeConsignation==='cachenginx'}
                      onChange={this.setModeConsignation} />
        </InputGroup>
        <InputGroup>
          <Form.Check id="modeconsignation-awss3"
                      type="radio"
                      name="modeConsignation"
                      value="awss3"
                      label="Amazon Web Services S3"
                      checked={modeConsignation==='awss3'}
                      onChange={this.setModeConsignation} />
        </InputGroup>

        {configurationConsignation}

        <Button onClick={this.soumettre} disabled={!this.props.rootProps.modeProtege}>
          Soumettre
        </Button>
      </>
    )
  }
}

function AmazonWebServicesS3(props) {
  return (
    <>
      <h2>Amazon Web Services S3</h2>

      <p>
        Les fichiers sont telecharges a l'avance vers un serveur Amazon Web Services S3 public.
        Le serveur nginx va rediriger les requetes de fichiers vers le serveur S3 de maniere transparente.
      </p>

      <h3>Configuration credentials S3</h3>
      <Row>
        <Col>
          <label htmlFor="noeud-url">Credentials Region</label>
          <InputGroup>
            <FormControl id="awss3_credentialsRegion"
                         aria-describedby="awss3_credentialsRegion"
                         name="awss3_credentialsRegion"
                         value={props.awss3_credentialsRegion}
                         onChange={props.setChamp} />
          </InputGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <label htmlFor="noeud-url">Credentials Access Key Id</label>
          <InputGroup>
            <FormControl id="awss3_credentialsAccessKeyId"
                         aria-describedby="awss3_credentialsAccessKeyId"
                         name="awss3_credentialsAccessKeyId"
                         value={props.awss3_credentialsAccessKeyId}
                         onChange={props.setChamp} />
          </InputGroup>
        </Col>
        <Col>
          <label htmlFor="noeud-url">Credentials Secret Key (mot de passe)</label>
          <InputGroup>
            <FormControl id="awss3_credentialsSecretAccessKey"
                         aria-describedby="awss3_credentialsSecretAccessKey"
                         name="awss3_credentialsSecretAccessKey"
                         placeholder="Entrer une valeur pour modifier"
                         value={props.awss3_credentialsSecretAccessKey}
                         onChange={props.setChamp} />
          </InputGroup>
        </Col>
      </Row>

      <h3>Configuration bucket S3</h3>
      <Row>
        <Col>
          <label htmlFor="noeud-url">Region Amazon S3 bucket</label>
          <InputGroup>
            <FormControl id="awss3_bucketRegion"
                         aria-describedby="awss3_bucketRegion"
                         name="awss3_bucketRegion"
                         value={props.awss3_bucketRegion}
                         onChange={props.setChamp} />
          </InputGroup>
        </Col>
        <Col>
          <label htmlFor="noeud-url">Bucket</label>
          <InputGroup>
            <FormControl id="awss3_bucketName"
                         aria-describedby="awss3_bucketName"
                         name="awss3_bucketName"
                         value={props.awss3_bucketName}
                         onChange={props.setChamp} />
          </InputGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <label htmlFor="noeud-url">Repertoire fichier</label>
          <InputGroup>
            <FormControl id="awss3_bucketDirfichier"
                         aria-describedby="awss3_bucketDirfichier"
                         name="awss3_bucketDirfichier"
                         value={props.awss3_bucketDirfichier}
                         onChange={props.setChamp} />
          </InputGroup>
        </Col>
      </Row>

    </>
  )
}

function AfficherInfoConfiguration(props) {
  if(!props.noeudInfo) return ''

  return (
    <>
      <h2>Information Noeud</h2>
      <Row>
        <Col>Idmg</Col>
        <Col>{props.noeudInfo.idmg}</Col>
      </Row>
      <Row>
        <Col>Noeud Id</Col>
        <Col>{props.noeudInfo.noeud_id}</Col>
      </Row>
      <Row>
        <Col>Securite</Col>
        <Col>{props.noeudInfo.securite}</Col>
      </Row>
      <Row>
        <Col>Domaine</Col>
        <Col>{props.noeudInfo.domaine}</Col>
      </Row>
      <Row>
        <Col>FQDN detecte</Col>
        <Col>{props.noeudInfo.fqdn_detecte}</Col>
      </Row>

      <h2>Certificat</h2>
      <Row>
        <Col>Expiration du certificat</Col>
        <Col>{props.certificat?''+props.certificat.validity.notAfter:"N/D"}</Col>
      </Row>
      <Row>
        <Col></Col>
        <Col>
          <Button onClick={props.renouveler}
                  disabled={!props.rootProps.modeProtege}>Renouveler</Button>
        </Col>
      </Row>
    </>
  )
}

async function chiffrerChamp(webWorker, noeud_id, certificats, secret) {
  const identificateurs_document = {
    libelle: 'noeud',
    noeud_id,
    'champ': 'consignation_web.credentialsSecretAccessKey',
  }
  const certificatMaitredescles = certificats.certificat
  const domaine = 'Topologie'

  // const contenuChiffre = await new MilleGrillesCryptoHelper().chiffrerDictionnaire(
  //   signateurTransaction, certificatMaitredescles, identificateurs_document, domaine, secret)

  throw new Error("TODO : fix refact webWorker")

  const contenuChiffre = await webWorker.chiffrerDocument(
    secret, domaine, certificatMaitredescles.join('\n'), identificateurs_document)

  return contenuChiffre
}

async function renouvelerCertificat(noeudUrl, csr) {
  console.debug("Renouveler le certificat avec csr %O", csr)

}
