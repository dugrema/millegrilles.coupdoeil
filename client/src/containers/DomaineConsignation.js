import React, {useState, useEffect, useCallback} from 'react'
import { useTranslation } from 'react-i18next'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Alert from 'react-bootstrap/Alert'

import { AlertTimeout, ModalAttente, FormatteurTaille, FormatterDate } from '@dugrema/millegrilles.reactjs'

import useWorkers, { useEtatPret } from '../WorkerContext'

const CONST_CONSIGNATION_URL = 'https://fichiers:444'

// Note: Look behind (?<!) pas supporte sur Safari (iOS)
// RE_DOMAINE = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
//const RE_DOMAINE = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/

function ConfigurationConsignation(props) {

    const { fermer } = props

    const { t } = useTranslation()
    const workers = useWorkers(),
          etatPret = useEtatPret()

    const [liste, setListe] = useState('')
    const [attente, setAttente] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')

    const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )

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
        workers.connexion.getConfigurationFichiers()
            .then(reponse=>{
                console.debug("Liste consignations recue ", reponse)
                setListe(reponse.liste)
            })
            .catch(err=>setError(''+err))
    }, [workers, etatPret, setListe, setError])
  
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
    
            <p>Cette page permet de modifier la configuration de consignation des fichiers pour l'instance.</p>

            <ListeConsignations 
                workers={workers}
                liste={liste} />

            {/* <ConfigurerConsignation
                workers={workers} 
                etatAuthentifie={etatAuthentifie}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} /> */}
        </>
    )
}

export default ConfigurationConsignation

function ListeConsignations(props) {
    const { workers, liste } = props

    if(!liste) return 'Chargement encours'
    if(liste.length === 0) return 'Aucune consignation de fichiers presente'

    const listeFichiers = liste.map(item=>{
        return (
            <Row key={item.instance_id}>
                <Col>{item.primaire?'Primaire':'Secondaire'}</Col>
                <Col>{item.instance_id}</Col>
                <Col><FormatterDate value={item.derniere_modification} /></Col>
                <Col><FormatteurTaille value={item.fichiers_taille} /></Col>
                <Col>{item.fichiers_nombre}</Col>
            </Row>
        )
    })

    return (
        <div>
            <Row>
                <Col></Col>
                <Col>Serveur</Col>
                <Col>Date</Col>
                <Col>Taille</Col>
                <Col>Fichiers</Col>
            </Row>
            {listeFichiers}
        </div>
    )
}


function ConfigurerConsignation(props) {

    const { workers, etatAuthentifie, confirmationCb, erreurCb } = props

    const [configuration, setConfiguration] = useState('')
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
        if(connexion && etatAuthentifie) {
            // Preparer nouvelle configuration
            const config = {typeStore, urlDownload, consignationUrl, hostnameSftp, usernameSftp, remotePathSftp, keyTypeSftp}
            if(portSftp) config.portSftp = Number.parseInt(portSftp)

            // Changer fichier de config stocke local
            connexion.modifierConfigurationConsignation(config)
                .then(resultat=>{
                    if(resultat.ok===false) {
                        return erreurCb(resultat.err, "Erreur de sauvegarde de la configuration")
                    }
                    console.debug("Configuration sauvegardee : %O", config)
                    setConfiguration(config)
                    confirmationCb("Configuration sauvegardee")
                })
                .catch(err=>erreurCb(err, 'Erreur de sauvegarde de la configuration'))
        } else {
            erreurCb('Erreur de connexion au serveur, veuillez reessayer plus tard')
        }
        
    }, [
        workers, etatAuthentifie, confirmationCb, setConfiguration,
        typeStore, urlDownload, 
        consignationUrl, 
        hostnameSftp, usernameSftp, remotePathSftp, keyTypeSftp, portSftp,
    ])

    useEffect(()=>{
        if(configuration) return  // Eviter cycle
        const { connexion } = workers
        if(connexion && etatAuthentifie) {
            connexion.getConfigurationConsignation()
                .then(configuration=>{
                    console.debug("ConfigurerConsignation configuration = %O", configuration)
                    setConfiguration(configuration)
                })
                .catch(err=>erreurCb(err, 'Erreur chargement configuration de consignation'))
        }
    }, [workers, etatAuthentifie, configuration, setConfiguration, erreurCb])

    useEffect(()=>{
        if(configuration) {
            setTypeStore(configuration.typeStore || 'local')
            setUrlDownload(configuration.urlDownload || '')
            setConsignationUrl(configuration.consignationUrl || CONST_CONSIGNATION_URL)
            setHostnameSftp(configuration.hostnameSftp || '')
            setPortSftp(configuration.portSftp || '22')
            setUsernameSftp(configuration.usernameSftp || '')
            setRemotePathSftp(configuration.remotePathSftp || '')
            setKeyTypeSftp(configuration.keyTypeSftp || 'ed25519')
        }
    }, [
        configuration, setTypeStore, setUrlDownload, 
        setConsignationUrl, 
        setHostnameSftp, setPortSftp, setUsernameSftp, setRemotePathSftp, setKeyTypeSftp,
    ])

    return (
        <div>
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
                            etatAuthentifie={etatAuthentifie} 
                            appliquerConfiguration={appliquerConfiguration} 
                            consignationUrl={consignationUrl}
                            setConsignationUrl={setConsignationUrl} />
                    </Tab>
                    <Tab eventKey="sftp" title="sftp">
                        <TabSftp 
                            workers={workers}
                            etatAuthentifie={etatAuthentifie}
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
