import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import {proxy as comlinkProxy} from 'comlink'

import {CommandeHttp, ConsignationNoeud} from './NoeudConfiguration'
import ApplicationsInstance from './InstanceApplications'

import { ListeNoeuds } from '../components/ListeTopologie'
import { FormatterDate } from '@dugrema/millegrilles.reactjs'

export function SommaireNoeud(props) {

  const noeud_id = props.rootProps.paramsPage.noeudid

  return (
    <ListeNoeuds noeud_id={noeud_id} rootProps={props.rootProps} workers={props.workers}>
      <AffichageNoeud noeud_id={noeud_id} rootProps={props.rootProps} workers={props.workers}/>
    </ListeNoeuds>
  )

}

class AffichageNoeud extends React.Component {

  state = {
    evenementApplication: {},
    erreur: '',
    pageConfiguration: '',
    section: 'Information',
    serveurUrl: 'https://fichiers:443',
  }

  setSection = section => {
    this.setState({section})
  }

  setServeurUrl = event => {
    this.setState({serveurUrl: event.currentTarget.value})
  }

  backupApplication = async event => {
    // console.debug("Lancer backup application %O ", event)
    const nomApplication = event.currentTarget.value
    const wsa = this.props.workers.connexion
    this.setState({evenementApplication: {...this.state.evenementApplication, [nomApplication]: 'debut'}})
    try {
      const opts = {}
      if(this.state.serveurUrl) opts.serveur_url = this.state.serveurUrl

      const reponse = await backupApplication(wsa, this.props.noeud_id, nomApplication, opts)
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
    const wsa = this.props.workers.connexion
    this.setState({evenementApplication: {...this.state.evenementApplication, [nomApplication]: 'debut'}})
    try {
      const reponse = await restaurerApplication(wsa, this.props.noeud_id, nomApplication, {serveur_url: this.state.serveurUrl})
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
    console.debug("Evenement application : %O", event)
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

    var PageCourante = InformationTransactionsNoeud
    if(this.state.section === 'CommandeHttp') {
      PageCourante = CommandeHttp
    } else if(this.state.section === 'Consignation') {
      PageCourante = ConsignationNoeud
    } else if(this.state.section === 'Applications') {
      PageCourante = ApplicationsInstance
    } else if(this.state.section === 'Docker') {
      PageCourante = PageDocker
    }

    var nomNoeud = noeudInfo.domaine || noeudInfo.fqdn || this.props.noeud_id

    return (
      <div>

        <h1>Instance {nomNoeud}</h1>

        {erreur}

        <Nav variant="tabs" defaultActiveKey="Information" onSelect={this.setSection}>
          <Nav.Item>
            <Nav.Link eventKey="Information">Information</Nav.Link>
          </Nav.Item>
          <NavDropdown title="Configuration" id="nav-dropdown">
            <NavDropdown.Item eventKey="CommandeHttp">Commande HTTP</NavDropdown.Item>
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
                      serveurUrl={this.state.serveurUrl}
                      backupApplication={this.backupApplication}
                      restaurer={this.restaurerApplication}
                      setPageConfiguration={this.setPageConfiguration}
                      setServeurUrl={this.setServeurUrl}
                      setErreur={this.setErreur}
                      {...this.props} />

      </div>
    )
  }

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

function InformationTransactionsNoeud(props) {

    // console.debug("Noeud info PROPPYS : %O", this.props.noeud)

      var info = ''
      const instance = props.noeud || {},
            instanceId = instance.noeud_id

  return (
      <div>
          <h2>Information</h2>

          <Row>
            <Col md={3}>Instance Id</Col>
            <Col>{instanceId}</Col>
          </Row>
          <Row>
            <Col md={3}>Domaine</Col>
            <Col>{instance.domaine}</Col>
          </Row>
          <Row>
            <Col md={3}>FQDN</Col>
            <Col>{instance.fqdn}</Col>
          </Row>
          <Row>
            <Col md={3}>Ip</Col>
            <Col>{instance.ip_detectee}</Col>
          </Row>
          <Row>
            <Col md={3}>Securite</Col>
            <Col>{instance.securite}</Col>
          </Row>
          <Row>
            <Col md={3}>Derniere presence</Col>
            <Col><FormatterDate value={instance.date} /></Col>
          </Row>
          <Row>
            <Col md={3}>Etat</Col>
            <Col>{instance.actif?'Actif':'Inactif'}</Col>
          </Row>

      </div>
  )

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

async function restaurerApplication(wsa, noeudId, nomApplication, opts) {
  opts = opts || {}
  console.debug("Restaurer application %s sur noeud %s", nomApplication, noeudId)
  const params = {noeudId, nom_application: nomApplication, ...opts}
  return wsa.restaurerApplication(params)
}

async function backupApplication(wsa, noeudId, nomApplication, opts) {
  opts = opts || {}
  console.debug("Backup application %s sur noeud %s", nomApplication, noeudId)
  const params = {noeudId, nom_application: nomApplication, ...opts}
  return wsa.backupApplication(params)
}
