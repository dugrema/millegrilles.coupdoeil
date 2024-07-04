import React, {useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { proxy } from 'comlink'
import axios from 'axios'

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

import { push as pushConsignation, merge as mergeConsignation, verifierExpiration, setConsignationPrimaire, 
    setDownloadSecondaire, setUploadSecondaire, clearTransfertsSecondaires, 
} from '../redux/consignationSlice'

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
    const instances = useSelector(state=>state.instances.listeInstances)

    // const [liste, setListe] = useState('')
    const [ajouter, setAjouter] = useState(false)
    const [attente, setAttente] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [instanceId, setInstanceId] = useState('')
    const [syncPrimaireEnCours, setSyncPrimaireEnCours] = useState(false)

    const instancesParId = useMemo(()=>{
        if(!instances) return ''
        const instancesParId = {}
        instances.forEach(item=>{
            instancesParId[item.instance_id] = item
        })
        return instancesParId
    }, [instances])

    const ouvrirAjouter = useCallback(()=>setAjouter(true), [setAjouter])
    const fermerAjouter = useCallback(()=>setAjouter(false), [setAjouter])

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
            const info = { ...reponse.message, instance_id, derniere_modification: original.estampille, supprime: false }
            console.debug("Info evenement consignation ", info)
            dispatch(mergeConsignation(info))
        } else if(action === 'changementConsignationPrimaire') {
            dispatch(setConsignationPrimaire(reponse.message.instance_id))
        } else if(action === 'syncPrimaire') {
            const certificat = forgePki.certificateFromPem(original['certificat'][0])
            const instance_id = certificat.subject.getField('CN').value
            const info = { ...reponse.message, instance_id, derniere_modification: original.estampille }
            console.debug("Sync primaire ", info)
            setSyncPrimaireEnCours(info.termine !== true)
        } else if(action === 'syncDownload') {
            console.debug("Sync download secondaire ", reponse.message)
            dispatch(setDownloadSecondaire(reponse.message))
        } else if(action === 'syncUpload') {
            console.debug("Sync upload secondaire ", reponse.message)
            dispatch(setUploadSecondaire(reponse.message))
        } else if(action === 'instanceConsignationSupprimee') {
            const instance_id = reponse.message.instance_id
            const info = { instance_id, supprime: true }
            console.debug("Supprimer consignation ", info)
            dispatch(mergeConsignation(info))
        }
    }, [dispatch, setSyncPrimaireEnCours])

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
        connexion.getConfigurationFichiers({stats: true})
            .then(reponse=>{
                console.debug("Liste consignations recue ", reponse)
                dispatch(pushConsignation({liste: reponse.liste, clear: true}))
            })
            .catch(err=>setError(''+err))

        dispatch(clearTransfertsSecondaires())

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

    if(ajouter) return (
        <>
            <AlertTimeout variant="danger" titre="Erreur" delay={false} value={error} setValue={setError} />
            <ModalAttente show={attente} setAttente={setAttente} />
            <AjouterConsignation 
                confirmationCb={confirmationCb}
                erreurCb={erreurCb}
                setAttente={setAttente}
                fermer={fermerAjouter} />
        </>
    )

    if(instanceId) return (
        <>
            <AlertTimeout variant="danger" titre="Erreur" delay={false} value={error} setValue={setError} />
            <ModalAttente show={attente} setAttente={setAttente} />
            <ConfigurerConsignationInstance
                instanceId={instanceId}
                syncPrimaireEnCours={syncPrimaireEnCours}
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
            <Alert variant="info" show={syncPrimaireEnCours}>
                <Alert.Heading>Synchronisation primaire en cours</Alert.Heading>
                <p>Le serveur de consignation primaire fait une mise a jour de l'etat des fichiers.</p>
            </Alert>
            <ModalAttente show={attente} setAttente={setAttente} />

            <ActionsConsignation 
                setAjouter={ouvrirAjouter}
                syncPrimaireEnCours={syncPrimaireEnCours}
                setSyncPrimaireEnCours={setSyncPrimaireEnCours}
                confirmationCb={confirmationCb} 
                erreurCb={erreurCb} />

            <ListeConsignations 
                instancesParId={instancesParId}
                liste={liste} 
                syncPrimaireEnCours={syncPrimaireEnCours}
                onSelect={setInstanceIdHandler} />

            <InformationSyncSecondaire instancesParId={instancesParId} />
        </>
    )
}

export default ConfigurationConsignation

function ActionsConsignation(props) {

    const { setAjouter, syncPrimaireEnCours, setSyncPrimaireEnCours, confirmationCb, erreurCb } = props

    const workers = useWorkers(),
          etatPret = useEtatPret()

    const ajouterHandler = useCallback(()=>{
        // Ajouter une nouvelle consignation manuellement
        console.debug("Ajouter consignation manuellement")
        setAjouter()
    }, [setAjouter])

    const synchroniserHandler = useCallback(()=>{
        setSyncPrimaireEnCours(true)
        workers.connexion.declencherSync()
            .catch(err=>{
                console.error("Erreur declencher synchronization des serveurs de consignation ", err)
                erreurCb('Erreur declencher synchronization des serveurs de consignation. \n' + err)
            })
    }, [setSyncPrimaireEnCours, workers, erreurCb])

    const reindexerHandler = useCallback(()=>{
        workers.connexion.reindexerConsignation()
            .then(reponse=>{
                console.debug("Reindexation amorcee : ", reponse)
                confirmationCb('Reindexation amorcee OK')
            })
            .catch(err=>{
                console.error("Erreur declenchement reindexer consignation ", err)
                erreurCb('Erreur declencher reindexation de la consignation.\n' + err)
            })
    }, [workers, erreurCb])

    const resetTransfertsSecondairesHandler = useCallback(()=>{
        workers.connexion.resetTransfertsSecondaires()
            .then(reponse=>{
                console.debug("Reset transferts secondaires emis : ", reponse)
                confirmationCb('Reset transferts secondaires emis')
            })
            .catch(err=>{
                console.error("Erreur declenchement reset transferts secondaires ", err)
                erreurCb('Erreur declencher reset transferts secondaires.\n' + err)
            })
    }, [workers, erreurCb])

    return (
        <div>
            <p></p>
            <h3>Actions de consignation</h3>
            <Row>
                <Col>
                    <Button variant="secondary" disabled={!etatPret} onClick={ajouterHandler}>Ajouter</Button>
                    {' '}
                    <Button variant="secondary" disabled={!etatPret||syncPrimaireEnCours} onClick={synchroniserHandler}>Synchroniser</Button>
                    {' '}
                    <Button variant="secondary" disabled={!etatPret} onClick={reindexerHandler}>Reindexer</Button>
                    {' '}
                    <Button variant="secondary" disabled={!etatPret} onClick={resetTransfertsSecondairesHandler}>Reset transferts</Button>
                </Col>
            </Row>
            <p></p>
        </div>
    )

}

function ListeConsignations(props) {
    const { instancesParId, liste, syncPrimaireEnCours, onSelect, erreurCb } = props

    const workers = useWorkers()

    const [showChangerPrimaire, setShowChangerPrimaire] = useState(false)

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

    const listeFichiers = liste.filter(item=>item.supprime !== true).map(item=>{

        const instance = instancesParId[item.instance_id] || ''
        const nom = instance.domaine || item.instance_id
        const primaire = item.primaire?true:false
        const derniereModification = item.derniere_modification,
              secsDepuisModif = epochNow - derniereModification

        let classNameExpiration = ''
        if(secsDepuisModif > 1800) classNameExpiration = 'expire-long'
        else if(secsDepuisModif > 300) classNameExpiration = 'expire-court'

        const principal = item.principal || {},
              orphelins = item.orphelin || {},
              manquant = item.manquant || {}
        
        let taillePrincipal = principal.taille || 0,
            tailleOrphelins = orphelins.taille || 0,
            tailleTotale = taillePrincipal

        let nombrePrincipal = principal.nombre || 0,
            nombreOrphelins = orphelins.nombre || 0,
            nombreManquants = manquant.nombre || 0,
            nombreTotal = nombrePrincipal

        const dernierePresence = item.derniere_modification || item['_mg-derniere-modification']

        return (
            <Row key={item.instance_id} className={primaire?'primaire':''}>
                <Col xs={9} lg={4} xl={4} className='nom-consignation'>
                    <Button variant="link" onClick={onSelect} value={item.instance_id}>{nom}</Button>
                </Col>
                <Col xs={3} lg={2} xl={2} className='champ-primaire'>
                    <AfficherChampRole onClick={changerPrimaireModal} item={item} />
                </Col>
                <Col xs={6} lg={3} xl={2} className={classNameExpiration}><FormatterDate value={dernierePresence} /></Col>
                <Col xs={3} lg={1} xl={1}>{nombreTotal}</Col>
                <Col xs={3} lg={2} xl={1}><FormatteurTaille value={tailleTotale} /></Col>
                <Col className='d-none d-xl-block' xl={1}>
                    {nombreOrphelins} / {nombreOrphelins?<FormatteurTaille value={tailleOrphelins} />:'0 bytes'}
                </Col>
                <Col className='d-none d-xl-block' xl={1}>
                    {nombreManquants}
                </Col>
            </Row>
        )
    })

    return (
        <div>
            <div>
                <Row>
                    <Col lg={4} xl={4} className='d-none d-lg-block'>Serveur</Col>
                    <Col lg={2} xl={2} className='d-none d-lg-block'></Col>
                    <Col lg={3} xl={2} className='d-none d-lg-block'>Derniere presence</Col>
                    <Col lg={1} xl={1} className='d-none d-lg-block'>Fichiers</Col>
                    <Col lg={2} xl={1} className='d-none d-lg-block'>Taille</Col>
                    <Col className='d-none d-xl-block' xl={1}>Orphelins</Col>
                    <Col className='d-none d-xl-block' xl={1}>Manquants</Col>
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

function AjouterConsignation(props) {

    const {confirmationCb, erreurCb, setAttente, fermer} = props

    const workers = useWorkers()

    const [url, setUrl] = useState('')
    const urlChangeHandler = useCallback(e=>setUrl(e.currentTarget.value), [setUrl])
    const [fiche, setFiche] = useState('')

    const verifierUrlHandler = useCallback(()=>{
        console.debug("Verifier url : %s", url)
        try {
            const urlVal = new URL(url)
            urlVal.pathname = 'fiche.json'
            setAttente(true)
            axios({method: 'GET', url: urlVal.href, timeout: 5_000})
                .then( async reponse=>{
                    console.debug("Reponse consignation : ", reponse)
                    const fiche = verifierFicheHebergement(reponse)
                    if(fiche) {
                        // Ok
                        setFiche(fiche)
                    } else {
                        erreurCb("Aucun service d'hebergement n'a ete detecte a cette adresse.")
                        setFiche('')
                    }

                })
                .catch(err=>{
                    console.error("Erreur verification url", err)
                    setAttente(false)
                    erreurCb(err, 'Erreur durant la verification de la consignation')
                })
        } catch(err) {
            erreurCb(err, "URL invalide")
        }
    }, [url, erreurCb, setFiche, setAttente])

    useEffect(()=>{
        if(!fiche) return
        console.debug("Verifier hebergement avec fiche : ", fiche)
        workers.connexion.ajouterConsignationHebergee(url)
            .then(resultat=>{
                console.debug("Resultat ajout consignation", resultat)
                confirmationCb('Consignation hebergee ajoutee')
            })
            .catch(err=>{
                console.error("Erreur ajout consignation hebergee", err)
                erreurCb(err, "Erreur ajout consignation hebergee")
                setFiche('')
            })
            .finally(()=>{
                setAttente(false)
            })
    }, [workers, fiche, setFiche, url, erreurCb, setAttente])

    return (
        <>
            <h2>Ajouter consignation</h2>

            <p>Ajouter une consignation hébergée sur une MilleGrille différente.</p>

            <p>
                Entrez l'adresse d'une MilleGrille où votre système a déjà été enregistré par le propriétaire.
                L'adresse fournie doit avoir la forme https://monserveur.com. Pour savoir si l'adresse est bonne,
                vous pouvez vérifier qu'elle retourne du contenu pour le fichier fiche.json (e.g. https://monserveur.com/fiche.json).
            </p>

            <Form>
                <Form.Group controlId="urlInstance">
                    <Form.Label>Adresse du serveur</Form.Label>
                    <Form.Control type="url" value={url} onChange={urlChangeHandler}/>
                    <Form.Text className="text-muted">
                        L'adresse devrait être de forme : "https://monserveur.com" ou "https://monserveur.com:1234".
                    </Form.Text>
                </Form.Group>
                <Button variant="secondary" onClick={verifierUrlHandler}>Verifier</Button>
            </Form>

            {fiche?(
                <>
                    <p>Verification de l'hebergement</p>
                </>
            ):''}

            <Button variant='secondary' onClick={fermer}>Annuler</Button>
        </>
    )
}

function verifierFicheHebergement(reponse) {
    const data = reponse.data
    const fiche = JSON.parse(data.contenu)
    console.debug("Fiche ", fiche)
    const applicationsV2 = fiche.applicationsV2 || {}
    const hebergement = applicationsV2.hebergement_python
    if(hebergement) {
        return fiche
    }
    return false
}

function ConfigurerConsignationInstance(props) {

    const { instanceId, syncPrimaireEnCours, confirmationCb, erreurCb, fermer } = props

    const { t } = useTranslation()
    const dispatch = useDispatch(),
          workers = useWorkers(),
          etatPret = useEtatPret()

    // Lock instanceId durant edit - evite refresh
    const instanceIdCourant = useMemo(()=>instanceId, [instanceId])

    const listeConsignation = useSelector(state=>state.consignation.liste),
          instances = useSelector(state=>state.instances.listeInstances)
    // const [consignation, setConsignation] = useState('')

    const instance = useMemo(()=>{
        const instance = instances.filter(item=>item.instance_id === instanceIdCourant).pop()
        return instance || {instance_id: instanceIdCourant}
    }, [instances, instanceIdCourant])
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
    const [backupIntervalleSecondes, setBackupIntervalleSecondes] = useState(1200)
    const [backupLimiteBytes, setBackupLimiteBytes] = useState(500_000_000)

    // Supprimer
    const [attenteSupprimer, setAttenteSupprime] = useState(false)

    const handleSupprimer = useCallback(()=>{
        setAttenteSupprime(true)
        try {
            workers.connexion.supprimerConsignation(instanceIdCourant)
                .then(reponse=>{
                    console.debug("Reponse supprimer %s : %O", instanceIdCourant, reponse)
                    if(reponse.ok === true) {
                        fermer()
                    } else {
                        console.error("Erreur supprimer consignation, reponse : %O", reponse)
                    }
                })
                .catch(err=>console.error("Erreur supprimer consignation : %O", err))
                .finally(()=>{
                    setAttenteSupprime(false)
                })
        } catch(err) {
            console.error("Erreur supprimer consignation : ", err)
            setAttenteSupprime(false)
        }
    }, [workers, fermer, setAttenteSupprime, instanceIdCourant])

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
                    sync_intervalle: toInt(syncIntervalle),
                    sync_actif: (syncActif===true?true:false),
                    supporte_archives: (supporteArchives===true?true:false),
                    
                    // SFTP
                    hostname_sftp: hostnameSftp, 
                    port_sftp: toInt(portSftp),
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
                    port_sftp_backup: toInt(portSftpBackup), 
                    username_sftp_backup: usernameSftpBackup, 
                    remote_path_sftp_backup: remotePathSftpBackup, 
                    key_type_sftp_backup: keyTypeSftpBackup,
                    backup_intervalle_secs: toInt(backupIntervalleSecondes),
                    backup_limit_bytes: toInt(backupLimiteBytes),

                    data_chiffre: {},
                }
                if(portSftp) config.portSftp = Number.parseInt(portSftp)

                let commandeMaitredescles = null

                const dataDechiffre = {
                    s3_secret_access_key: s3SecretAccessKey
                }

                if(cleChiffrage) {
                    console.debug("Conserver config, cleChiffrage: %O, config: %O", cleChiffrage, config)
                    const cleId = cleChiffrage.hachage_bytes
                    const doc = await workers.chiffrage.chiffrage.updateChampsChiffres(dataDechiffre, cleChiffrage.cleSecrete, cleId)
                    // Copier ref_hachage_bytes
                    //doc.ref_hachage_bytes = cleChiffrage.hachage_bytes
                    Object.assign(config.data_chiffre, doc)
                } else {
                    // Creer nouvelle commande pour maitre des cles
                    console.debug("Charger certificats maitre des cles")
                    const certificatsChiffrage = await connexion.getCertificatsMaitredescles()
                    console.debug("Certificats maitre des cles ", certificatsChiffrage)
                    // const identificateurs_document = {'type': 'consignation'}

                    // const {doc, commandeMaitrecles: commande} = await chiffrage.chiffrerDocument(
                    //     dataDechiffre, 'CoreTopologie', certificatsChiffrage, {identificateurs_document, DEBUG: true})
                    const { doc, commandeMaitrecles: commande } = await chiffrage.chiffrerChampsV2(
                        dataDechiffre, 'CoreTopologie', certificatsChiffrage, {DEBUG: false})

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
        backupIntervalleSecondes, backupLimiteBytes,
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
        setPortSftp(consignation.port_sftp || 22)
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
        setPortSftpBackup(consignation.port_sftp_backup || 22)
        setUsernameSftpBackup(consignation.username_sftp_backup || '')
        setRemotePathSftpBackup(consignation.remote_path_sftp_backup || '')
        setKeyTypeSftpBackup(consignation.key_type_sftp_backup || 'ed25519')
        setBackupIntervalleSecondes(consignation.backup_intervalle_secs || 1200)
        setBackupLimiteBytes(consignation.backup_limit_bytes || 500000000)

        if(cleChiffrage && consignation.data_chiffre) {
            // Dechiffrer champs secrets
            workers.chiffrage.chiffrage.dechiffrerChampsV2(consignation.data_chiffre, cleChiffrage.cleSecrete)
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
              cle_id = data_chiffre.cle_id || data_chiffre.ref_hachage_bytes
        if(cle_id) {
            // Recuperer cle pour re-chiffrer
            workers.clesDao.getCles(cle_id, 'CoreTopologie')
                .then(cle=>{
                    console.debug("Cle dechiffrage chargee : ", cle)
                    setCleChiffrage(cle[cle_id])
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
                    <h3>Consgination {instance.domaine || instanceId}</h3>
                </Col>
                <Col xs={2} md={1} className="bouton">
                    <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
                </Col>
            </Row>

            <p>Cette page permet de modifier la configuration de consignation des fichiers pour l'instance.</p>

            <h3>Information courante</h3>

            <Alert variant="info" show={(consignation.primaire&&syncPrimaireEnCours)?true:false}>
                <Alert.Heading>Synchronisation primaire en cours</Alert.Heading>
                <p>Le serveur de consignation primaire fait une mise a jour de l'etat des fichiers.</p>
            </Alert>

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
                    backupIntervalleSecondes={backupIntervalleSecondes}
                    setBackupIntervalleSecondes={setBackupIntervalleSecondes}
                    backupLimiteBytes={backupLimiteBytes}
                    setBackupLimiteBytes={setBackupLimiteBytes}
                    />

                <p></p>

                <Button disabled={!etatPret} onClick={appliquerConfiguration}>Sauvegarder</Button>

            </Form>

            <br/>

            <hr />
            <p>Supprimer le serveur. En pratique le retire de la liste mais conserve la configuration.</p>
            <Button variant="danger" onClick={handleSupprimer} disabled={attenteSupprimer}>Supprimer</Button>
            <br /><br /><br />

        </div>
    )
    
}

function DetailInstance(props) {
    const { instance } = props

    const instanceId = useMemo(()=>instance.instance_id, [instance])

    const listeConsignation = useSelector(state=>state.consignation.liste)
    const consignation = useMemo(()=>{
        const consignation = listeConsignation.filter(item=>item.instance_id === instanceId).pop()
        return consignation || {}
    }, [listeConsignation, instanceId])

    useMemo(()=>{
        console.debug("Instance %O\nConsignation %O", instance, consignation)
    }, [instance, consignation])

    const infoFichiers = useMemo(()=>{
        const principal = consignation.principal || {},
              manquant = consignation.manquant || {},
              orphelin = consignation.orphelin || {}
        return { principal, manquant, orphelin }
    }, [consignation])

    return (
        <div>
            <Row>
                <Col xs={4} md={3} xl={2}>Instance</Col>
                <Col>{instanceId}</Col>
            </Row>

            <Row>
                <Col xs={4} md={3} xl={2}>Fichiers actifs</Col>
                <Col xs={3} md={2}>{infoFichiers.principal.nombre}</Col>
                <Col><FormatteurTaille value={infoFichiers.principal.taille} /></Col>
            </Row>
            <Row>
                <Col xs={4} md={3} xl={2}>Fichiers orphelins</Col>
                <Col xs={3} md={2}>{infoFichiers.orphelin.nombre}</Col>
                <Col><FormatteurTaille value={infoFichiers.orphelin.taille} /></Col>
            </Row>
            <Row>
                <Col xs={4} md={3} xl={2}>Fichiers manquants</Col>
                <Col xs={3} md={2}>{infoFichiers.manquant.nombre}</Col>
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

            <TabSftpBackupElems {...props} />

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

function TabSftpBackupElems(props) {

    const { backupIntervalleSecondes, setBackupIntervalleSecondes, backupLimiteBytes, setBackupLimiteBytes } = props

    if( ! (setBackupIntervalleSecondes && setBackupLimiteBytes) ) return ''

    return (
        <Row>
            <Form.Group as={Col} xs={12} md={6}>
                <Form.Label>Intervalle entre demarrages (secondes)</Form.Label>
                <FormControl id="backupIntervalleSecondes" aria-describedby="backupIntervalleSecondes"
                    placeholder="exemple : 3600"
                    value={backupIntervalleSecondes}
                    onChange={event=>setBackupIntervalleSecondes(event.currentTarget.value)} />
            </Form.Group>
            <Form.Group as={Col} xs={12} md={6}>
                <Form.Label>Limite de transfert (bytes)</Form.Label>
                <FormControl id="portsftp" aria-describedby="portsftp"
                    placeholder="exemple : 500000000"
                    value={backupLimiteBytes}
                    onChange={event=>setBackupLimiteBytes(event.currentTarget.value)} />
            </Form.Group>
        </Row>
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
        backupIntervalleSecondes, setBackupIntervalleSecondes,
        backupLimiteBytes, setBackupLimiteBytes,
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
                        setKeyTypeSftp={setKeyTypeSftpBackup} 
                        backupIntervalleSecondes={backupIntervalleSecondes}
                        setBackupIntervalleSecondes={setBackupIntervalleSecondes}
                        backupLimiteBytes={backupLimiteBytes}
                        setBackupLimiteBytes={setBackupLimiteBytes}
                        />
                </Tab>
            </Tabs>
        </div>
    )
}

function triInstances(a, b) {
    const idA = a.instance_id, idB = b.instance_id

    if(idA !== idB) return idA.localeCompare(idB)

    return 0
}

function InformationSyncSecondaire(props) {

    const { instancesParId } = props

    const downloadsSecondaires = useSelector(state=>state.consignation.downloadsSecondaires),
          uploadsSecondaires = useSelector(state=>state.consignation.uploadsSecondaires)

    useEffect(()=>{
        console.debug("Transferts update : ", downloadsSecondaires)
    }, [downloadsSecondaires])

    const listeServeurs = useMemo(()=>{
        if(!downloadsSecondaires || !uploadsSecondaires) return

        console.debug("Transferts en cours : %O, %O", downloadsSecondaires, uploadsSecondaires)
        const setServeurs = new Set([...Object.keys(downloadsSecondaires), ...Object.keys(uploadsSecondaires)])
        const liste = []
        for(const instance_id of setServeurs) {
            const upload = uploadsSecondaires[instance_id] || {}
            const download = downloadsSecondaires[instance_id] || {}
            liste.push({instance_id, upload, download})
        }

        liste.sort(triInstances)
        console.debug("Liste serveurs : %O", liste)
        return liste
    }, [downloadsSecondaires, uploadsSecondaires])

    return (
        <div>
            <h3>Transferts en cours</h3>

            {/* <Row>
                <Col xs={12} md={4}>Serveur</Col>
                <Col xs={12} md={3}>Upload</Col>
                <Col xs={12} md={3}>Download</Col>
            </Row> */}

            {listeServeurs && listeServeurs.length>0?
                listeServeurs.map(item=>{
                    const instance = instancesParId[item.instance_id]
                    return (
                        <ServeurSyncSecondaire key={item.instance_id} instance={instance} value={item} />
                    )
                })
            :
                <p>Aucuns transferts en cours.</p>
            }
        </div>
    )
}

function ServeurSyncSecondaire(props) {
    const { instance, value } = props

    console.debug("ServeurSyncSecondaire instance %O value %O", instance, value)

    const upload = value.upload,
          download = value.download

    return (
        <div>
            <Row>
                <Col xs={12}>
                    {instance.domaine || value.instance_id}
                </Col>
            </Row>
            <Row>
                {upload.termine?
                    <Col>Upload Termine</Col>
                    :
                    <>
                        <Col xs={3} md={2}>Upload</Col>
                        <TransfertInfo value={upload} />
                    </>
                }
            </Row>
            <Row>
                {download.termine?
                    <Col>Download Termine</Col>
                    :
                    <>
                        <Col xs={3} md={2}>Download</Col>
                        <TransfertInfo value={download} />
                    </>
                }
            </Row>
        </div>
    )
}

function TransfertInfo(props) {
    const { value } = props

    const [courant, progres] = useMemo(()=>{
        if(value.position_en_cours && value.taille_en_cours) {
            const progres = Math.floor(value.position_en_cours / value.taille_en_cours * 100)
            return [value.taille_en_cours, '' + progres + '%']
        }
        return ['', '']
    }, [value])

    if(!value || !value.nombre) return 'N/A'

    return ([
        <Col xs={3} md={2}key="nombre">{value.nombre} fichiers</Col>,
        <Col xs={3} md={2} xl={1} key="taille"><FormatteurTaille value={value.taille} /></Col>,
        <Col xs={3} md={2} xl={2} key="taux">
            {(value && value.taux > 1000)?
                <span><FormatteurTaille value={value.taux} />/s</span>
                :<span>N/A</span>
            }
        </Col>,
        <Col xs={6} md={4} xl={3} key="courantTaille">
            {courant?
                <span>Courant <FormatteurTaille value={courant} /> ({progres})</span>
            :''}
        </Col>
    ])
}

function toInt(val) {
    if(val === '') return null
    if(typeof(val) === 'string') return Number.parseInt(val)
    return val
}
