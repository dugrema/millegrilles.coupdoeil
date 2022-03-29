import { useEffect, useState, useCallback } from "react"
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'

import axios from 'axios'
import {proxy as comlinkProxy} from 'comlink'

import { FormatterDate } from '@dugrema/millegrilles.reactjs'

import AfficherInstanceDetail from './Noeud'
import { AlertTimeout, ModalAttente } from './Util'
import { Modal } from "react-bootstrap"

function Instances(props) {

    const {workers, etatConnexion, idmg} = props
    const connexion = workers.connexion

    const [instancesParId, setInstancesParId] = useState('')
    const [evenementRecu, setEvenementRecu] = useState('')
    const [instanceSelectionnee, setInstanceSelectionnee] = useState('')
    const [showAssocier, setShowAssocier] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [attente, setAttente] = useState(false)
        
    useEffect(()=>{
        if(evenementRecu) {
            traiterMessageRecu(evenementRecu.message, instancesParId, setInstancesParId)
        }
        setEvenementRecu('')
    }, [instancesParId, setInstancesParId, evenementRecu, setEvenementRecu])

    const selectionnerInstanceCb = useCallback(instanceId=>{
        if(instanceId.currentTarget) instanceId = instanceId.currentTarget.value
        setInstanceSelectionnee(instanceId)
    }, [setInstanceSelectionnee])

    const attenteCb = useCallback(attente=>setAttente(attente?true:false), [setAttente])
    const confirmationCb = useCallback(confirmation=>{
        attenteCb(false)
        setConfirmation(confirmation)
    }, [attenteCb, setConfirmation])

    useEffect(()=>{
        if(etatConnexion) {
            console.debug("Requete topologie instances")
            
            const cb = comlinkProxy(setEvenementRecu)
            connexion.enregistrerCallbackEvenementsNoeuds(cb)
                .catch(err=>console.error("Erreur enregistrement evenements instances : %O", err))

            // Charger (recharger) instances
            chargerListeInstances(connexion, setInstancesParId)
                .catch(err=>console.error("Erreur chargement liste noeuds : %O", err))
    
            // Cleanup
            return () => {
                connexion.retirerCallbackEvenementsNoeuds(cb)
                    .catch(err=>console.warn("Erreur retrait evenements instances : %O", err))
            }
        }
    }, [connexion, etatConnexion, setEvenementRecu])

    let Page = PageAccueil, instance = null
    // Afficher l'instance selectionnee (si applicable)
    if(instanceSelectionnee) {
        console.debug("Instance selectionnee : %s", instanceSelectionnee)
        Page = AfficherInstanceDetail
        instance = instancesParId[instanceSelectionnee]
    }

    // Afficher la liste des instances
    return (
        <>
            <ModalAttente show={attente} setAttente={setAttente} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <AjouterInstanceModal
                show={showAssocier}
                fermer={()=>setShowAssocier(false)}
                workers={workers} />

            <Page
                workers={workers} 
                etatConnexion={etatConnexion}
                idmg={idmg}
                instancesParId={instancesParId}
                selectionnerInstanceCb={selectionnerInstanceCb}
                setShowAssocier={setShowAssocier}
                instance={instance} 
                confirmationCb={confirmationCb}
                attenteCb={attenteCb}
                fermer={()=>setInstanceSelectionnee('')} />
        </>
    )
    
}

export default Instances

function PageAccueil(props) {

    const {workers, instancesParId, selectionnerInstanceCb, setShowAssocier} = props

    return (
        <>
            <h1>Instances</h1>

            <h2>Instance Protegee</h2>
            <InstanceProtegee 
                workers={workers} 
                instances={instancesParId} 
                selectionnerInstance={selectionnerInstanceCb} />

            <h2>Instances satellite</h2>

            <Row>
                <Col md={9}>Associer une nouvelle instance</Col>
                <Col>
                    <Button variant="secondary" onClick={()=>setShowAssocier(true)}>Associer</Button>
                </Col>
            </Row>

            <h3>Satellites secures</h3>
            <ListeInstances 
                workers={workers} 
                instances={instancesParId} 
                securite="4.secure" 
                selectionnerInstance={selectionnerInstanceCb} />

            <h3>Satellites prives</h3>
            <ListeInstances 
                workers={workers} 
                instances={instancesParId} 
                securite="2.prive" 
                selectionnerInstance={selectionnerInstanceCb} />

            <h3>Satellites publics</h3>
            <ListeInstances 
                workers={workers} 
                instances={instancesParId} 
                securite="1.public" 
                selectionnerInstance={selectionnerInstanceCb} />
        </>
    )
}

function InstanceProtegee(props) {

    const { instances, selectionnerInstance } = props
    if(!instances) return <p>Aucune instance protegee</p>
    const instance = Object.values(instances).filter(item=>item.securite === '3.protege').pop()

    const instanceId = instance.noeud_id

    return (
        <InstanceItem key={instance.noeud_id} instance={instance} selectionnerInstance={selectionnerInstance} />
    )
}

function ListeInstances(props) {
    const { instances, securite, selectionnerInstance } = props

    const [liste, setListe] = useState('')

    useEffect(()=>{
        console.debug("Traiter instances : %O", instances)
        const liste = Object.values(instances).filter(item=>item.securite === securite)
        if(liste.length > 0) {
            trierNoeuds(liste)
            setListe(liste)
        } else {
            setListe('')
        }
    }, [instances, setListe])

    if(!liste) return <p>Aucunes instances</p>

    console.debug("Liste instances %s : %O", securite, liste)

    return liste.map(instance=>(
        <InstanceItem key={instance.noeud_id} instance={instance} selectionnerInstance={selectionnerInstance} />
    ))
}

function InstanceItem(props) {
    const {instance, selectionnerInstance} = props,
          {descriptif, date} = instance,
          instanceId = instance.noeud_id

    const nomNoeud = descriptif || instance.domaine || instanceId

    return (
        <Row key={instanceId}>
            <Col md={6}>{nomNoeud}</Col>
            <Col md={3}>
                <FormatterDate value={date} />
            </Col>
            <Col>
                <Button variant="secondary" onClick={selectionnerInstance} value={instanceId}>Configurer</Button>
            </Col>
        </Row>
    )
}

// Charge la liste courante des noeuds
async function chargerListeInstances(connexion, setInstancesParNoeudId, setProtege, setPrives, setPublics) {
    var reponseInstances = await connexion.requeteListeNoeuds({})
    console.debug("Reponse instances : %O", reponseInstances)
  
    if(!reponseInstances) reponseInstances = []
  
    let instances = reponseInstances.map(instance=>{
        const instanceId = instance.noeud_id
        let derniereModification = ''
        try {
            derniereModification = new Date(Number(instance.date_presence))
        } catch(err) {
            console.warn("chargerListeInstances Derniere modification absente de l'instance : %s", instanceId)
        }
        const infoNoeud = mapperNoeud(instance, derniereModification)
        return infoNoeud
    })

    const instancesParNoeudId = instances.reduce((acc, item)=>{
        acc[item.noeud_id] = item
        return acc
    }, {})
  
    setInstancesParNoeudId(instancesParNoeudId)
}

function trierNoeuds(noeuds) {
    noeuds.sort((a,b)=>{
        if(a === b) return 0
        if(!a || !a.descriptif) return -1
        if(!b || !b.descriptif) return 1
        if(a.descriptif === 'Principal') return -1
        if(b.descriptif === 'Principal') return 1
        return a.descriptif.localeCompare(b.descriptif)
    })
}

function mapperNoeud(noeudInfo, derniereModification) {
    // console.debug("NOEUD RECU : %O", noeudInfo)
  
    var actif = true
    const epochCourant = new Date().getTime() / 1000
    if(epochCourant > derniereModification + 60) {
      actif = false
    }
  
    var principal = false
    var securite = noeudInfo.securite
    if(!noeudInfo.parent_noeud_id && securite === '3.protege') {
      principal = true
    }
  
    var descriptif = noeudInfo.domaine || noeudInfo.noeud_id
  
    const mappingNoeud = {
      descriptif,
      actif,
      securite,
      principal,
      parent_noeud_id: noeudInfo.parent_noeud_id,
      noeud_id: noeudInfo.noeud_id,
      ip_detectee: noeudInfo.ip_detectee,
      fqdn: noeudInfo.fqdn_detecte,
      date: derniereModification,
      domaine: noeudInfo.domaine,
    }
  
    const champsOptionnels = ['services', 'containers', 'consignation_web', 'applications_configurees']
    champsOptionnels.forEach(champ=>{
      if(noeudInfo[champ]) mappingNoeud[champ] = noeudInfo[champ]
    })
  
    return mappingNoeud
}

function traiterMessageRecu(message, instancesParId, setInstancesParId) {
    console.debug("processMessageNoeudsCb recu : %O", message)

    const instanceId = message.noeud_id
    const derniereModification = message['en-tete'].estampille
    const instance = mapperNoeud(message, derniereModification)
    
    const copieInstances = {...instancesParId, [instanceId]: instance}
    setInstancesParId(copieInstances)
}

function AjouterInstanceModal(props) {

    const workers = props.workers

    const [hostname, setHostname] = useState('')
    const [instance, setInstance] = useState('')
    const [csr, setCsr] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const setHostnameCb = useCallback(event=>setHostname(event.currentTarget.value), [setHostname])

    const erreurCb = useCallback(
        (err, message) => { 
            console.debug("Set erreurs %O, %s", err, message)
            setError(err)
            if(message) setErrorMessage(message)
            else setErrorMessage(''+err)
        }, 
        [setError, setErrorMessage]
    )

    const connecterCb = useCallback(()=>{
        connecter(hostname, setInstance, setCsr, erreurCb)
            .catch(err=>console.warn("Erreur traitement : %O", err))
    }, [hostname, setInstance, setCsr, erreurCb])

    return (
        <Modal size="lg" show={props.show} onHide={props.fermer}>
            <Modal.Header closeButton>
                <Modal.Title>Associer une instance</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <AlertTimeout 
                    variant="danger" delay={false} 
                    message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
                <Row>
                <Col>
                    <label htmlFor="hostname-instance">Hostname pour se connecter a l'instance</label>
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="hostname-instance-text">
                            https://
                        </InputGroup.Text>
                        <FormControl 
                            id="hostname-instance" aria-describedby="hostname-instance-text"
                            value={hostname}
                            onChange={setHostnameCb}
                            placeholder="www.hostname.com" />
                    </InputGroup>
                </Col>
                </Row>

                <Row>
                    <Col>
                        <Button onClick={connecterCb}>Connecter</Button>
                    </Col>
                </Row>

                <InformationNoeud
                    workers={workers}
                    hostname={hostname}
                    instance={instance}
                    csr={csr}
                    prendrePossession={prendrePossession} />

            </Modal.Body>

        </Modal>
    )
}

async function connecter(hostname, setInstance, setCsr, erreurCb) {
    try {
        const pathInfoMonitor = new URL('https://localhost/installation/api/infoMonitor')
        pathInfoMonitor.hostname = hostname

        try {
            const reponseInfoMonitor = await axios.get(pathInfoMonitor.href)
            console.debug("Reponse info monitor : %O", reponseInfoMonitor)

            const instance = reponseInfoMonitor.data
            setInstance(instance)

            if( ! instance.certificat ) {
                const urlCsr = new URL(pathInfoMonitor.href)
                urlCsr.pathname = '/installation/api/csr'
                try {
                    const reponseCsr = await axios.get(urlCsr.href)
                    console.debug("Reponse CSR : %O", reponseCsr)
                    setCsr(reponseCsr.data)
                } catch(err) {
                    erreurCb(`Erreur access URL ${urlCsr.href}`)
                }
            }
        } catch (err) {
            erreurCb(`Erreur access URL ${pathInfoMonitor.href}`)
        }
    } catch(err) {
        erreurCb(err, "Erreur de connexion")
    }
}

function InformationNoeud(props) {

    const instance = props.instance,
          securite = instance.securite,
          workers = props.workers,
          csr = props.csr,
          hostname = props.hostname

    const [hostMq, setHostMq] = useState('')
    const [portMq, setPortMq] = useState('5673')

    const setHostMqCb = useCallback(event=>setHostMq(event.currentTarget.value), [setHostMq])
    const setPortMqCb = useCallback(event=>setPortMq(event.currentTarget.value), [setPortMq])

    const prendrePossessionCb = useCallback(()=>{
        prendrePossession(workers, csr, securite, hostname, hostMq, portMq)
    }, [workers, csr, securite, hostname, hostMq, portMq])

    useEffect(()=>{
        const urlLocal = window.location.host
        setHostMq(urlLocal)
    }, [setHostMq])

    if(!instance) return ''

    return (
      <>
        <hr />

        <Row>
          <Col sm={2}>IDMG</Col>
          <Col sm={10}>{instance.idmg}</Col>
        </Row>

        {instance.domaine?
            <Row>
            <Col sm={2}>Domaine</Col>
            <Col sm={10}>{instance.domaine}</Col>
            </Row>
        :''}

        <Row>
          <Col sm={2}>Securite</Col>
          <Col sm={10}>{instance.securite}</Col>
        </Row>

        <Row>
          <Col sm={2}>ID</Col>
          <Col sm={10}>{instance.noeud_id}</Col>
        </Row>
  
        <Alert show={props.certificat?true:false} variant="warning">Le noeud est deja initialise avec un certificat</Alert>

        <label htmlFor="hostmq">Configuration de la connexion MQ</label>
        <Row>
            <Col md={8}>
                <InputGroup>
                <InputGroup.Text id="hostmq">
                    Host
                </InputGroup.Text>
                <FormControl id="hostmq"
                                aria-describedby="hostmq"
                                name="host"
                                value={hostMq}
                                onChange={setHostMqCb} />
                </InputGroup>
            </Col>

            <Col md={4}>
                <InputGroup>
                <InputGroup.Text id="portmq">
                    Port
                </InputGroup.Text>
                <FormControl id="portmq"
                                aria-describedby="portmq"
                                name="port"
                                value={portMq}
                                onChange={setPortMqCb} />
                </InputGroup>
            </Col>
        </Row>

        {csr?
            <Button onClick={prendrePossessionCb}>Prendre possession</Button>
        :''}
  
      </>
    )
  }
  
  async function prendrePossession(workers, csr, securite, hostname, hostMq, portMq) {
  
    console.debug("Demander la creation d'un nouveau certificat %s pour %s (MQ %s:%s)", securite, hostname, hostMq, portMq)
  
    const connexion = workers.connexion
    const urlInstaller = new URL('https://localhost/installation/api/installer')
    urlInstaller.hostname = hostname

    let role = 'public'
    if(securite === '1.public') role = 'public'
    else if(securite === '2.prive') role = 'prive'
    else if(securite === '3.protege') role = 'protege'
  
    const commande = {csr, securite, role}
  
    const resultatCertificat = await connexion.genererCertificatNoeud(commande)
  
    if(resultatCertificat) {
        console.debug("prendrePossession Reception info certificat : %O", resultatCertificat)
    
        const paramsInstallation = {
            certificat: resultatCertificat.certificat,
            securite,
            role,
            host: hostMq,
            port: portMq,
        }
    
        console.debug("Transmettre parametres installation noeud : %O", paramsInstallation)
    
        const reponse = await axios({
            url: urlInstaller.href,
            method: 'post',
            data: paramsInstallation,
            timeout: 15000,
        })
        console.debug("Recu reponse demarrage installation noeud\n%O", reponse)
  
    } else {
        throw new Error("Erreur : echec creation certificat")
    }
  
  }
  