import React, {useState, useEffect, useCallback, useMemo} from 'react'
import { useTranslation } from 'react-i18next'

import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import ProgressBar from 'react-bootstrap/ProgressBar'

import CommandeHttp from './NoeudConfiguration'
// import ConfigurationGenerale from './InstanceConfigurationGenerale'
import ApplicationsInstance from './InstanceApplications'
import InstanceConfigurationConsignation from './InstanceConfigurationConsignation'

import { FormatterDate, FormatteurTaille } from '@dugrema/millegrilles.reactjs'

function AffichageInstance(props) {

  // console.debug("AffichageNoeud proppies", props)

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
  // } else if(section === 'ConfigurationGenerale') {
  //   PageCourante = ConfigurationGenerale
  } else if(section === 'ConfigurationConsignation') {
    PageCourante = InstanceConfigurationConsignation
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
          <NavDropdown.Item eventKey="ConfigurationConsignation">Consignation</NavDropdown.Item>
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

export default AffichageInstance

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
            <Col md={3}>TOR (.onion)</Col>
            <Col>{instance.onion}</Col>
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

          <h2>Donnees systeme</h2>

          <EtatThermal instance={instance} />
          <LoadAverage instance={instance} />
          <EtatStockage instance={instance} />
          <EtatApc instance={instance} />

          <br/><br/><br/><br/>

          <h3>Actions</h3>
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

function EtatApc(props) {

  const instance = props.instance || {},
        apc = instance.apc

  if(!apc) return ''

  return (
    <div>
      <h3>APC</h3>
      <Row><Col xs={6} sm={4} md={3}>Date</Col><Col>{apc.DATE || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Etat</Col><Col>{apc.STATUS || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Volt secteur</Col><Col>{apc.LINEV || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Load courant</Col><Col>{apc.LOADPCT || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Temps restant</Col><Col>{apc.TIMELEFT || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Volt batterie</Col><Col>{apc.BATTV || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Charge batterie</Col><Col>{apc.BCHARGE || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Dernier transfert</Col><Col>{apc.LASTXFER || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Sur batterie</Col><Col>{apc.XONBATT || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Hors batterie</Col><Col>{apc.XOFFBATT || 'N/D'}</Col></Row>
      <Row><Col xs={6} sm={4} md={3}>Nombre transferts</Col><Col>{apc.NUMXFERS || 'N/D'}</Col></Row>
    </div>
  )
}

function EtatThermal(props) {
  const instance = props.instance || {},
        temperatureInfo = instance.system_temperature

  const temperature = useMemo(()=>{
    // Valeur RPi
    try {
      return temperatureInfo.cpu_thermal[0][1]
    } catch(err) { }
    return ''
  }, [temperatureInfo])

  console.debug("Temperature ", temperature)

  if(temperature === '') return ''

  return (
    <div>
      <Row><Col xs={6} sm={4} md={3}>Temperature</Col><Col>{temperature}C</Col></Row>
    </div>
  )
}

function LoadAverage(props) {

  const instance = props.instance || {},
        load = instance.load_average

  if(!load) return ''

  return (
    <Row>
      <Col xs={6} sm={4} md={3}>Load average</Col>
      <Col xs={2} md={1}>{load[0]}</Col>
      <Col xs={2} md={1}>{load[1]}</Col>
      <Col xs={2} md={1}>{load[2]}</Col>
    </Row>
  )
}

export function EtatStockage(props) {

  const instance = props.instance || {},
        disk = instance.disk

  const listeDisques = useMemo(()=>{
    if(!disk) return []
    const liste = [...disk]
    liste.sort((a, b)=>{
      return a.mountpoint.localeCompare(b.mountpoint)
    })
    return liste
  }, [disk])

  if(!disk) return ''

  return (
    <div>
      <h3>Stockage</h3>
      <Row>
        <Col md={3}>Mount</Col>
        <Col md={2}>Total</Col>
        <Col md={3}>Utilise</Col>
        <Col md={1}></Col>
        <Col>Libre</Col>
      </Row>
      {listeDisques.map(item=><EtatDisque key={item.mountpoint} value={item} />)}
    </div>
  )
}

function EtatDisque(props) {
  const value = props.value

  const pctFree = useMemo(()=>{
    if(!value) return 100
    return Math.round(value.free / value.total * 100)
  }, [value])

  if(!value) return ''

  return (
    <Row>
      <Col md={3}>{value.mountpoint}</Col>
      <Col md={2}><FormatteurTaille value={value.total} /></Col>
      <Col md={3}><ProgressBar now={100-pctFree} /></Col>
      <Col md={1}>{100-pctFree}%</Col>
      <Col md={2}>(<FormatteurTaille value={value.free} />)</Col>
    </Row>
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
