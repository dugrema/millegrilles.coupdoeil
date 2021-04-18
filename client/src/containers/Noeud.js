import React from 'react'
import { Row, Col, Button, ButtonGroup, Form, Modal, Alert, InputGroup, FormControl, Nav, NavDropdown } from 'react-bootstrap'
import path from 'path'
import axios from 'axios'
import {proxy as comlinkProxy} from 'comlink'

import {CommandeHttp, ConsignationNoeud} from './NoeudConfiguration'

import { ListeNoeuds, ListeDomaines } from '../components/ListeTopologie'
import { chargerInfoNoeud } from '../components/UtilNoeuds'
import { DateTimeAfficher } from '../components/ReactFormatters'

const subscriptionsEvenementsApplication = [
  'evenement.backup.restaurationApplication',
  'evenement.backup.backupApplication',
]
const traiterMessageEvenementApplications = [
  'evenement.servicemonitor.__noeudId__.applicationDemarree',
  'evenement.servicemonitor.__noeudId__.applicationArretee',
  'evenement.servicemonitor.__noeudId__.erreurDemarrageApplication',
]

export function SommaireNoeud(props) {

  const noeud_id = props.rootProps.paramsPage.noeudid

  return (
    <ListeNoeuds noeud_id={noeud_id} rootProps={props.rootProps}>
      <AffichageNoeud noeud_id={noeud_id} rootProps={props.rootProps}/>
    </ListeNoeuds>
  )

}

class AffichageNoeud extends React.Component {

  state = {
    evenementApplication: {},
    erreur: '',
    pageConfiguration: '',
    section: 'Information',
  }

  componentDidMount() {
    const wsa = this.props.rootProps.websocketApp
    // console.debug("Noeud : %O", this.props.noeud)

    const routingNoeud = traiterMessageEvenementApplications.map(item=>{return item.replace('__noeudId__', this.props.noeud_id)})
    subscriptionsEvenementsApplication.forEach(item=>{routingNoeud.push(item)})
    // console.debug("Enregistrer routing keys : %O", routingNoeud)

    const securite = this.getNoeud().securite
    wsa.subscribe(routingNoeud, this.traiterMessageEvenementApplication, {exchange: [securite]})
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp
    const securite = this.getNoeud().securite

    const routingNoeud = traiterMessageEvenementApplications.map(item=>{return item.replace('__noeudId__', this.props.noeud_id)})
    subscriptionsEvenementsApplication.forEach(item=>{routingNoeud.push(item)})

    wsa.unsubscribe(routingNoeud, this.traiterMessageEvenementApplication, {exchange: [securite]})
  }

  setSection = section => {
    this.setState({section})
  }

  backupApplication = async event => {
    // console.debug("Lancer backup application %O ", event)
    const nomApplication = event.currentTarget.value
    const wsa = this.props.rootProps.websocketApp
    this.setState({evenementApplication: {...this.state.evenementApplication, [nomApplication]: 'debut'}})
    try {
      const reponse = await backupApplication(wsa, this.props.noeud_id, nomApplication)
      var etatTemp = '', err=''
      if(reponse.ok) {
        etatTemp = 'en cours'
      } else {
        console.error("Erreur : %O", reponse.err)
        etatTemp = 'erreur'
        err = '' + reponse.err
      }
    } catch(errwsa) {
      const errMsg = errwsa.err || errwsa
      console.error("Erreur backupApplication : %O", errwsa)
      etatTemp = 'erreur'
      err = 'Erreur backup ' + nomApplication + ' : ' + errMsg
    }
    this.setState({
      evenementApplication: {...this.state.evenementApplication, [nomApplication]: etatTemp},
      erreur: err
    })
  }

  restaurerApplication = async event => {
    const nomApplication = event.currentTarget.value
    console.debug("Restaurer application %s", nomApplication)
    const wsa = this.props.rootProps.websocketApp
    this.setState({evenementApplication: {...this.state.evenementApplication, [nomApplication]: 'debut'}})
    try {
      const reponse = await restaurerApplication(wsa, this.props.noeud_id, nomApplication)
      var etatTemp = '', err=''
      if(reponse.ok) {
        etatTemp = 'en cours'
      } else {
        console.error("Erreur : %O", reponse.err)
        etatTemp = 'erreur'
        err = '' + reponse.err
      }
    } catch(errwsa) {
      const errMsg = errwsa.err || errwsa
      console.error("Erreur restaurerApplication : %O", errwsa)
      etatTemp = 'erreur'
      err = 'Erreur restauration ' + nomApplication + ' : ' + errMsg
    }
    this.setState({
      evenementApplication: {...this.state.evenementApplication, [nomApplication]: etatTemp},
      erreur: err
    })
  }

  traiterMessageEvenementApplication = comlinkProxy(event => {
    // console.debug("Evenement application : %O", event)
    var {nom_application, evenement} = event.message
    var routingAction = event.routingKey.split('.').pop()
    evenement = evenement || routingAction
    this.setState(
      {evenementApplication: {...this.state.evenementApplication, [nom_application]: evenement}}
    )
  })

  getNoeud = _ => {
    const noeuds = this.props.noeuds.filter(item=>{
      return item.noeud_id === this.props.noeud_id
    })
    var noeudInfo = null
    if(noeuds.length > 0) {
      return noeuds[0]
    }
    return null
  }

  setErreur = erreur => {
    this.setState({erreur})
  }
  fermerErreur = _ => {
    this.setState({erreur: ''})
  }

  render() {

    // console.debug("Affichage noeud : props : %O", this.props)

    // console.debug("NOEUD : %O", noeudInfo)
    const noeudInfo = this.getNoeud()

    var erreur = ''
    if(this.state.erreur) {
      erreur = (
        <Alert variant="danger" onClose={this.fermerErreur} dismissible>
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{this.state.erreur}</p>
        </Alert>
      )
    }

    // var PageCourante = PageNoeud
    // if(this.state.pageConfiguration) {
    //   PageCourante = this.state.pageConfiguration
    // }

    var PageCourante = InformationTransactionsNoeud
    if(this.state.section === 'CommandeHttp') {
      PageCourante = CommandeHttp
    } else if(this.state.section === 'Consignation') {
      PageCourante = ConsignationNoeud
    } else if(this.state.section === 'Applications') {
      PageCourante = ApplicationsNoeud
    } else if(this.state.section === 'Docker') {
      PageCourante = PageDocker
    }

    var nomNoeud = noeudInfo.domaine || noeudInfo.fqdn || this.props.noeud_id

    return (
      <div>

        <h1>Noeud {nomNoeud}</h1>

        {erreur}

        <Nav variant="tabs" defaultActiveKey="Information" onSelect={this.setSection}>
          <Nav.Item>
            <Nav.Link eventKey="Information">Information</Nav.Link>
          </Nav.Item>
          <NavDropdown title="Configuration" id="nav-dropdown">
            <NavDropdown.Item eventKey="CommandeHttp">Commande HTTP</NavDropdown.Item>
            <NavDropdown.Item eventKey="Consignation">Consignation</NavDropdown.Item>
          </NavDropdown>
          <Nav.Item>
            <Nav.Link eventKey="Applications">Applications</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="Docker">Docker</Nav.Link>
          </Nav.Item>
        </Nav>

        <PageCourante noeudInfo={noeudInfo}
                      noeud={noeudInfo}
                      evenementApplication={this.state.evenementApplication}
                      backupApplication={this.backupApplication}
                      restaurer={this.restaurerApplication}
                      setPageConfiguration={this.setPageConfiguration}
                      setErreur={this.setErreur}
                      {...this.props} />

      </div>
    )
  }

}

function PageNoeud(props) {
  return (
    <>
      <InformationTransactionsNoeud noeud={props.noeudInfo}
                                    noeud_id={props.noeud_id}
                                    setPageConfiguration={props.setPageConfiguration} />

      <ApplicationsNoeud noeud={props.noeudInfo} noeudId={props.noeud_id}
                         rootProps={props.rootProps}
                         backup={props.backupApplication}
                         restaurer={props.restaurerApplication}
                         evenementApplication={props.evenementApplication} />

      <AfficherServices noeud={props.noeudInfo} />

      <AfficherContainers noeud={props.noeudInfo} />

      <ListeDomaines rootProps={props.rootProps}>
        <AfficherDomainesNoeud noeud_id={props.noeud_id} />
      </ListeDomaines>
    </>
  )
}

function PageDocker(props) {
  return (
    <>
      <h2>Docker</h2>
      <AfficherServices noeud={props.noeudInfo} />
      <AfficherContainers noeud={props.noeudInfo} />
    </>
  )
}

class InformationTransactionsNoeud extends React.Component {

  render() {

    // console.debug("Noeud info PROPPYS : %O", this.props.noeud)

    var info = ''
    const noeud = this.props.noeud || {}

    return (
      <div>
        <h2>Information</h2>

        <Row>
          <Col md={3}>Noeud Id</Col>
          <Col>{this.props.noeud_id}</Col>
        </Row>
        <Row>
          <Col md={3}>Domaine</Col>
          <Col>{noeud.domaine}</Col>
        </Row>
        <Row>
          <Col md={3}>FQDN</Col>
          <Col>{noeud.fqdn}</Col>
        </Row>
        <Row>
          <Col md={3}>Ip</Col>
          <Col>{noeud.ip_detectee}</Col>
        </Row>
        <Row>
          <Col md={3}>Parent</Col>
          <Col>{noeud.parent_noeud_id}</Col>
        </Row>
        <Row>
          <Col md={3}>Securite</Col>
          <Col>{noeud.securite}</Col>
        </Row>
        <Row>
          <Col md={3}>Derniere presence</Col>
          <Col><DateTimeAfficher date={noeud.date} /></Col>
        </Row>
        <Row>
          <Col md={3}>Etat</Col>
          <Col>{noeud.actif?'Actif':'Inactif'}</Col>
        </Row>

      </div>
    )
  }

}

async function chargerInformationNoeud(wsa, setState, noeud_id) {

  const stats = await chargerInfoNoeud(wsa, noeud_id)
  console.debug("Information noeud:\n%O", stats)
  const noeudInfo = mapperMessageNoeud(stats)
  console.debug("Noeud info\n%O", noeudInfo)
  setState({noeudInfo})

}

function mapperMessageNoeud(message, existant) {
  if(!existant) existant = {}
  const mapping = {
    'fqdn_detecte': 'fqdn',
    'ip_detectee': 'ip',
    'noeud_id': 'noeud_id',
    'parent_noeud_id': 'parent',
    'securite': 'securite',
    '_mg-derniere-modification': 'date',
  }
  for(let key in mapping) {
    const keyMappee = mapping[key]
    if(message[key]) {
      existant[keyMappee] = message[key]
    }
  }

  if(message.services) {
    const services = []
    for(let nomService in message.services) {
      var infoService = message.services[nomService]
      const mapping = Object.assign({}, infoService)
      mapping.nomService = nomService
      services.push(mapping)
    }
    existant.services = services
  }

  if(message.containers) {
    const containers = []
    for(let nomContainer in message.containers) {
      var infoContainer = message.containers[nomContainer]
      const mapping = Object.assign({}, infoContainer)
      mapping.name = nomContainer
      mapping.nomApplication = nomContainer.split('.')[0].slice(1)
      containers.push(mapping)
    }
    existant.containers = containers
  }

  return existant
}

class ApplicationsNoeud extends React.Component {

  state = {
    catalogueApplications: [],


    afficherModalConfiguration: false,
    nomApplicationConfigurer: '',
    contenuConfiguration: '',
  }

  componentDidMount() {
    // Charger catalogue d'applications disponibles
    const wsa = this.props.rootProps.websocketApp
    chargerCatalogueApplications(wsa, etat=>{this.setState(etat)})

    const noeudId = this.props.noeud.noeud_id
    const routingNoeud = traiterMessageEvenementApplications.map(item=>{return item.replace('__noeudId__', noeudId)})
    const securite = this.props.noeud.securite

    console.debug("Routing evenements noeuds securite %s : %O", securite, routingNoeud)

    wsa.subscribe(routingNoeud, this.traiterMessageEvenementApplications, {exchange: [securite]})
  }

  componentWillUnmount() {
    const wsa = this.props.rootProps.websocketApp

    const noeudId = this.props.noeud.noeud_id
    const routingNoeud = traiterMessageEvenementApplications.map(item=>{return item.replace('__noeudId__', noeudId)})
    const securite = this.props.noeud.securite

    wsa.unsubscribe(routingNoeud, this.traiterMessageEvenementApplications, {exchange: [securite]})
  }

  configurerApplication = async event => {
    const wsa = this.props.rootProps.websocketApp
    const noeudId = this.props.noeud.noeud_id
    const securite = this.props.noeud.securite

    const nomApplication = event.currentTarget.value
    console.debug("Configurer application %s", nomApplication)

    try {
      const reponse = await wsa.requeteConfigurationApplication({
        noeud_id: noeudId, nom_application: nomApplication, exchange: securite
      })
      console.debug("Reponse configuration application : %O", reponse)
      const configuration = {}
      for(let key in reponse.configuration) {
        if( ! key.startsWith('_') ) {
          configuration[key] = reponse.configuration[key]
        }
      }
      const configurationString = JSON.stringify(configuration, null, 2)
      this.setState({
        nomApplicationConfigurer: nomApplication,
        contenuConfiguration: configurationString,
        afficherModalConfiguration: true
      })
    } catch(err) {
      console.error("Erreur chargement configuration application %s : %O", nomApplication, err)
    }
  }

  desinstallerApplication = event => {
    const {value} = event.currentTarget
    const noeudId = this.props.noeud.noeud_id
    const securite = this.props.noeud.securite

    // console.debug("Desinstaller application %s", value)
    desinstallerApplication(this.props.rootProps.websocketApp, noeudId, value, securite)
  }

  setApplicationInstaller = event => {
    const app = event.currentTarget.value
    this.setState({applicationSelectionnee: app})
  }

  installerApplication = event => {
    const wsa = this.props.rootProps.websocketApp
    const app = this.state.applicationSelectionnee
    const noeud = this.props.noeud

    console.debug("Desinstaller application %s sur noeud %s", app, noeud.noeud_id)
    installerApplication(wsa, noeud, app)
  }

  traiterMessageEvenementApplications = comlinkProxy(event => {
    // console.debug("Evenement monitor %O", event)
    var action = event.routingKey.split('.').pop()
    // console.debug("Action : %s", action)

    if(action === 'applicationDemarree') {
      const nomApplication = event.message.nom_application
    } else if(action === 'applicationArretee') {
      const nomApplication = event.message.nom_application
    } else if(action === 'erreurDemarrageApplication') {
      const nomApplication = event.message.nom_application
      console.error("Erreur demarrage application %s", nomApplication)
    }

  })

  changerContenuConfiguration = event => {
    this.setState({contenuConfiguration: event.currentTarget.value})
  }

  appliquerConfiguration = async event => {
    // Valider que le JSON est correct
    const configurationStr = this.state.contenuConfiguration
    try {
      const configuration = JSON.parse(configurationStr)

      const wsa = this.props.rootProps.websocketApp
      const nomApplication = this.state.nomApplicationConfigurer
      const noeudId = this.props.noeud.noeud_id
      const securite = this.props.noeud.securite

      const reponse = await wsa.configurerApplication({
        nom_application: nomApplication,
        noeud_id: noeudId,
        configuration,
        exchange: securite,
      })
      console.debug("Reponse configuration %O", reponse)

      this.setState({afficherModalConfiguration: false})
    } catch(err) {
      console.error("JSON de configuration invalide : %O", err)
    }
  }

  demarrerApplication = async event => {
    const nomApplication = event.currentTarget.value
    const noeudId = this.props.noeud.noeud_id
    const securite = this.props.noeud.securite

    const wsa = this.props.rootProps.websocketApp

    // console.debug("Demarrer application %s sur noeud %s", nomApplication, noeudId)
    const reponse = await wsa.demarrerApplication({
      nom_application: nomApplication, noeud_id: noeudId, exchange: securite
    })
    // console.debug("Reponse demarrer application : %O", reponse)
  }

  render() {

    const modalConfiguration = (
      <ModalConfigurationApplication nomApplication={this.state.nomApplicationConfigurer}
                                     show={this.state.afficherModalConfiguration}
                                     configuration={this.state.contenuConfiguration}
                                     changerConfiguration={this.changerContenuConfiguration}
                                     annuler={_=>this.setState({afficherModalConfiguration: false})}
                                     appliquer={this.appliquerConfiguration} />
    )

    const appConfigurees = {}
    if(this.props.noeud) {
      if(this.props.noeud.applications_configurees) {
        for(let idx in this.props.noeud.applications_configurees) {
          const app = this.props.noeud.applications_configurees[idx]
          // console.debug("Application configuree %O", app)
          appConfigurees[app.nom] = app
        }
      }
      if(this.props.noeud.services) {
        for(let nomService in this.props.noeud.services) {
          var service = this.props.noeud.services[nomService]
          if(service.labels && service.labels.application) {
            var infoApp = {
              nom: service.labels.application,
              etat: service.etat,
              nomService: nomService,
              service,
            }

            // Mettre a jour appConfigurees
            var configApp = appConfigurees[infoApp.nom]
            if(configApp) infoApp = {...configApp, ...infoApp}
            appConfigurees[infoApp.nom] = infoApp
          }
        }
      }
      if(this.props.noeud.containers) {
        // console.debug("Containers : %O", this.props.noeud.containers)
        for(let nomContainer in this.props.noeud.containers) {
          const container = this.props.noeud.containers[nomContainer]
          if(container && container.labels && container.labels.application) {
            // C'est un container d'application
            var infoApp = {
              nom: container.labels.application,
              nomContainer: nomContainer,
              modeContainer: container.labels.mode_container,
              etat: container.etat,
              running: container.running,
            }

            // Mettre a jour appConfigurees
            var configApp = appConfigurees[infoApp.nom]
            if(configApp) infoApp = {...configApp, ...infoApp}
            appConfigurees[infoApp.nom] = infoApp
          }
        }
      }
    }

    // console.debug("Applications configurees : %O", appConfigurees)

    const noeud = this.props.noeud || {}

    // Trier liste, render
    const appListe = Object.values(appConfigurees)
    appListe.sort((a,b)=>{ return a.nom.localeCompare(b.nom) })
    // console.debug("Apps, liste:\n%O", appListe)

    // console.debug("ROOT PROPS \n%O", this.props.rootProps)

    const apps = appListe.map(app=>{
      var boutonsActif = noeud.actif && this.props.rootProps.modeProtege
      var boutonsInactif = boutonsActif

      var etat = <span>inactif</span>
      if(app.etat === 'running') {
        etat = <span>actif</span>
        boutonsInactif = false
      } else {
        boutonsActif = false
      }

      const etatApplication = this.props.evenementApplication[app.nom]
      if(etatApplication) {
        etat = <span>{etatApplication}</span>
      }

      return (
        <div key={app.nom}>
          {modalConfiguration}

          <Row key={app.nom}>
            <Col md={3}>{app.nom}</Col>
            <Col md={2}>{etat}</Col>
            <Col md={7}>
              <ButtonGroup aria-label={"Boutons de controle d'application " + app.nom}>
                <Button onClick={this.demarrerApplication} value={app.nom}
                        disabled={!boutonsInactif}
                        variant="secondary">Demarrer</Button>
                <Button onClick={this.desinstallerApplication} value={app.nom}
                        disabled={!boutonsActif && !boutonsInactif}
                        variant="secondary">Arreter</Button>
                <Button onClick={this.configurerApplication} value={app.nom}
                        disabled={!boutonsActif && !boutonsInactif}
                        variant="secondary">Configurer</Button>
                <Button onClick={this.props.backupApplication} value={app.nom}
                        disabled={!boutonsActif && !boutonsInactif}
                        variant="secondary">Backup</Button>
                <Button onClick={this.props.restaurer} value={app.nom}
                        disabled={!boutonsActif && !boutonsInactif}
                        variant="secondary">Restaurer</Button>
              </ButtonGroup>
            </Col>
          </Row>
        </div>
      )
    })

    const catalogueApps = this.state.catalogueApplications.map(app=>{
      return (<option key={app.nom} name={app.nom}>{app.nom}</option>)
    })

    return (
      <div>
        <h2>Applications</h2>

        <h3>Installer une application</h3>
        <Row>
          <Col md={10}>
            <Form.Group controlId="installer_application">
              <Form.Control as="select" onChange={this.setApplicationInstaller}>
                <option>Choisir une application</option>
                {catalogueApps}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col>
            <Button onClick={this.installerApplication}
                    disabled={!noeud.actif || !this.props.rootProps.modeProtege}>Installer</Button>
          </Col>
        </Row>

        <h3>Applications deployees</h3>
        {apps}

      </div>
    )
  }
}

function ModalConfigurationApplication(props) {

  return (
    <>
      <Modal size='lg' show={props.show} onHide={_=>{props.annuler()}}>
        <Modal.Header closeButton>

          <Modal.Title>
            Configurer {props.nomApplication}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form.Group>
            <Form.Control as="textarea" rows="20"
                          value={props.configuration}
                          onChange={props.changerConfiguration} />
          </Form.Group>

          <Button onClick={props.annuler}>Annuler</Button>
          <Button onClick={props.appliquer}>Appliquer</Button>
        </Modal.Body>

      </Modal>
    </>
  )
}

async function desinstallerApplication(wsa, noeudId, nomApplication, securite) {
  // const domaineAction = ['servicemonitor', noeudId ,'supprimerApplication'].join('.')
  const params = { noeudId, 'nom_application': nomApplication, exchange: securite }
  // console.debug("desinstallerApplication: Transmettre commande %O", params)
  //wsa.transmettreCommande(domaineAction, params)
  const reponse = await wsa.desinstallerApplication(params)
  if(reponse.err) {
    console.error("Erreur desinstaller application : %O", reponse.err)
  } else {
    //console.debug("Reponse desinstaller application : %O", reponse)
  }
}

async function chargerCatalogueApplications(wsa, setState) {
  // const domaineAction = 'CatalogueApplications.listeApplications'
  // var applications = await wsa.transmettreRequete(domaineAction, {})

  var applications = await wsa.getCatalogueApplications()

  // console.debug("Applications du catalogue :\n%O", applications)

  applications = applications.sort((a,b)=>{ return a.nom.localeCompare(b.nom) })

  setState({catalogueApplications: applications})
}

async function installerApplication(wsa, noeud, app) {
  // Charger l'information complete du catalogue pour configurer l'installation
  const noeudId = noeud.noeud_id
  const exchange = noeud.securite
  // const domaineActionRequete = 'CatalogueApplications.infoApplication'
  const requete = { 'nom': app }
  //const configuration = await wsa.transmettreRequete(domaineActionRequete, requete)
  const configuration = await wsa.requeteInfoApplications(requete)
  console.debug("Installation application avec configuration : %O", configuration)

  // const domaineAction = ['servicemonitor', noeudId ,'installerApplication'].join('.')
  const params = { 'nom_application': app, configuration, noeudId, exchange }

  console.debug("Transmettre commande installation application vers %s :\n%O", noeudId, params)
  //wsa.transmettreCommande(domaineAction, params, {exchange})
  const reponseInstallerApplication = await wsa.installerApplication(params)
  console.debug("Reponse installation application : %O", reponseInstallerApplication)
}

function AfficherServices(props) {

  const renderingServices = []

  if(props.noeud && props.noeud.services) {
    // console.debug("Noeud : %O", props.noeud)
    const services = props.noeud.services
    for(let key in services) {
      const service = services[key]

      var estApplication = false
      if(service.labels && Object.keys(service.labels).includes('application')) {
        estApplication = true
      }

      renderingServices.push(
        <Row key={key}>
          <Col md={3}>{key}</Col>
          <Col md={2}>{estApplication?"Application":""}</Col>
        </Row>
      )
    }
  }

  return (
    <div>
      <h2>Services</h2>
      {renderingServices}
    </div>
  )
}

function AfficherContainers(props) {
  const renderingContainers = []

  if(props.noeud && props.noeud.containers) {
    // console.debug("Noeud : %O", props.noeud)
    const containers = props.noeud.containers
    for(let key in containers) {
      const container = containers[key]

      const nom = key.split('.')[0].slice(1)

      var estApplication = false
      if(container.labels && Object.keys(container.labels).includes('application')) {
        estApplication = true
      }

      renderingContainers.push(
        <Row key={key}>
          <Col md={3}>{nom}</Col>
          <Col md={2}>{estApplication?"Application":""}</Col>
        </Row>
      )
    }
  }

  return (
    <div>
      <h2>Containers</h2>
      {renderingContainers}
    </div>
  )
}

function AfficherDomainesNoeud(props) {

  const domaines = props.domaines
  // console.debug("Domaines : \n%O", domaines)

  var renderingDomaines = []
  if(domaines) {
    renderingDomaines = domaines.
      filter(domaine=>{return domaine.noeud_id === props.noeud_id}).
      map((domaine, idx)=>{
        return(
          <Row key={domaine.descriptif + '_' + idx}>
            <Col md={3}>{domaine.descriptif}</Col>
            <Col>{domaine.actif?"Actif":"Inactif"}</Col>
          </Row>
        )
      })
  }

  return (
    <div>
      <h2>Domaines deployes sur le noeud</h2>
      {renderingDomaines}
    </div>
  )
}

async function restaurerApplication(wsa, noeudId, nomApplication) {
  console.debug("Restaurer application %s sur noeud %s", nomApplication, noeudId)
  const params = {noeudId, nom_application: nomApplication}
  return wsa.restaurerApplication(params)
}

async function backupApplication(wsa, noeudId, nomApplication) {
  console.debug("Backup application %s sur noeud %s", nomApplication, noeudId)
  const params = {noeudId, nom_application: nomApplication}
  return wsa.backupApplication(params)
}
