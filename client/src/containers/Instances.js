import { useEffect, useState, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from 'react-redux'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'

import axios from 'axios'

import { AlertTimeout, ModalAttente, FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, { useUsager, useEtatPret, useEtatConnexion } from '../WorkerContext'

import AfficherInstanceDetail from './InstanceDetail'
import { Modal } from "react-bootstrap"
import { useTranslation } from "react-i18next"

function Instances(props) {

    const workers = useWorkers(),
          etatConnexion = useEtatConnexion(),
          etatPret = useEtatPret(),
          usager = useUsager()

    const instances = useSelector(state=>state.instances.listeInstances)

    const [instanceSelectionnee, setInstanceSelectionnee] = useState('')
    const [showAssocier, setShowAssocier] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [attente, setAttente] = useState(false)
    
    const selectionnerInstanceCb = useCallback(instanceId=>{
        if(instanceId.currentTarget) instanceId = instanceId.currentTarget.value
        setInstanceSelectionnee(instanceId)
    }, [setInstanceSelectionnee])

    const attenteCb = useCallback(attente=>setAttente(attente?true:false), [setAttente])
    const confirmationCb = useCallback(confirmation=>{
        attenteCb(false)
        setConfirmation(confirmation)
    }, [attenteCb, setConfirmation])

    const instance = useMemo(()=>{
        // console.debug("Instances ", instances)
        if(!instanceSelectionnee) return
        return instances.filter(item=>item.instance_id === instanceSelectionnee).pop()
    }, [instances, instanceSelectionnee])

    let Page = PageAccueil
    if(instance) {
        Page = AfficherInstanceDetail
    }

    // Afficher la liste des instances
    return (
        <>
            <ModalAttente show={attente} setAttente={setAttente} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <AjouterInstanceModal
                show={showAssocier}
                fermer={()=>setShowAssocier(false)}
                workers={workers} 
                usager={usager}
                etatAuthentifie={etatPret}
                confirmationCb={confirmationCb} />

            <Page
                workers={workers} 
                etatConnexion={etatConnexion}
                etatAuthentifie={etatPret}
                usager={usager}
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

    const {selectionnerInstanceCb, setShowAssocier} = props

    const { t } = useTranslation()

    const [dateExpiree, setDateExpiree] = useState('')  // Epoch (secs)

    // Creer interval pour mettre a jour la date d'expiration des instances
    useEffect(()=>{
        const setDate = () => {
            const dateExpiree = Math.floor( (new Date().getTime() - 300_000) / 1_000 )
            setDateExpiree(dateExpiree)
        }
        setDate()  // Premier set

        // Declencher interval d'update
        const intervalUpdateExpire = setInterval(setDate, 10_000)
        // Cleanup interval
        return () => clearInterval(intervalUpdateExpire)
    }, [setDateExpiree])

    return (
        <>
            <h1>{t('Instances.titre')}</h1>

            <h2>{t('Instances.titre-instance-protegee')}</h2>
            <InstanceProtegee selectionnerInstance={selectionnerInstanceCb} dateExpiree={dateExpiree} />

            <h2>{t('Instances.titre-satellites')}</h2>

            <Row>
                <Col md={9}>{t('Instances.titre-associer')}</Col>
                <Col>
                    <Button variant="secondary" onClick={()=>setShowAssocier(true)}>{t('Instances.bouton-associer')}</Button>
                </Col>
            </Row>

            <h3>{t('Instances.titre-satellites-secures')}</h3>

            <ListeInstances 
                securite="4.secure" 
                selectionnerInstance={selectionnerInstanceCb} 
                dateExpiree={dateExpiree} />

            <h3>{t('Instances.titre-satellites-prives')}</h3>
            <ListeInstances 
                securite="2.prive" 
                selectionnerInstance={selectionnerInstanceCb}
                dateExpiree={dateExpiree} />

            <h3>{t('Instances.titre-satellites-publics')}</h3>
            <ListeInstances 
                securite="1.public" 
                selectionnerInstance={selectionnerInstanceCb}
                dateExpiree={dateExpiree} />
        </>
    )
}

function InstanceProtegee(props) {

    const { selectionnerInstance, dateExpiree } = props

    const instances = useSelector(state=>state.instances.listeInstances)
    const instanceProtege = useMemo(()=>{
        if(!instances) return ''
        return instances.filter(item=>item.securite === '3.protege').pop()
    }, [instances])

    if(!instanceProtege) return <p>Aucune instance protegee</p>

    //console.debug("Instances : %O", instancesList)

    return (
        <InstanceItem 
            key={instanceProtege.instance_id} 
            instance={instanceProtege} 
            selectionnerInstance={selectionnerInstance} 
            dateExpiree={dateExpiree} />
    )
}

function ListeInstances(props) {
    const { securite, selectionnerInstance, dateExpiree } = props

    // const [liste, setListe] = useState('')

    const instances = useSelector(state=>state.instances.listeInstances)
    const liste = useMemo(()=>{
        if(!instances) return ''
        return instances.filter(item=>item.securite === securite)
    }, [instances, securite])

    if(!liste) return <p>Chargement en cours</p>
    if(liste.length === 0) return <p>Aucunes instances</p>

    return liste.map(instance=>(
        <InstanceItem key={instance.instance_id} 
            instance={instance} 
            selectionnerInstance={selectionnerInstance} 
            dateExpiree={dateExpiree} />
    ))
}

function InstanceItem(props) {
    const {instance, selectionnerInstance, dateExpiree} = props,
          {descriptif, date_presence} = instance,
          instanceId = instance.instance_id

    const nomNoeud = descriptif || instance.hostname || instance.domaine || instanceId

    const expireeCss = useMemo(()=>{
        if(!dateExpiree) return 'date-chargement'
        if(date_presence < dateExpiree) return 'date-expire'
        return 'date-actif'
    }, [date_presence, dateExpiree])

    return (
        <Row key={instanceId}>
            <Col md={6}>{nomNoeud}</Col>
            <Col md={3} className={expireeCss}>
                <FormatterDate value={date_presence} />
            </Col>
            <Col>
                <Button variant="secondary" onClick={selectionnerInstance} value={instanceId}>Configurer</Button>
            </Col>
        </Row>
    )
}

function AjouterInstanceModal(props) {

    const { workers, usager, etatAuthentifie, confirmationCb, fermer } = props

    const [hostname, setHostname] = useState('')
    const [instance, setInstance] = useState('')
    const [csr, setCsr] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const setHostnameCb = useCallback(event=>setHostname(event.currentTarget.value), [setHostname])

    const erreurCb = useCallback(
        (err, message) => { 
            //console.debug("Set erreurs %O, %s", err, message)
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
                    usager={usager}
                    csr={csr}
                    prendrePossession={prendrePossession} 
                    confirmationCb={confirmationCb}
                    erreurCb={erreurCb} 
                    fermer={fermer} 
                    etatAuthentifie={etatAuthentifie} />

            </Modal.Body>

        </Modal>
    )
}

async function connecter(hostname, setInstance, setCsr, erreurCb) {
    try {
        const pathInfoMonitor = new URL('https://localhost/installation/api/info')
        pathInfoMonitor.hostname = hostname

        try {
            const reponseInfoMonitor = await axios.get(pathInfoMonitor.href)
            //console.debug("Reponse info monitor : %O", reponseInfoMonitor)

            const instance = reponseInfoMonitor.data
            setInstance(instance)

            if( ! instance.certificat ) {
                const urlCsr = new URL(pathInfoMonitor.href)
                urlCsr.pathname = '/installation/api/csrInstance'
                try {
                    const reponseCsr = await axios.get(urlCsr.href)
                    //console.debug("Reponse CSR : %O", reponseCsr)
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
    //console.debug("InformationNoeud proppies : %O", props)

    const {workers, usager, csr, hostname, instance, confirmationCb, erreurCb, fermer, etatAuthentifie} = props,
          securite = instance.securite

    const [hostMq, setHostMq] = useState('')
    const [portMq, setPortMq] = useState('5673')

    const setHostMqCb = useCallback(event=>setHostMq(event.currentTarget.value), [setHostMq])
    const setPortMqCb = useCallback(event=>setPortMq(event.currentTarget.value), [setPortMq])

    const prendrePossessionCb = useCallback(()=>{
        prendrePossession(workers, usager, csr, securite, hostname, hostMq, portMq, confirmationCb, erreurCb)
            .then(()=>fermer())
            .catch(err=>erreurCb(err))
    }, [workers, usager, csr, securite, hostname, hostMq, portMq, confirmationCb, erreurCb, fermer])

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
          <Col sm={10}>{instance.instance_id}</Col>
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
            <Button onClick={prendrePossessionCb} disabled={!etatAuthentifie}>Prendre possession</Button>
        :''}
  
      </>
    )
  }
  
  async function prendrePossession(workers, usager, csr, securite, hostname, hostMq, portMq, confirmationCb, erreurCb) {
  
    try {
        // console.debug("Demander la creation d'un nouveau certificat %s pour %s (MQ %s:%s)", securite, hostname, hostMq, portMq)
    
        const connexion = workers.connexion
        const urlInstaller = new URL('https://localhost/installation/api/installer')
        urlInstaller.hostname = hostname

        let role = 'public'
        let exchanges = ['1.public']
        if(securite === '1.public') role = 'public'
        else if(securite === '2.prive') {
            role = 'prive'
            exchanges.push('2.prive')
        }
        else if(securite === '3.protege') {
            exchanges.push('2.prive')
            exchanges.push('3.protege')
            role = 'protege'
        }
        exchanges = exchanges.reverse()
        
        const hostnames = [hostname]
        const hostnameNoDomain = hostname.split('.').shift()
        if(hostnameNoDomain != hostname) {
            hostnames.push(hostnameNoDomain)
        }

        const commande = {csr, securite, role, roles: ['instance'], exchanges, dns: {localhost: true, hostnames}}
    
        try {
            var resultatCertificat = await connexion.genererCertificatNoeud(commande)
        } catch(err) {
            console.error("Erreur creation certificat ", err);
            erreurCb(err, 'Erreur creation certificat')
            return
        }
    
        //console.debug("prendrePossession Reception info certificat : %O", resultatCertificat)
        if(!resultatCertificat.certificat) {
            erreurCb(null, "Erreur creation certificat pour prise de possession - non genere")
            return
        }

        const paramsInstallation = {
            hostname,
            certificat: resultatCertificat.certificat,
            certificatMillegrille: usager.ca,
            securite,
            host: hostMq,
            port: portMq,
        }
    
        //console.debug("Transmettre parametres installation noeud : %O", paramsInstallation)
    
        try {
            const reponse = await axios({
                url: urlInstaller.href,
                method: 'post',
                data: paramsInstallation,
                timeout: 15000,
            })
            //console.debug("Recu reponse demarrage installation noeud\n%O", reponse)
            const data = reponse.data || {}
            if(data.err) {
                erreurCb(data.err)
            } else {
                confirmationCb(`Prise de possession de ${hostname} reussie.`)
            }
        } catch(err) {
            erreurCb(err, `Erreur prise de possession de l'instance`)
            return
        }
    
    } catch(err) {
        erreurCb(err)
    }
}
