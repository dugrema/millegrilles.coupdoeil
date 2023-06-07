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
import Modal from 'react-bootstrap/Modal'

import { AlertTimeout, ModalAttente, FormatteurTaille, FormatterDate } from '@dugrema/millegrilles.reactjs'
import { pki as forgePki } from '@dugrema/node-forge'

import useWorkers, { useEtatPret } from '../WorkerContext'
import { EtatStockage } from './InstanceDetail'

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
        const original = reponse.message['__original']
        const action = original.routage.action
        if(action === 'presence') {
            const certificat = forgePki.certificateFromPem(original['certificat'][0])
            const instance_id = certificat.subject.getField('CN').value
            const info = { ...reponse.message, instance_id, derniere_modification: original.estampille }
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

            <ActionsConsignation confirmationCb={confirmationCb} />

            <ListeConsignations 
                liste={liste} 
                onSelect={setInstanceIdHandler} />
        </>
    )
}

export default ConfigurationConsignation

function ActionsConsignation(props) {

    const { confirmationCb } = props

    const workers = useWorkers(),
          etatPret = useEtatPret()

    const synchroniserHandler = useCallback(()=>{
        workers.connexion.declencherSync()
            .catch(err=>console.error("Erreur declencher synchronization des serveurs de consignation ", err))
    }, [workers])

    const demarrerBackupHandler = useCallback(()=>{
        workers.connexion.demarrerBackupTransactions({complet: true})
            .then(reponse=>{
                console.debug("Backup demarre OK ", reponse)
                confirmationCb('Backup complet demarre')
            })
            .catch(err=>console.error("Erreur declencher backup complet ", err))
    }, [workers, confirmationCb])

    return (
        <div>
            <p></p>
            <h3>Actions de consignation</h3>
            <Row>
                <Col>
                    <Button variant="secondary" disabled={!etatPret} onClick={synchroniserHandler}>Synchroniser</Button>
                    {' '}
                    <Button variant="secondary" disabled={!etatPret} onClick={demarrerBackupHandler}>Backup</Button>
                </Col>
            </Row>
            <p></p>
        </div>
    )

}

function ListeConsignations(props) {
    const { liste, onSelect, erreurCb } = props

    const workers = useWorkers()

    const instances = useSelector(state=>state.instances.listeInstances)
    const [showChangerPrimaire, setShowChangerPrimaire] = useState(false)

    const instancesParId = useMemo(()=>{
        if(!instances) return ''
        const instancesParId = {}
        instances.forEach(item=>{
            instancesParId[item.instance_id] = item
        })
        return instancesParId
    }, [instances])

    const changerPrimaireHandler = useCallback(()=>{
        console.debug("Changer instance primaire pour ", showChangerPrimaire)
        const commande = { instance_id: showChangerPrimaire }
        workers.connexion.setFichiersPrimaire(commande)
            .then(()=>{
                console.debug("Fichiers primaire change pour ", showChangerPrimaire)
                setShowChangerPrimaire(false)
            })
            .catch(erreurCb)
    }, [workers, showChangerPrimaire])

    const changerPrimaireModal = useCallback(e=>{
        const instance_id = e.currentTarget.value
        setShowChangerPrimaire(instance_id)
    }, [setShowChangerPrimaire])
    const fermerPrimaireModal = useCallback(()=>setShowChangerPrimaire(false), [setShowChangerPrimaire])

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

        let taille = item.fichiers_taille || 0
        if(item.archives_taille) taille += item.archives_taille
        let nombre = item.fichiers_nombre || 0
        if(item.archives_nombre) nombre += item.archives_nombre

        return (
            <Row key={item.instance_id} className={primaire?'primaire':''}>
                <Col xs={9} lg={4} className='nom-consignation'>
                    <Button variant="link" onClick={onSelect} value={item.instance_id}>{nom}</Button>
                </Col>
                <Col xs={3} lg={2} className='champ-primaire'>
                    <AfficherChampRole onClick={changerPrimaireModal} item={item} />
                </Col>
                <Col xs={6} lg={3} className={classNameExpiration}><FormatterDate value={item.derniere_modification} /></Col>
                <Col xs={3} lg={2}><FormatteurTaille value={taille} /></Col>
                <Col xs={3} lg={1}>{nombre}</Col>
            </Row>
        )
    })

    return (
        <div>
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

            <Modal show={showChangerPrimaire?true:false} onHide={fermerPrimaireModal}>
                <Modal.Header closeButton>Confirmer</Modal.Header>
                <Modal.Body>
                    <p>Confirmer le changement de primaire.</p>
                    <p>Cette operation peut avoir un impact de performance sur le systeme et couper des connexions actives.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='danger' onClick={changerPrimaireHandler} value={showChangerPrimaire}>Changer</Button>
                    <Button variant='primary' onClick={fermerPrimaireModal}>Annuler</Button>
                </Modal.Footer>
            </Modal>
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

    // Lock instanceId durant edit - evite refresh
    const instanceIdCourant = useMemo(()=>instanceId, [instanceId])

    const listeConsignation = useSelector(state=>state.consignation.liste),
          instances = useSelector(state=>state.instances.listeInstances)
    // const [consignation, setConsignation] = useState('')

    const instance = useMemo(()=>instances.filter(item=>item.instance_id === instanceIdCourant).pop(), [instances, instanceIdCourant])
    const consignation = useMemo(()=>listeConsignation.filter(item=>item.instance_id === instanceIdCourant).pop(), [instances, instanceIdCourant])

    const [cleChiffrage, setCleChiffrage] = useState('')

    // const [configuration, setConfiguration] = useState('')
    const [typeStore, setTypeStore] = useState('local')
    const [urlDownload, setUrlDownload] = useState('')
    const [urlArchives, setUrlArchives] = useState('')
    const [consignationUrl, setConsignationUrl] = useState(CONST_CONSIGNATION_URL)
    const [syncIntervalle, setSyncIntervalle] = useState('')
    const [syncActif, setSyncActif] = useState('')
    const [supporteArchives, setSupporteArchives] = useState('')

    // Sftp
    const [hostnameSftp, setHostnameSftp] = useState('')
    const [portSftp, setPortSftp] = useState(22)
    const [usernameSftp, setUsernameSftp] = useState('')
    const [remotePathSftp, setRemotePathSftp] = useState('')
    const [keyTypeSftp, setKeyTypeSftp] = useState('ed25519')

    // AWS S3
    const [s3AccessKeyId, setS3AccessKeyId] = useState('')
    const [s3SecretAccessKey, setS3SecretAccessKey] = useState('')
    const [s3Region, setS3Region] = useState('')
    const [s3Endpoint, setS3Endpoint] = useState('')
    const [s3Bucket, setS3Bucket] = useState('')

    // Backup
    const [typeBackup, setTypeBackup] = useState('')
    const [hostnameSftpBackup, setHostnameSftpBackup] = useState('')
    const [portSftpBackup, setPortSftpBackup] = useState(22)
    const [usernameSftpBackup, setUsernameSftpBackup] = useState('')
    const [remotePathSftpBackup, setRemotePathSftpBackup] = useState('')
    const [keyTypeSftpBackup, setKeyTypeSftpBackup] = useState('ed25519')

    const syncActifChangeHandler = useCallback(e=>setSyncActif(e.currentTarget.checked), [setSyncActif])
    const supporteArchivesChangeHandler = useCallback(e=>setSupporteArchives(e.currentTarget.checked), [setSupporteArchives])

    const appliquerConfiguration = useCallback(()=>{
        const {connexion, chiffrage} = workers
        if(connexion && etatPret) {

            Promise.resolve().then(async () => {

                // Preparer nouvelle configuration
                const config = {
                    instance_id: instanceIdCourant, 
                    type_store: typeStore, 
                    url_download: urlDownload, 
                    url_archives: urlArchives, 
                    consignation_url: consignationUrl, 
                    sync_intervalle: (syncIntervalle?Number.parseInt(syncIntervalle):null),
                    sync_actif: (syncActif===true?true:false),
                    supporte_archives: (supporteArchives===true?true:false),
                    
                    // SFTP
                    hostname_sftp: hostnameSftp, 
                    username_sftp: usernameSftp, 
                    remote_path_sftp: remotePathSftp, 
                    key_type_sftp: keyTypeSftp,

                    // AWS S3
                    s3_access_key_id: s3AccessKeyId,
                    s3_region: s3Region,
                    s3_endpoint: s3Endpoint,
                    s3_bucket: s3Bucket,
                    
                    // Backup
                    type_backup: typeBackup, 
                    hostname_sftp_backup: hostnameSftpBackup, 
                    port_sftp_backup: portSftpBackup, 
                    username_sftp_backup: usernameSftpBackup, 
                    remote_path_sftp_backup: remotePathSftpBackup, 
                    key_type_sftp_backup: keyTypeSftpBackup,

                    data_chiffre: {},
                }
                if(portSftp) config.portSftp = Number.parseInt(portSftp)

                let commandeMaitredescles = null

                const dataDechiffre = {
                    s3_secret_access_key: s3SecretAccessKey
                }

                if(cleChiffrage) {
                    const doc = await workers.chiffrage.chiffrage.updateChampsChiffres(dataDechiffre, cleChiffrage.cleSecrete)
                    // Copier ref_hachage_bytes
                    doc.ref_hachage_bytes = cleChiffrage.hachage_bytes
                    Object.assign(config.data_chiffre, doc)
                } else {
                    // Creer nouvelle commande pour maitre des cles
                    console.debug("Charger certificats maitre des cles")
                    const certificatsChiffrage = await connexion.getCertificatsMaitredescles()
                    console.debug("Certificats maitre des cles ", certificatsChiffrage)
                    const identificateurs_document = {'type': 'consignation'}

                    const {doc, commandeMaitrecles: commande} = await chiffrage.chiffrerDocument(
                        dataDechiffre, 'CoreTopologie', certificatsChiffrage, {identificateurs_document, DEBUG: true})

                    // Conserver data chiffre dans config
                    Object.assign(config.data_chiffre, doc)

                    console.debug("Commande maitre des cles : %O", commande)
                    commandeMaitredescles = commande
                }

                console.debug("appliquerConfiguration config %O, cles %O", config, commandeMaitredescles)

                // Changer fichier de config stocke local
                const resultat = await connexion.modifierConfigurationConsignation(config, commandeMaitredescles)
                if(resultat.ok===false) {
                    return erreurCb(resultat.err, "Erreur de sauvegarde de la configuration")
                }
                console.debug("Configuration sauvegardee : %O", config)
                // setConfiguration(config)
                dispatch(mergeConsignation(config))
                confirmationCb("Configuration sauvegardee")
                fermer()
            })
            .catch(err=>console.error("Erreur sauvegarde de la configuration ", err))

        } else {
            erreurCb('Erreur de connexion au serveur, veuillez reessayer plus tard')
        }
        
    }, [
        dispatch, workers, erreurCb,
        instanceIdCourant, cleChiffrage,
        etatPret, confirmationCb, fermer,
        typeStore, urlDownload, urlArchives,
        consignationUrl, syncIntervalle, syncActif, supporteArchives,
        hostnameSftp, usernameSftp, remotePathSftp, keyTypeSftp, portSftp,
        s3AccessKeyId, s3SecretAccessKey, s3Region, s3Endpoint, s3Bucket,
        typeBackup, hostnameSftpBackup, portSftpBackup, usernameSftpBackup, remotePathSftpBackup, keyTypeSftpBackup,
    ])

    useEffect(()=>{
        if(!consignation) return
        // setConsignation(consignation)
        console.debug("ConfigurerConsignationInstance Edit consignation ", consignation)

        setTypeStore(consignation.type_store || 'millegrille')
        setUrlDownload(consignation.url_download || '')
        setUrlArchives(consignation.url_archives || '')
        setConsignationUrl(consignation.consignation_url || CONST_CONSIGNATION_URL)
        setSyncIntervalle(consignation.sync_intervalle || '')
        setSyncActif(consignation.sync_actif!==false)
        setSupporteArchives(consignation.supporte_archives!==false)

        // SFTP
        setHostnameSftp(consignation.hostname_sftp || '')
        setPortSftp(consignation.port_sftp || '22')
        setUsernameSftp(consignation.username_sftp || '')
        setRemotePathSftp(consignation.remote_path_sftp || '')
        setKeyTypeSftp(consignation.key_type_sftp || 'ed25519')

        // AWS S3
        setS3AccessKeyId(consignation.s3_access_key_id || '')
        setS3Region(consignation.s3_region || '')
        setS3Endpoint(consignation.s3_endpoint || '')
        setS3Bucket(consignation.s3_bucket || '')

        // Backup
        setTypeBackup(consignation.type_backup || '')
        setHostnameSftpBackup(consignation.hostname_sftp_backup || '')
        setPortSftpBackup(consignation.port_sftp_backup || '22')
        setUsernameSftpBackup(consignation.username_sftp_backup || '')
        setRemotePathSftpBackup(consignation.remote_path_sftp_backup || '')
        setKeyTypeSftpBackup(consignation.key_type_sftp_backup || 'ed25519')

        if(cleChiffrage && consignation.data_chiffre) {
            // Dechiffrer champs secrets
            workers.chiffrage.chiffrage.dechiffrerChampsChiffres(consignation.data_chiffre, cleChiffrage)
                .then(dataDechiffre =>{
                    console.debug("Data dechiffre ", dataDechiffre)
                    setS3SecretAccessKey(dataDechiffre.s3_secret_access_key || '')
                })
                .catch(err=>console.error("Erreur dechiffrage fichier ", err))
        }
    }, [
        consignation, cleChiffrage,  // Triggers pour recharger champs

        setTypeStore, setUrlDownload, setUrlArchives,
        setConsignationUrl, setSyncIntervalle, setSyncActif, setSupporteArchives,
        setHostnameSftp, setPortSftp, setUsernameSftp, setRemotePathSftp, setKeyTypeSftp,
        setS3AccessKeyId, setS3SecretAccessKey, setS3Region, setS3Endpoint, setS3Bucket,
        setTypeBackup, setHostnameSftpBackup, setPortSftpBackup, setUsernameSftpBackup, setRemotePathSftpBackup, setKeyTypeSftpBackup,
    ])

    // Charger cle dechiffrage
    useEffect(()=>{
        if(!consignation) {
            setCleChiffrage('')
            return  // Reset cle
        }

        console.debug("Charger cle ", consignation)
        const data_chiffre = consignation.data_chiffre || {},
              ref_hachage_bytes = data_chiffre.ref_hachage_bytes
        if(ref_hachage_bytes) {
            // Recuperer cle pour re-chiffrer
            workers.clesDao.getCles(ref_hachage_bytes, 'CoreTopologie')
                .then(cle=>{
                    console.debug("Cle dechiffrage chargee : ", cle)
                    setCleChiffrage(cle[ref_hachage_bytes])
                })
                .catch(err=>console.error("Erreur chargement cle dechiffrage ", err))
        } else {
            // Generer nouvelle cle de chiffrage
            setCleChiffrage('')
        }
    }, [workers, consignation, setCleChiffrage])

    if(!consignation) return ''

    return (
        <div>
            <Row>
                <Col xs={10} md={11}>
                    <h3>Consgination {instance.domaine}</h3>
                </Col>
                <Col xs={2} md={1} className="bouton">
                    <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
                </Col>
            </Row>

            <p>Cette page permet de modifier la configuration de consignation des fichiers pour l'instance.</p>

            <h3>Information courante</h3>
            <DetailInstance instance={instance} />

            <br/>
            <br/>

            <Form onSubmit={formSubmit}>
                <h3>Communication back-end</h3>

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

                <h3>Parametres de transfert de fichiers client https</h3>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>URL d'acces public aux fichiers (optionnel pour local)</Form.Label>
                        <FormControl id="urlDownload" aria-describedby="urlDownload"
                                placeholder="exemple : https://cloudfront.amazon.com/c"
                                value={urlDownload}
                                onChange={event=>setUrlDownload(event.currentTarget.value)} />
                    </Form.Group>
                </Row>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>URL d'acces aux archives (optionnel)</Form.Label>
                        <FormControl id="urlArchives" aria-describedby="urlDownload"
                                placeholder="exemple : https://cloudfront.amazon.com/a"
                                value={urlArchives}
                                onChange={event=>setUrlArchives(event.currentTarget.value)} />
                    </Form.Group>
                </Row>

                <br/>

                <h3>Parametres primaire</h3>

                <p>Les parametres suivants ne s'appliquent que si le serveur de consignation est le primaire.</p>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Intervalle sync</Form.Label>
                        <FormControl id="syncIntervalle" aria-describedby="syncIntervalle"
                            placeholder="Mettre le nombre de secondes (e.g. 86400 pour 1 jour)"
                            value={syncIntervalle}
                            onChange={event=>setSyncIntervalle(event.currentTarget.value)} />
                    </Form.Group>
                </Row>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Check id="syncActif" aria-describedby="syncActif" 
                            checked={syncActif} 
                            onChange={syncActifChangeHandler} 
                            label='Synchronisation active' />
                    </Form.Group>
                </Row>

                <br/>

                <h3>Stockage des fichiers</h3>

                <Row>
                    <Form.Group as={Col}>
                        <Form.Check id="supporteArchives" aria-describedby="supporteArchives" 
                            checked={supporteArchives} 
                            onChange={supporteArchivesChangeHandler} 
                            label='Supporte archives' />
                    </Form.Group>
                </Row>

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
                    <Tab eventKey="awss3" title="AWS S3">
                        <TabAwsS3
                            appliquerConfiguration={appliquerConfiguration} 
                            s3AccessKeyId={s3AccessKeyId}
                            setS3AccessKeyId={setS3AccessKeyId}
                            s3SecretAccessKey={s3SecretAccessKey}
                            setS3SecretAccessKey={setS3SecretAccessKey}
                            s3Region={s3Region}
                            setS3Region={setS3Region}
                            s3Endpoint={s3Endpoint}
                            setS3Endpoint={setS3Endpoint}
                            s3Bucket={s3Bucket}
                            setS3Bucket={setS3Bucket}
                            erreurCb={erreurCb} />
                    </Tab>                    
                </Tabs>

                <ConfigurerBackupInstance
                    instanceId={instanceId}
                    confirmationCb={confirmationCb}
                    erreurCb={erreurCb} 
                    typeBackup={typeBackup}
                    setTypeBackup={setTypeBackup}
                    hostnameSftpBackup={hostnameSftpBackup}
                    setHostnameSftpBackup={setHostnameSftpBackup}
                    portSftpBackup={portSftpBackup}
                    setPortSftpBackup={setPortSftpBackup}
                    usernameSftpBackup={usernameSftpBackup}
                    setUsernameSftpBackup ={setUsernameSftpBackup}
                    remotePathSftpBackup={remotePathSftpBackup}
                    setRemotePathSftpBackup={setRemotePathSftpBackup}
                    keyTypeSftpBackup={keyTypeSftpBackup}
                    setKeyTypeSftpBackup={setKeyTypeSftpBackup}
                    />

                <p></p>

                <Button disabled={!etatPret} onClick={appliquerConfiguration}>Sauvegarder</Button>

            </Form>

        </div>
    )
    
}

function DetailInstance(props) {
    const { instance } = props

    const instanceId = useMemo(()=>instance.instance_id, [instance])

    const listeConsignation = useSelector(state=>state.consignation.liste)
    const consignation = useMemo(()=>listeConsignation.filter(item=>item.instance_id === instanceId).pop(), [listeConsignation, instanceId])

    useMemo(()=>{
        console.debug("Instance %O\nConsignation %O", instance, consignation)
    }, [instance, consignation])

    return (
        <div>
            <Row>
                <Col xs={4} md={2} xl={1}>Instance</Col>
                <Col>{instance.instance_id}</Col>
            </Row>

            <Row>
                <Col xs={4} md={2} xl={1}>Fichiers actifs</Col>
                <Col xs={3} md={2}>{consignation.fichiers_nombre}</Col>
                <Col><FormatteurTaille value={consignation.fichiers_taille} /></Col>
            </Row>
            <Row>
                <Col xs={4} md={2} xl={1}>Fichiers archives</Col>
                <Col xs={3} md={2}>{consignation.archives_nombre}</Col>
                <Col><FormatteurTaille value={consignation.archives_taille} /></Col>
            </Row>
            <Row>
                <Col xs={4} md={2} xl={1}>Fichiers orphelins</Col>
                <Col xs={3} md={2}>{consignation.orphelins_nombre}</Col>
                <Col><FormatteurTaille value={consignation.orphelins_taille} /></Col>
            </Row>

            <EtatStockage instance={instance} />
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
            <p>Les fichiers sont stockes localement sur une instance de MilleGrille.</p>
            <p>
                Les fichiers sont sur le volume millegrilles-consignation de docker. Par defaut, ce volume
                se situe a :
            </p>
            <p>/var/lib/docker/volumes/millegrilles-consignation/_data</p>
        </div>
    )
}

function TabSftp(props) {

    const { 
        erreurCb,
        hostnameSftp, setHostnameSftp, portSftp, setPortSftp, usernameSftp, setUsernameSftp,
        remotePathSftp, setRemotePathSftp, keyTypeSftp, setKeyTypeSftp,
    } = props

    const changeKeyType = useCallback(event=>setKeyTypeSftp(event.currentTarget.value), [setKeyTypeSftp])

    const workers = useWorkers(),
          etatAuthentifie = useEtatPret()

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
            <h3>Parametres sftp</h3>

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

        </div>
    )
}

function TabAwsS3(props) {

    const {
        s3AccessKeyId, setS3AccessKeyId, s3SecretAccessKey, setS3SecretAccessKey, 
        s3Region, setS3Region, s3Endpoint, setS3Endpoint, s3Bucket, setS3Bucket
    } = props

    return (
        <div>
            <p>Les fichiers sont stockes sur un serveur Amazon Web Services S3 (ou compatible S3 comme Linode)</p>

            <p>Le serveur tiers doit exposer les fichiers avec un serveur web statique et les directives CORS.</p>

            <h3>Parametres du serveur AWS S3</h3>
            <Row>
                <Form.Group as={Col} xs={12}>
                    <Form.Label>Access Key ID</Form.Label>
                    <FormControl id="s3AccessKeyId" aria-describedby="s3AccessKeyId"
                        placeholder="exemple : PEV36HMR94NVQDJLQ3K8"
                        value={s3AccessKeyId}
                        onChange={event=>setS3AccessKeyId(event.currentTarget.value)} />
                </Form.Group>
                <Form.Group as={Col} xs={12}>
                    <Form.Label>Secret Access Key</Form.Label>
                    <FormControl id="s3SecretAccessKey" aria-describedby="s3SecretAccessKey"
                        placeholder="exemple : DADI01DEADBEEF02"
                        value={s3SecretAccessKey}
                        onChange={event=>setS3SecretAccessKey(event.currentTarget.value)} />
                </Form.Group>
                <Form.Group as={Col} xs={12}>
                    <Form.Label>Endpoint</Form.Label>
                    <FormControl id="s3Endpoint" aria-describedby="s3Endpoint"
                        placeholder="exemple : https://us-southeast-1.linodeobjects.com/"
                        value={s3Endpoint}
                        onChange={event=>setS3Endpoint(event.currentTarget.value)} />
                </Form.Group>
                <Form.Group as={Col} xs={12}>
                    <Form.Label>Region</Form.Label>
                    <FormControl id="s3Region" aria-describedby="s3Region"
                        placeholder="exemple : us-east-1"
                        value={s3Region}
                        onChange={event=>setS3Region(event.currentTarget.value)} />
                </Form.Group>
                <Form.Group as={Col} xs={12}>
                    <Form.Label>Bucket</Form.Label>
                    <FormControl id="s3Bucket" aria-describedby="s3Bucket"
                        placeholder="exemple : DADI01DEADBEEF02"
                        value={s3Bucket}
                        onChange={event=>setS3Bucket(event.currentTarget.value)} />
                </Form.Group>
            </Row>

        </div>
    )
}

function ConfigurerBackupInstance(props) {

    const {
        erreurCb,
        typeBackup, setTypeBackup,
        hostnameSftpBackup, setHostnameSftpBackup,
        portSftpBackup, setPortSftpBackup,
        usernameSftpBackup, setUsernameSftpBackup,
        remotePathSftpBackup, setRemotePathSftpBackup,
        keyTypeSftpBackup, setKeyTypeSftpBackup,
    } = props

    return (
        <div>
            <h3>Backup</h3>

            <Tabs activeKey={typeBackup} onSelect={setTypeBackup}>
                <Tab eventKey="" title="Aucun">
                    <p>Aucun backup.</p>
                    <p>Note: Si des consignation secondaires sont configurees, elles agissent implicitement comme backup 
                        (miroir) et synchronisent automatiquement les fichiers a intervalle regulier.
                    </p>
                </Tab>
                <Tab eventKey="sftp" title="sftp">
                    <TabSftp 
                        erreurCb={erreurCb}
                        hostnameSftp={hostnameSftpBackup} 
                        setHostnameSftp={setHostnameSftpBackup}
                        portSftp={portSftpBackup}
                        setPortSftp={setPortSftpBackup} 
                        usernameSftp={usernameSftpBackup}
                        setUsernameSftp={setUsernameSftpBackup} 
                        remotePathSftp={remotePathSftpBackup}
                        setRemotePathSftp={setRemotePathSftpBackup}
                        keyTypeSftp={keyTypeSftpBackup} 
                        setKeyTypeSftp={setKeyTypeSftpBackup} />
                </Tab>
            </Tabs>
        </div>
    )
}