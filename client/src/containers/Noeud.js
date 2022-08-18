import React, {useState, useEffect, useCallback} from 'react'
import { useTranslation } from 'react-i18next'

import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'

import CommandeHttp from './NoeudConfiguration'
import ConfigurationGenerale from './InstanceConfigurationGenerale'
import ApplicationsInstance from './InstanceApplications'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

function AffichageNoeud(props) {

  console.debug("AffichageNoeud proppies", props)

  const { workers, usager, etatConnexion, etatAuthentifie, confirmationCb, attenteCb, fermer } = props
  const instance = props.instance || {}
  const instanceId = instance.instance_id
  
  const { t } = useTranslation()

  const [erreur, setErreur] = useState('')
  const [pageConfiguration, setPageConfiguration] = useState('')
  const [section, setSection] = useState('Information')
  const [serveurUrl, setServeurUrl] = useState('https://fichiers:443')

  const erreurCb = useCallback(err=>{
    attenteCb(false)
    setErreur(err)
  }, [setErreur, attenteCb])

  const fermerErreur = useCallback(()=>setErreur(''), [setErreur])

  var PageCourante = InformationTransactionsNoeud
  if(section === 'CommandeHttp') {
    PageCourante = CommandeHttp
  } else if(section === 'Applications') {
    PageCourante = ApplicationsInstance
  } else if(section === 'Docker') {
    PageCourante = PageDocker
  } else if(section === 'ConfigurationGenerale') {
    PageCourante = ConfigurationGenerale
  }

  const nomNoeud = instance.domaine || instance.fqdn || instanceId

  return (
    <div>

      <Alert show={erreur?true:false} variant="danger" onClose={fermerErreur} dismissible>
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{erreur}</p>
      </Alert>

      <Row>
          <Col xs={10} md={11}><h2>{t('Noeud.titre', {nom: nomNoeud})}</h2></Col>
          <Col xs={2} md={1} className="bouton">
              <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
          </Col>
      </Row>

      <Nav variant="tabs" defaultActiveKey="Information" onSelect={setSection}>
        <Nav.Item>
          <Nav.Link eventKey="Information">Information</Nav.Link>
        </Nav.Item>
        <NavDropdown title="Configuration" id="nav-dropdown">
          <NavDropdown.Item eventKey="ConfigurationGenerale">Generale</NavDropdown.Item>
          <NavDropdown.Item eventKey="CommandeHttp">Commande HTTP</NavDropdown.Item>
        </NavDropdown>
        <Nav.Item>
          <Nav.Link eventKey="Applications">Applications</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="Docker">Docker</Nav.Link>
        </Nav.Item>
      </Nav>

      <PageCourante instance={instance}
                    serveurUrl={serveurUrl}
                    setPageConfiguration={setPageConfiguration}
                    setErreur={erreurCb}
                    etatConnexion={etatAuthentifie}
                    etatAuthentifie={etatAuthentifie}
                    usager={usager}
                    workers={workers} 
                    confirmationCb={confirmationCb} 
                    attenteCb={attenteCb} 
                    fermer={fermer} />

    </div>
  )

}

export default AffichageNoeud

function PageDocker(props) {
  return (
    <>
      <h2>Docker</h2>
      <AfficherServices instance={props.instance} />
      <AfficherContainers instance={props.instance} />
    </>
  )
}

function InformationTransactionsNoeud(props) {

  // console.debug("Noeud info PROPPYS : %O", this.props.noeud)

  const instance = props.instance || {},
        instanceId = instance.instance_id,
        {workers, etatAuthentifie, fermer, attenteCb, confirmationCb, erreurCb } = props,
        connexion = workers.connexion

  const supprimerCb = useCallback(()=>{
    console.debug("Supprimer %s", instanceId)
    attenteCb(true)
    connexion.supprimerInstance(instanceId)
      .then(reponse=>{
        console.debug("Reponse supprimer : %O", reponse)
        if(reponse.err) {
          erreurCb(`Erreur suppression instance ${instanceId} : ${''+reponse.err}`)
        } else {
          confirmationCb(`Instance ${instanceId} supprimee.`)
          fermer()
        }
      })
      .catch(err=>erreurCb(''+err))
  }, [connexion, instanceId, erreurCb])

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

          <Row>
            <Col>Supprimer l'instance</Col>
          </Row>
          <Row>
            <Col>
              <Button variant="danger" onClick={supprimerCb} disabled={!etatAuthentifie}>Supprimer</Button>
            </Col>
          </Row>
      </div>
  )

}

function AfficherServices(props) {

  const renderingServices = []

  if(props.instance && props.instance.services) {
    // console.debug("Noeud : %O", props.noeud)
    const services = props.instance.services
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

  if(props.instance && props.instance.containers) {
    // console.debug("Noeud : %O", props.noeud)
    const containers = props.instance.containers
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

// async function restaurerApplication(wsa, noeudId, nomApplication, opts) {
//   opts = opts || {}
//   console.debug("Restaurer application %s sur noeud %s", nomApplication, noeudId)
//   const params = {noeudId, nom_application: nomApplication, ...opts}
//   return wsa.restaurerApplication(params)
// }

// async function backupApplication(wsa, noeudId, nomApplication, opts) {
//   opts = opts || {}
//   console.debug("Backup application %s sur noeud %s", nomApplication, noeudId)
//   const params = {noeudId, nom_application: nomApplication, ...opts}
//   return wsa.backupApplication(params)
// }
