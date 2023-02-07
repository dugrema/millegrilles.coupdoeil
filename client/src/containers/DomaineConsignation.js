import React, {useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { proxy } from 'comlink'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Alert from 'react-bootstrap/Alert'

import { AlertTimeout, ModalAttente, FormatteurTaille, FormatterDate } from '@dugrema/millegrilles.reactjs'
import { pki as forgePki } from '@dugrema/node-forge'

import useWorkers, { useEtatPret } from '../WorkerContext'

import { push as pushConsignation, merge as mergeConsignation, verifierExpiration, setConsignationPrimaire } from '../redux/consignationSlice'

const CONST_CONSIGNATION_URL = 'https://fichiers:444'

// Note: Look behind (?<!) pas supporte sur Safari (iOS)
// RE_DOMAINE = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
//const RE_DOMAINE = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/

function ConfigurationConsignation(props) {

    const { fermer } = props

    const { t } = useTranslation()
    const dispatch = useDispatch(),
          workers = useWorkers(),
          etatPret = useEtatPret()

    const liste = useSelector(state=>state.consignation.liste)
    // const [liste, setListe] = useState('')
    const [attente, setAttente] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [instanceId, setInstanceId] = useState('')

    const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )

    const setInstanceIdHandler = useCallback( event => setInstanceId(event.currentTarget.value), [setInstanceId])
    const resetInstanceIdHandler = useCallback( event => setInstanceId(''), [setInstanceId])

    const messageConsignationHandler = useCallback(reponse=>{
        console.debug("messageConsignationHandler Reponse ", reponse)
        // Extraire instanceId du certificat de l'evenement
        const entete = reponse.message['en-tete']
        const action = entete.action
        if(action === 'presence') {
            const certificat = forgePki.certificateFromPem(reponse.message['_certificat'][0])
            const instance_id = certificat.subject.getField('CN').value
            const info = { ...reponse.message, instance_id, derniere_modification: entete.estampille }
            console.debug("Info evenement consignation ", info)
            dispatch(mergeConsignation(info))
        } else if(action === 'changementConsignationPrimaire') {
            dispatch(setConsignationPrimaire(reponse.message.instance_id))
        }
    }, [dispatch])

    const messageConsignationHandlerProxy = useMemo(()=>proxy(messageConsignationHandler), [messageConsignationHandler])

    const erreurCb = useCallback(
        (err, message) => { 
            console.debug("Set erreurs %O, %s", err, message)
            setError(err, message)
            setAttente(false)  // Reset attente
        }, 
        [setError, setAttente]
    )

    useEffect(()=>{
        if(!etatPret) return
        const { connexion } = workers
        connexion.getConfigurationFichiers()
            .then(reponse=>{
                console.debug("Liste consignations recue ", reponse)
                dispatch(pushConsignation({liste: reponse.liste, clear: true}))
            })
            .catch(err=>setError(''+err))

        // Enregistrer event listeners
        const intervalRefreshExpire = setInterval(()=>dispatch(verifierExpiration()), 20_000)
        connexion.enregistrerCallbackEvenementsConsignation(messageConsignationHandlerProxy)
            .catch(err=>console.error("Erreur enregistrement evenements consignation ", err))
        
        return () => {
            clearInterval(intervalRefreshExpire)
            connexion.retirerCallbackEvenementsConsignation(messageConsignationHandlerProxy)
                .catch(err=>console.error("Erreur retrait evenements consignation ", err))
        }

    }, [dispatch, workers, etatPret, setError, messageConsignationHandlerProxy])

    if(instanceId) return (
        <>
            <AlertTimeout variant="danger" titre="Erreur" delay={false} value={error} setValue={setError} />
            <ModalAttente show={attente} setAttente={setAttente} />
            <ConfigurerConsignationInstance
                instanceId={instanceId}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb}
                fermer={resetInstanceIdHandler} />
        </>
    )

    return (
        <>
            <Row>
                <Col xs={10} md={11}>
                    <h2>{t('DomaineConsignation.titre')}</h2>
                </Col>
                <Col xs={2} md={1} className="bouton">
                    <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
                </Col>
            </Row>

            <AlertTimeout variant="danger" titre="Erreur" delay={false} value={error} setValue={setError} />
            <AlertTimeout value={confirmation} setValue={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />

            <ListeConsignations 
                liste={liste} 
                onSelect={setInstanceIdHandler} />
        </>
    )
}

export default ConfigurationConsignation

function ListeConsignations(props) {
    const { liste, onSelect, erreurCb } = props

    const workers = useWorkers()

    const instances = useSelector(state=>state.instances.listeInstances)

    const instancesParId = useMemo(()=>{
        if(!instances) return ''
        const instancesParId = {}
        instances.forEach(item=>{
            instancesParId[item.instance_id] = item
        })
        return instancesParId
    }, [instances])

    const changerPrimaireHandler = useCallback(e=>{
        const instance_id = e.currentTarget.value
        console.debug("Changer instance primaire pour ", instance_id)
        const commande = { instance_id }
        workers.connexion.setFichiersPrimaire(commande)
            .then(()=>{
                console.debug("Fichiers primaire change pour ", instance_id)
            })
            .catch(erreurCb)
    }, [workers])

    if(!liste) return 'Chargement encours'
    if(liste.length === 0) return 'Aucune consignation de fichiers presente'

    const epochNow = new Date().getTime() / 1000;

    const listeFichiers = liste.map(item=>{

        const instance = instancesParId[item.instance_id] || ''
        const nom = instance.domaine || item.instance_id
        const primaire = item.primaire?true:false
        const derniereModification = item.derniere_modification,
              secsDepuisModif = epochNow - derniereModification

        let classNameExpiration = ''
        if(secsDepuisModif > 1800) classNameExpiration = 'expire-long'
        else if(secsDepuisModif > 300) classNameExpiration = 'expire-court'

        return (
            <Row key={item.instance_id} className={primaire?'primaire':''}>
                <Col xs={9} lg={4} className='nom-consignation'>
                    <Button variant="link" onClick={onSelect} value={item.instance_id}>{nom}</Button>
                </Col>
                <Col xs={3} lg={2} className='champ-primaire'>
                    <AfficherChampRole onClick={changerPrimaireHandler} item={item} />
                </Col>
                <Col xs={6} lg={3} className={classNameExpiration}><FormatterDate value={item.derniere_modification} /></Col>
                <Col xs={3} lg={2}><FormatteurTaille value={item.fichiers_taille} /></Col>
                <Col xs={3} lg={1}>{item.fichiers_nombre}</Col>
            </Row>
        )
    })

    return (
        <div>
            <Row>
                <Col lg={4} className='d-none d-lg-block'>Serveur</Col>
                <Col lg={2} className='d-none d-lg-block'></Col>
                <Col lg={3} className='d-none d-lg-block'>Derniere presence</Col>
                <Col lg={2} className='d-none d-lg-block'>Taille</Col>
                <Col lg={1} className='d-none d-lg-block'>Fichiers</Col>
            </Row>
            {listeFichiers}
        </div>
    )
}

function AfficherChampRole(props) {
    const { item, onClick } = props
    const primaire = item.primaire?true:false
    
    if(primaire === true) {
        return (
            <span>Primaire</span>
        )
    }

    return (
        <Button variant='link' onClick={onClick} value={item.instance_id}>Secondaire</Button>
    )
}


function ConfigurerConsignationInstance(props) {

    const { instanceId, confirmationCb, erreurCb, fermer } = props

    const { t } = useTranslation()
    const dispatch = useDispatch(),
          workers = useWorkers(),
          etatPret = useEtatPret()

    const listeConsignation = useSelector(state=>state.consignation.liste),
          instances = useSelector(state=>state.instances.listeInstances)
    // const [consignation, setConsignation] = useState('')
    const instance = useMemo(()=>instances.filter(item=>item.instance_id === instanceId).pop(), [instances, instanceId])

    // const [configuration, setConfiguration] = useState('')
    const [typeStore, setTypeStore] = useState('local')
    const [urlDownload, setUrlDownload] = useState('')
    const [consignationUrl, setConsignationUrl] = useState(CONST_CONSIGNATION_URL)

    // Sftp
    const [hostnameSftp, setHostnameSftp] = useState('')
    const [portSftp, setPortSftp] = useState(22)
    const [usernameSftp, setUsernameSftp] = useState('')
    const [remotePathSftp, setRemotePathSftp] = useState('')
    const [keyTypeSftp, setKeyTypeSftp] = useState('ed25519')

    const appliquerConfiguration = useCallback(()=>{
        const {connexion} = workers
        if(connexion && etatPret) {
            // Preparer nouvelle configuration
            const config = {
                instance_id: instanceId, 
                type_store: typeStore, 
                url_download: urlDownload, 
                consignation_url: consignationUrl, 
                hostname_sftp: hostnameSftp, 
                username_sftp: usernameSftp, 
                remote_path_sftp: remotePathSftp, 
                key_type_sftp: keyTypeSftp,
            }
            if(portSftp) config.portSftp = Number.parseInt(portSftp)

            // Changer fichier de config stocke local
            connexion.modifierConfigurationConsignation(config)
                .then(resultat=>{
                    if(resultat.ok===false) {
                        return erreurCb(resultat.err, "Erreur de sauvegarde de la configuration")
                    }
                    console.debug("Configuration sauvegardee : %O", config)
                    // setConfiguration(config)
                    dispatch(mergeConsignation(config))
                    confirmationCb("Configuration sauvegardee")
                    fermer()
                })
                .catch(err=>erreurCb(err, 'Erreur de sauvegarde de la configuration'))
        } else {
            erreurCb('Erreur de connexion au serveur, veuillez reessayer plus tard')
        }
        
    }, [
        dispatch, workers, erreurCb,
        instanceId,
        etatPret, confirmationCb, fermer,
        typeStore, urlDownload, 
        consignationUrl, 
        hostnameSftp, usernameSftp, remotePathSftp, keyTypeSftp, portSftp,
    ])

    useEffect(()=>{
        if(!instanceId) {
            // setConsignation('')
            return
        }

        const consignation = listeConsignation.filter(item=>item.instance_id === instanceId).pop()
        if(!consignation) return
        // setConsignation(consignation)
        console.debug("ConfigurerConsignationInstance Edit consignation ", consignation)

        setTypeStore(consignation.type_store || 'millegrille')
        setUrlDownload(consignation.url_download || '')
        setConsignationUrl(consignation.consignation_url || CONST_CONSIGNATION_URL)
        setHostnameSftp(consignation.hostname_sftp || '')
        setPortSftp(consignation.port_sftp || '22')
        setUsernameSftp(consignation.username_sftp || '')
        setRemotePathSftp(consignation.remote_path_sftp || '')
        setKeyTypeSftp(consignation.key_type_sftp || 'ed25519')
    }, [
        instanceId, listeConsignation, 
        // setConsignation,
        setTypeStore, setUrlDownload, 
        setConsignationUrl, 
        setHostnameSftp, setPortSftp, setUsernameSftp, setRemotePathSftp, setKeyTypeSftp,
    ])

    if(!instanceId) return ''

    return (
        <div>
            <Row>
                <Col xs={10} md={11}>
                    <h2>{t('DomaineConsignation.titre')}</h2>
                </Col>
                <Col xs={2} md={1} className="bouton">
                    <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
                </Col>
            </Row>

            <h3>{instance.domaine}</h3>

            <p>Cette page permet de modifier la configuration de consignation des fichiers pour l'instance.</p>

            <Form onSubmit={formSubmit}>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>URL d'acces public aux fichiers (optionnel pour local)</Form.Label>
                        <FormControl id="urlDownload" aria-describedby="urlDownload"
                                placeholder="exemple : https://cloudfront.amazon.com/abcd1234"
                                value={urlDownload}
                                onChange={event=>setUrlDownload(event.currentTarget.value)} />
                    </Form.Group>
                </Row>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>URL instance MilleGrille</Form.Label>
                        <FormControl id="consignationUrl" aria-describedby="consignationUrl"
                            placeholder="exemple : https://fichiers:444, https://millegrilles.com:444"
                            value={consignationUrl}
                            onChange={event=>setConsignationUrl(event.currentTarget.value)} />
                    </Form.Group>
                </Row>

                <br/>

                <Tabs activeKey={typeStore} onSelect={setTypeStore}>
                    <Tab eventKey="millegrille" title="MilleGrille">
                        <TabMilleGrille 
                            etatAuthentifie={etatPret} 
                            appliquerConfiguration={appliquerConfiguration} 
                            consignationUrl={consignationUrl}
                            setConsignationUrl={setConsignationUrl} />
                    </Tab>
                    <Tab eventKey="sftp" title="sftp">
                        <TabSftp 
                            workers={workers}
                            etatAuthentifie={etatPret}
                            appliquerConfiguration={appliquerConfiguration} 
                            erreurCb={erreurCb}
                            hostnameSftp={hostnameSftp} 
                            setHostnameSftp={setHostnameSftp}
                            portSftp={portSftp}
                            setPortSftp={setPortSftp} 
                            usernameSftp={usernameSftp}
                            setUsernameSftp={setUsernameSftp} 
                            remotePathSftp={remotePathSftp}
                            setRemotePathSftp={setRemotePathSftp}
                            keyTypeSftp={keyTypeSftp} 
                            setKeyTypeSftp={setKeyTypeSftp} />
                    </Tab>
                </Tabs>
            </Form>
        </div>
    )
    
}

function formSubmit(event) {
    event.preventDefault()
    event.stopPropagation()
    console.debug("Form submit")
}

function TabMilleGrille(props) {

    const { appliquerConfiguration, etatAuthentifie } = props

    return (
        <div>
            <h2>Consignation MilleGrille</h2>

            <p>Les fichiers sont stockes sur une instance de MilleGrille.</p>

            <Button disabled={!etatAuthentifie} onClick={appliquerConfiguration}>Sauvegarder</Button>
        </div>
    )
}

function TabSftp(props) {

    const { 
        workers, etatAuthentifie, appliquerConfiguration, erreurCb,
        hostnameSftp, setHostnameSftp, portSftp, setPortSftp, usernameSftp, setUsernameSftp,
        remotePathSftp, setRemotePathSftp, keyTypeSftp, setKeyTypeSftp,
    } = props

    const changeKeyType = useCallback(event=>setKeyTypeSftp(event.currentTarget.value), [setKeyTypeSftp])

    const [cleSsh, setCleSsh] = useState('')
    const [infoCles, setInfoCles] = useState('')

    useEffect(()=>{
        const {connexion} = workers
        if(connexion && etatAuthentifie) {
            connexion.getPublicKeySsh()
                .then(setInfoCles)
                .catch(err=>erreurCb(err, 'Erreur chargement cles ssh'))
        }
    }, [workers, etatAuthentifie, setInfoCles, erreurCb])

    useEffect(()=>{
        if(infoCles && keyTypeSftp) {
            if(keyTypeSftp === 'ed25519') setCleSsh(infoCles.clePubliqueEd25519)
            else if(keyTypeSftp === 'rsa') setCleSsh(infoCles.clePubliqueRsa)
            else setCleSsh('')
        }
    }, [infoCles, setCleSsh, keyTypeSftp])

    return (
        <div>
            <h2>Consignation via sftp</h2>

            <p>Les fichiers sont stockes sur un serveur tiers. Le contenu est transmis avec sftp.</p>

            <p>Le serveur tiers doit exposer les fichiers avec un serveur web statique et les directives CORS.</p>

            <h3>Parametres du serveur sftp</h3>
            <Row>
                <Form.Group as={Col} xs={12} md={6}>
                    <Form.Label>Hostname</Form.Label>
                    <FormControl id="hostsftp" aria-describedby="hostsftp"
                        placeholder="exemple : serveur.domain.com"
                        value={hostnameSftp}
                        onChange={event=>setHostnameSftp(event.currentTarget.value)} />
                </Form.Group>
                <Form.Group as={Col} xs={6} md={2}>
                    <Form.Label>Port</Form.Label>
                    <FormControl id="portsftp" aria-describedby="portsftp"
                        placeholder="exemple : 22"
                        value={portSftp}
                        onChange={event=>setPortSftp(event.currentTarget.value)} />
                </Form.Group>
                <Form.Group as={Col} xs={6} md={4}>
                    <Form.Label>Username</Form.Label>
                    <FormControl id="usernameSftp" aria-describedby="usernameSftp"
                        placeholder="exemple : bobby"
                        value={usernameSftp}
                        onChange={event=>setUsernameSftp(event.currentTarget.value)} />
                </Form.Group>
            </Row>

            <Row>
                <Form.Group as={Col}>
                    <Form.Label>Remote path</Form.Label>
                    <FormControl id="remotePathSftp" aria-describedby="remotePathSftp"
                        placeholder="exemple : /usr/share/lib/nginx"
                        value={remotePathSftp}
                        onChange={event=>setRemotePathSftp(event.currentTarget.value)} />
                </Form.Group>
            </Row>

            <Row>
                <Form.Group as={Col}>
                    <Form.Label>Type de cle ssh</Form.Label>
                    <Form.Check type='radio' onChange={changeKeyType}
                        id='sftp-ed25519' label='ed25519' value='ed25519' checked={keyTypeSftp==='ed25519'} />
                    <Form.Check type='radio' onChange={changeKeyType}
                        id='sftp-rsa' label='rsa' value='rsa' checked={keyTypeSftp==='rsa'} />
                </Form.Group>
            </Row>

            <br/>
            
            <Row>
                <Col>
                    <p>Cles SSH</p>
                    <p>Ajoutez cette cle SSH dans le fichier ~/.ssh/authorized_keys du compte usager {usernameSftp} du serveur {hostnameSftp}.</p>
                    <Alert variant='info'><pre>{cleSsh}</pre></Alert>
                </Col>
            </Row>

            <br />
            <Button onClick={appliquerConfiguration} disabled={!etatAuthentifie}>Sauvegarder</Button>
        </div>
    )
}
