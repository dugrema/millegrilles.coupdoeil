import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Form, InputGroup, FormControl, Alert} from 'react-bootstrap'
import path from 'path'
import axios from 'axios'

import { AlertTimeout, ModalAttente } from './Util'

import { pki as forgePki } from '@dugrema/node-forge'
import { prendrePossession } from './ConfigurationNoeudsListe'

function CommandeHttp(props) {

  const {workers, etatConnexion, instance, idmg} = props
  const hostnameConfigure = instance.domaine
  const ipDetectee = instance.ip_detectee

  const [hostname, setHostname] = useState('')
  const [etatInstance, setEtatInstance] = useState('inconnu')
  const [instanceInfo, setInstanceInfo] = useState('')
  const [attente, setAttente] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [certificat, setCertificat] = useState('')

  useEffect(()=>{
    if(!instance) return
    var hostname = hostnameConfigure || ipDetectee
    setHostname(hostname)
  }, [setHostname, hostnameConfigure, ipDetectee])

  const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )

  const erreurCb = useCallback(
      (err, message) => { 
          console.debug("Set erreurs %O, %s", err, message)
          setError(err, message)
          if(message) setErrorMessage(message)
          else setErrorMessage(''+err)
          setAttente(false)  // Reset attente
      }, 
      [setError, setErrorMessage, setAttente]
  )

  const verifierAccesNoeudCb = useCallback(event => {
    verifierAccesNoeud(hostname, idmg, setEtatInstance, setInstanceInfo, setCertificat, erreurCb)
      .catch(err=>console.error("Erreur verifierAccesNoeudCb : %O", err))
  }, [hostname, idmg, setEtatInstance, setInstanceInfo, setCertificat, erreurCb])

  return (
    <>
      <h2>Configuration d'une instance via Http</h2>

      <AlertTimeout 
        variant="danger" delay={false} 
        message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
      <AlertTimeout message={confirmation} setMessage={setConfirmation} />
      <ModalAttente show={attente} setAttente={setAttente} />

      <p>
        Transmet des commandes de configuration signees avec le certificat du navigateur.
      </p>

      <label htmlFor="hostmq">URL de connexion a l'instance (https)</label>
      <InputGroup>
        <InputGroup.Text id="hostname">
          https://
        </InputGroup.Text>
        <FormControl id="hostname"
                      aria-describedby="urlNoeud"
                      value={hostname}
                      onChange={event=>setHostname(event.currentTarget.value)} />
      </InputGroup>

      <Row>
        <Col>
          <Button variant="primary" onClick={verifierAccesNoeudCb}>Charger</Button>
        </Col>
      </Row>

      <AfficherInfoConfiguration 
        workers={workers}
        instance={instance}
        instanceInfo={instanceInfo || ''}
        hostname={hostname}
        etatConnexion={etatConnexion} 
        confirmationCb={confirmationCb}
        erreurCb={erreurCb} />

    </>
  )
}

export default CommandeHttp

function AfficherInfoConfiguration(props) {

  const {
    workers, instance, instanceInfo,  etatConnexion, etatInstance, hostname,
    confirmationCb, erreurCb,
  } = props

  const renouvelerCertificatCb = useCallback(async event => {
    renouvellerCertificat(workers, hostname, instance, confirmationCb, erreurCb)
      .catch(err=>console.error("Erreur renouvelerCertificatCb : %O", err))
  }, [workers, hostname, instance, confirmationCb, erreurCb])

  if(!instanceInfo) return ''

  return (
    <>
      <h2>Information instance</h2>
      <Row>
        <Col md={3}>Idmg</Col>
        <Col className="idmg">{instanceInfo.idmg}</Col>
      </Row>
      <Row>
        <Col md={3}>Id</Col>
        <Col>{instanceInfo.noeud_id}</Col>
      </Row>
      <Row>
        <Col md={3}>Securite</Col>
        <Col>{instanceInfo.securite}</Col>
      </Row>
      <Row>
        <Col md={3}>FQDN detecte</Col>
        <Col>{instanceInfo.fqdn_detecte}</Col>
      </Row>

      <ConfigurerDomaine
        workers={workers}
        instanceInfo={instanceInfo} 
        hostname={hostname} />

      <h3>Certificat</h3>
      <AfficherExpirationCertificat pem={instanceInfo.certificat || ''}/>
      <Row>
        <Col>
          <Button variant="secondary" onClick={renouvelerCertificatCb}
                  disabled={!etatConnexion}>Renouveler</Button>
        </Col>
      </Row>

      <ConfigurerMQ 
        workers={workers}
        hostname={hostname}
        erreurCb={erreurCb}
        confirmationCb={confirmationCb} />
    </>
  )
}

function ConfigurerDomaine(props) {

  const { instanceInfo, hostname } = props
  const domaineConfigure = instanceInfo.domaine

  const changerDomaineCb = useCallback(event=>{
    console.debug("Changer domaine pour : %s", hostname)
  }, [hostname])

  return (
    <>
      <h3>Domaine</h3>
      
      <Row>
        <Col md={4}>Configure</Col>
        <Col>{domaineConfigure}</Col>
      </Row>

      <Row>
        <Col md={4}>Utilise</Col>
        <Col>{hostname}</Col>
      </Row>

      <label htmlFor="changerDomaine">Changer le hostname configure pour le hostname utilise.</label>
      <br/>
      <Button id="changerDomaine" variant="secondary" disabled={hostname===domaineConfigure} onClick={changerDomaineCb}>Changer</Button>
    </>
  )

}

async function renouvellerCertificat(workers, hostname, instance, confirmationCb, erreurCb) {
  console.debug("Renouveler certificat du noeud %s", hostname)

  const { connexion } = workers

  const urlCsr = new URL('https://localhost/installation/api/csr')
  urlCsr.hostname = hostname
  const reponseCsr = await axios.get(urlCsr.href)
  console.debug("Reponse CSR : %O", reponseCsr)

  if(reponseCsr.status === 410) {
    console.debug("Le CSR n'existe pas, demander au noeud d'en generer un nouveau")
    const urlGenerer = new URL('https://localhost/installation/api/genererCsr')
    urlGenerer.hostname = hostname
    console.debug("URL verification noeud : %s", urlGenerer.href)

    const domaine = 'monitor', action = 'genererCsr'
    const commande = await connexion.formatterMessage({}, domaine, {action, attacherCertificat: true})

    try {
      const reponse = await axios({
        method: 'post',
        url: urlGenerer.href,
        data: commande,
        timeout: 5000,
      })

      var csr = reponse.data
    } catch(err) {
      erreurCb(err, "Erreur demande du CSR")
      return
    }
  } else if(reponseCsr.status === 200) {
    var csr = reponseCsr.data
  } else {
    erreurCb(`Erreur renouvellement certificat (CSR non recu, status : ${reponseCsr.status})`)
    return
  }

  console.debug("CSR a utiliser\n%s", csr)
  const securite = instance.securite

  try {
    if(csr && securite) {
      await prendrePossession(connexion, csr, securite, hostname)
      confirmationCb('Certificat renouvelle avec succes.')
    } else {
      erreurCb("Il manque le csr ou le niveau de securite")
    }
  } catch(err) {
    console.error("Erreur prendrePossession : %O", err)
    erreurCb(err, 'Erreur renouvellement de certificat.')
  }
}

async function verifierAccesNoeud(hostname, idmg, setEtatInstance, setInstance, setCertificat, erreurCb) {
  const url = new URL("https://localhost/installation/api/infoMonitor")
  url.hostname = hostname

  console.debug("URL verification noeud : %s", url.href)
  try {
    const reponse = await axios.get(url.href)
    console.debug("Reponse noeud : %O", reponse)

    const idmgReponse = reponse.data.idmg
    console.debug("Comparaison idmg : Reponse %s, cert %s", idmg, idmgReponse)

    if(idmg === idmgReponse) {

      try {
        const certificat = forgePki.certificateFromPem(reponse.data.certificat)
        console.debug("Certificat noeud : %O", certificat)
        setCertificat(certificat)
      } catch(err) {
        erreurCb(err, 'Erreur chargement certificat (invalide)')
        return
      }

      setEtatInstance('disponible')
      setInstance(reponse.data)

    } else {
      erreurCb(`Mauvais idmg ${idmgReponse}`)
    }
  } catch(err) {
    erreurCb(err, `Erreur connexion`)
  }
}

async function changerHostnameInstance(workers, instance, hostname, confirmationCb, erreurCb) {
  const {connexion} = workers

  const commande = {
    noeud_id: instance.noeud_id,
    domaine: hostname,
  }

  console.debug("changerDomaineInstance %O", commande)

  try {
    const resultat = await connexion.changerDomaineInstance(commande)
    console.debug("Resultat changerDomaineInstance : %O", resultat)
    if(resultat.err) {
      erreurCb(resultat.err, 'Erreur changement hostname.')
    } else {
      confirmationCb('Hostname change avec succes.')
    }
  } catch(err) {
    console.error("conserverDomaineNoeud Erreur majMonitor : %O", err)
    erreurCb(err, 'Erreur changement hostname.')
  }
}

function ConfigurerMQ(props) {

  const { workers, hostname, confirmationCb, erreurCb } = props

  const [hostMq, setHostMq] = useState('')
  const [portMq, setPortMq] = useState('5673')

  const soumettre = useCallback(event=>{
    configurerMq(workers, hostname, hostMq, portMq, confirmationCb, erreurCb)
      .catch(err=>console.error("Erreur %O", err))
  }, [workers, hostname, hostMq, portMq, confirmationCb, erreurCb])

  return (
    <>
      <h3>Configurer MQ</h3>
      <p>Modifier la configuration de MQ pour reconnecter l'instance au serveur 3.protege.</p>

      <label htmlFor="hostmq">Configuration de la connexion MQ</label>
      <Row>
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text id="hostmq">
              Host
            </InputGroup.Text>
            <FormControl 
              id="hostmq"
              aria-describedby="hostmq"
              name="host"
              value={hostMq}
              placeholder="exemple : serveur.domain.com"
              onChange={event=>setHostMq(event.currentTarget.value)} />
          </InputGroup>
        </Col>

        <Col md={4}>
          <InputGroup>
            <InputGroup.Text id="portmq">
              Port
            </InputGroup.Text>
            <FormControl 
              id="portmq"
              aria-describedby="portmq"
              name="port"
              value={portMq}
              onChange={event=>setPortMq(event.currentTarget.value)} />
          </InputGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button variant="secondary" disabled={!hostMq} onClick={soumettre}>Configurer</Button>
        </Col>
      </Row>
    </>
  )
}

async function configurerMq(workers, hostname, hostMq, portMq, confirmationCb, erreurCb) {
  const {connexion} = workers

  var commande = {}
  if(!hostMq && !portMq) {
    commande.supprimer_params_mq = true
  } else {
    commande.host = hostMq
    commande.port = portMq
  }

  const domaine = 'monitor', action = 'changerConfigurationMq'
  const commandeSignee = await connexion.formatterMessage(commande, domaine, {action})

  console.debug("Commande a transmettre : %O", commandeSignee)
  const url = new URL('https://localhost/installation/api/configurerMQ')
  url.hostname = hostname
  try {
    const reponse = await axios({
      method: 'post',
      url,
      data: commandeSignee,
      timeout: 20000,
    })
    console.debug("Reponse configuration MQ : %O", reponse)
    const data = reponse.data
    if(data.ok === false) {
      erreurCb(data.err, 'Erreur changement configuration MQ')
    } else {
      confirmationCb('Configuration MQ modifiee avec succes')
    }
  } catch(err) {
    erreurCb(err, 'Erreur changement configuration MQ')
  }
}

class ConfigurerDomaineOld extends React.Component {

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
    var commande = {
      domaine: infoInternet.domaine,
      modeTest: infoInternet.modeTest,
    }

    if(this.state.modeCreation === 'dns_cloudns') {
      commande['modeCreation'] = infoInternet.modeCreation
      commande['cloudnsSubid'] = infoInternet.cloudnsSubid
      commande['cloudnsPassword'] = infoInternet.cloudnsPassword
    }

    const connexion = this.props.workers.connexion

    // const signateurTransaction = this.props.rootProps.signateurTransaction
    // await signateurTransaction.preparerTransaction(commande, 'Monitor.changerConfigurationDomaine')

    const domaine = 'monitor', action = 'changerConfigurationDomaine'
    const commandeSignee = await connexion.formatterMessage(commande, domaine, {action})

    console.debug("Commande a transmettre : %O", commande)
    const url = 'https:/' + path.join('/', this.props.urlNoeud, '/installation/api/configurerDomaine')
    try {
      const reponse = await axios({
        method: 'post',
        url,
        data: commandeSignee,
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
          Configurer le domaine internet de l'instance. Genere un certificat SSL.
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
            <InputGroup.Text id="cloudns-subid">
              SubID (numero)
            </InputGroup.Text>
            <FormControl id="cloudns-subid"
                         aria-describedby="cloudns-subid"
                         name="cloudnsSubid"
                         value={props.cloudnsSubid}
                         onChange={props.changerTextfield} />
          </InputGroup>
          <InputGroup>
            <InputGroup.Text id="cloudns-password">
              Mot de passe
            </InputGroup.Text>
            <FormControl id="cloudns-password"
                         aria-describedby="cloudns-password"
                         type="password"
                         name="cloudnsPassword"
                         value={props.cloudnsPassword}
                         onChange={props.changerTextfield} />
          </InputGroup>

          <InputGroup>
            <InputGroup.Text id="dns-sleep">
              DNS sleep
            </InputGroup.Text>
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
          <Form.Check.Input type='checkbox' name="modeTest" value="true" checked={props.modeTest} onChange={props.setCheckbox} />
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
          <InputGroup.Text id="noeud-addon3">
            https://
          </InputGroup.Text>
          <FormControl id="noeud-url" aria-describedby="noeud-addon3" value={props.domaine} onChange={props.changerDomaine}/>
        </InputGroup>

        <Form.Check id="configuration-avancee">
          <Form.Check.Input type='checkbox' name="configurationAvancee" value="true" checked={props.configurationAvancee} onChange={props.setCheckbox} />
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
          noeud_id = this.props.instance.noeud_id,
          wsa = this.props.rootProps.websocketApp,
          consignationWeb = this.props.instance.consignation_web || {}

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

    const consignationWeb = this.props.instance.consignation_web || {}
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

function AfficherExpirationCertificat(props) {
  const [certificat, setCertificat] = useState('')
  useEffect(_=>{
    const pem = props.pem
    var cert = ''
    if(pem) {
      try {
        console.debug("PEM : %O", pem)
        cert = forgePki.certificateFromPem(pem)
        console.debug("Cert : %O", cert)
      } catch(err) {
        console.error("Erreur chargement certificat noeud: %O", err)
      }
    }
    setCertificat(cert)
  }, [props.pem])

  const validity = certificat.validity || ''

  var notAfter = '', expirationDuree = ''
  if(validity) {
    notAfter = '' + validity.notAfter
    const expirationDureeMs = validity.notAfter.getTime() - new Date().getTime()
    if(expirationDureeMs < 0) {
      expirationDuree = 'Expire'
    } else {
      const jourMs = 1000*60*60*24
      if(expirationDureeMs > jourMs) {
        const expirationDureeJours = expirationDureeMs / jourMs
        expirationDuree = Math.floor(expirationDureeJours) + ' jours'
      } else {
        const expirationDureeHeures = expirationDureeMs / (1000*60*60)
        expirationDuree = Math.floor(expirationDureeHeures) + ' heures'
      }
    }
    console.debug("Expiration duree : %O", expirationDuree)
  } else {
    return ''
  }

  return (
    <>
      <Row>
        <Col md={3}>Expiration</Col>
        <Col>{notAfter}</Col>
      </Row>
      <Row>
        <Col md={3}>Duree restante</Col>
        <Col>{expirationDuree}</Col>
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

async function renouvelerCertificat(workers, noeudUrl, csr) {
  console.debug("Renouveler le certificat avec csr %O", csr)

}
