import React, {useState, useEffect, useCallback} from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import {proxy as comlinkProxy} from 'comlink'

import { AlertTimeout, ModalAttente } from '@dugrema/millegrilles.reactjs'

import useWorkers, { useUsager, useEtatPret } from '../WorkerContext'

function ApplicationsInstance(props) {
    
    const [serveurUrl, setServeurUrl] = useState('https://fichiers:443')
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [attente, setAttente] = useState('')

    const instance = props.instance,
          instanceId = instance.instance_id,
          securite = props.instance.securite

    const workers = useWorkers(),
          etatPret = useEtatPret()

    useEffect(()=>{
        // console.debug("ApplicationsInstance proppies %O", props)
        const cb = comlinkProxy(traiterEvenement)
        subscribe(workers, instanceId, securite, cb)
        return () => unsubscribe(workers, instanceId, securite, cb)
    }, [workers, instanceId, securite])

    const confirmationCb = useCallback( 
        confirmation => {
            setConfirmation(confirmation)
            setAttente('')  // Reset attente
        },
        [setConfirmation, setAttente] 
    )

    const erreurCb = useCallback(
        (err, message) => { 
            console.debug("Set erreurs %O, %s", err, message)
            setError(err)
            if(message) setErrorMessage(message)
            else setErrorMessage(''+err)
            setAttente('')  // Reset attente
        }, 
        [setError, setErrorMessage, setAttente]
    )

    return (
        <div>
            <h2>Applications</h2>

            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />

            <h3>Parametres</h3>

            <Form.Group controlId="serveur_backup" as={Row}>
                <Form.Label column md={3}>Serveur de backup</Form.Label>
                <Col md={7}>
                    <Form.Control onChange={setServeurUrl}
                                  value={serveurUrl}
                                  placeholder="E.g. https://fichiers:443" />
                </Col>
            </Form.Group>

            <h3>Installer une nouvelle application</h3>

            <InstallerApplications 
                workers={workers} 
                instance={instance} 
                setAttente={setAttente}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb}
                etatConnexion={etatPret} />

            <h3>Applications installees</h3>
            
            <ListeApplicationsInstallees 
                workers={workers} instance={instance} etatConnexion={etatPret}
                setAttente={setAttente} confirmationCb={confirmationCb} erreurCb={erreurCb} />

        </div>        
    )
}

export default ApplicationsInstance

function subscribe(workers, instanceId, securite, cb) {
    const connexion = workers.connexion
    if(securite === '4.secure') securite = '3.protege'  // Downgrade instance secure
    console.debug("Subscribe %s %s, cb : %O", securite, instanceId, cb)
    connexion.enregistrerCallbackEvenementsApplications(instanceId, securite, cb)
        .catch(err=>console.error("enregistrerCallbackEvenementsApplications : %O", err))
}

function unsubscribe(workers, instanceId, securite, cb) {
    const connexion = workers.connexion
    if(securite === '4.secure') securite = '3.protege'  // Downgrade instance secure
    console.debug("Unsubscribe %s %s, cb : %O", securite, instanceId, cb)
    connexion.retirerCallbackEvenementsApplications(instanceId, securite, cb)
        .catch(err=>console.error("retirerCallbackEvenementsApplications : %O", err))
}

function traiterEvenement(evenement) {
    console.debug("traiterEvenement Recu evenement application : %O", evenement)
}

function InstallerApplications(props) {

    const {workers, instance, setAttente, confirmationCb, erreurCb} = props
    const connexion = workers.connexion
    const instanceId = instance.instance_id,
          exchange = instance.securite

    const etatPret = useEtatPret()

    const [catalogue, setCatalogue] = useState([])
    const [applicationInstaller, setApplicationInstaller] = useState('')

    const changeApplicationInstaller = useCallback(event=>{
        const value = event.currentTarget.value
        console.debug("Set application installer : %s", value)
        if(value) setApplicationInstaller(value)
    }, [setApplicationInstaller])

    const installerApplicationCb = useCallback(event=>{
        console.debug("Installer application %s", applicationInstaller)
        setAttente(true)
        let securite = exchange
        if(securite === '4.secure') securite = '3.protege'  // Downgrade instance secure
        installerApplication(connexion, instanceId, applicationInstaller, securite, confirmationCb, erreurCb)
    }, [applicationInstaller, connexion, instanceId, exchange, setAttente, confirmationCb, erreurCb])

    useEffect(()=>{
        const securite = instance.securite
        let niveaux = ['1.public']
        if(['2.prive', '3.protege', '4.secure'].includes(securite)) niveaux.push('2.prive')
        if(['3.protege', '4.secure'].includes(securite)) niveaux.push('3.protege')
        if(securite === '4.secure') niveaux.push('4.secure')

        connexion.getCatalogueApplications()
            .then(reponse=>{
                console.debug("Liste catalogues applications : %O", reponse)
                let applications = reponse.resultats
                // Filtrer les niveaux de securite des applications
                applications = applications.filter(item=>{
                    if(item.securite) {
                        return niveaux.includes(item.securite)
                    }
                    return true
                }).sort((a,b)=>{ return a.nom.localeCompare(b.nom) })
                setCatalogue(applications)
            })
            .catch(err=>{
                console.error("Erreur chargement catalogues applications : %O", err)
                erreurCb(err, "Erreur chargement catalogues applications.")
            })
    }, [connexion, instance])

    return (
        <Form.Group controlId="installer_application" as={Row}>
            <Form.Label column md={3}>Installer une application</Form.Label>
            <Col md={7}>
                <Form.Select
                    type="text"
                    placeholder="Choisir une application"
                    onChange={changeApplicationInstaller}>
                    
                    <option value="">Choisir une application</option>
                    {catalogue.map(app=>{
                        return <option key={app.nom} value={app.nom}>{app.nom}</option>
                    })}

                </Form.Select>
            </Col>
            <Col md={2}>
                <Button variant="secondary" onClick={installerApplicationCb}
                        disabled={instance.expire || !etatPret}>Installer</Button>
            </Col>
        </Form.Group>
    )
}

function ListeApplicationsInstallees(props) {
    const {workers, instance, confirmationCb, erreurCb, setAttente} = props

    const [appsConfigurees, setAppsConfigurees] = useState([])
    const [modalApp, setModalApp] = useState('')

    const {instance_id, applications_configurees, services, containers, securite} = instance || {}
    const instanceId = instance_id

    const etatPret = useEtatPret()

    useEffect(()=>{
        const infoInstance = {instance_id, applications_configurees, services, containers}
        console.debug("Changement liste applications : %O", infoInstance)
        const listeApplications = extraireListeApplications(infoInstance)        

        const lang = 'fr'
        const appListe = Object.values(listeApplications).map(app=>{
            let descriptionApp = app.nom
            if(app.descriptions) {
                descriptionApp = app.descriptions[lang] || app.descriptions['default'] || descriptionApp
            }
            return {...app, description: descriptionApp}
        })
        appListe.sort( (a,b) => a.description.localeCompare(b.description) )

        console.debug("Apps configurees : %O", appListe)
        setAppsConfigurees(appListe)

    }, [setAppsConfigurees, instance_id, applications_configurees, services, containers])
    
    console.debug("ModalApp : %O", modalApp)

    return (
        <>
            <ModalConfigurationApplication 
                workers={workers}
                show={modalApp?true:false} 
                instanceId={instanceId}
                securite={securite}
                app={modalApp}
                fermer={()=>setModalApp('')} 
                setAttente={setAttente}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} />

            {appsConfigurees.map(app=>(
                <Row key={app.nom}>
                    <Col md={4}>{app.description}</Col>
                    <Col md={2}><EtatApplication app={app} /></Col>
                    <BoutonsActionApplication 
                        workers={workers} app={app} instanceId={instance_id} securite={securite} 
                        configurer={()=>setModalApp(app)}
                        setAttente={setAttente} confirmationCb={confirmationCb} erreurCb={erreurCb} />
                </Row>
            ))}
        </>
    )
}

function EtatApplication(props) {
    const app = props.app || {},
          etatService = app.etat || 'arretee'
    
    return etatService
}

function BoutonsActionApplication(props) {

    const {instanceId, securite, setAttente, confirmationCb, erreurCb, configurer} = props
    const connexion = props.workers.connexion
    const app = props.app || {}

    const appDemarree = app.etat === 'running',
          starting = app.etat === 'starting'

    const etatPret = useEtatPret()

    const toggleApplicationCb = useCallback(
        event=>{
            const {value, checked} = event.currentTarget
            console.debug("Toggle application value: %s, checked: %O", value, checked)
            setAttente(true)
            let securiteMessage = securite
            if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
    
            if(checked) {
                demarrerApplication(connexion, instanceId, event.currentTarget.value, securiteMessage, confirmationCb, erreurCb) 
            } else {
                // desinstallerApplication(connexion, instanceId, event.currentTarget.value, securite, confirmationCb, erreurCb)
                arreterApplication(connexion, instanceId, event.currentTarget.value, securiteMessage, confirmationCb, erreurCb)
            }
        }, [connexion, instanceId, securite, setAttente]
    )

    const supprimerCb = useCallback(
        event=>{
            console.debug("Supprimer application value: %s", app.nom)
            //setAttente(true)
            let securiteMessage = securite
            if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
            supprimerApplication(connexion, instanceId, app.nom, securiteMessage, confirmationCb, erreurCb) 
        },[connexion, instanceId, securite, setAttente]
    )

    return [
        <Col key="switch" md={1}>
            <Form.Check id={"switch_app_" + app.nom} type="switch" 
                disabled={!etatPret || starting} 
                checked={appDemarree || starting}
                value={app.nom}
                onChange={toggleApplicationCb}
            />
        </Col>,
        <Col key="dropdown" md={5}>
            <Dropdown>
                <Dropdown.Toggle variant="secondary" id="dropdown-basic" 
                    aria-label={"Boutons de controle d'application " + app.description}>
                    Actions
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item onClick={configurer}>Configurer</Dropdown.Item>
                    <Dropdown.Item onClick={supprimerCb}>Supprimer</Dropdown.Item>
                    {/*                     
                    <Dropdown.Item href="#/action-2">Backup</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">Restaurer</Dropdown.Item>
                     */}
                </Dropdown.Menu>
            </Dropdown>
        </Col>
    ]
            
}

function extraireListeApplications(instance) {
    console.debug("Extraire applications de %O", instance)
    if(!instance || !instance.applications_configurees) return {}  // Aucunes applications installees

    // Inserer les applications dans un dict par nom
    const applicationsParNom = instance.applications_configurees.reduce((acc, item)=>{ acc[item.nom] = item; return acc }, {})

    const services = instance.services || {},
          container = instance.containers || {}
    const appsRunning = {...services, ...container}

    Object.keys(appsRunning).forEach(nomService=>{
        const service = appsRunning[nomService]
        if(service.labels && service.labels.application) {
            const labels = service.labels
            const nom = labels.application
            const modeContainer = labels.mode_container
            const etat = service.etat
            const running = service.running
    
            // Extraire descriptions de l'application
            const descriptions = Object.keys(labels).reduce((acc, item)=>{
                if(item.startsWith("description_")) {
                    const lang = item.split('_').pop()
                    acc[lang] = labels[item]
                }
                return acc
            }, {})
            descriptions['default'] = nom
            
            const infoApp = { nomService, nom, service, etat, modeContainer, running, descriptions }
            
            // Merge
            let app = applicationsParNom[nom] || {}
            app = {...app, ...infoApp}
            applicationsParNom[nom] = app
        }
    })

    console.debug("Dict applications par nom : %O", applicationsParNom)
    return applicationsParNom
}

function ModalConfigurationApplication(props) {

    console.debug("ModalConfigurationApplication proppys : %O", props)

    const show = props.show?true:false
    const {workers, instanceId, securite, fermer, app, setAttente, confirmationCb, erreurCb} = props
    const {connexion} = workers
    const { nom, description } = app

    const [configurationMaj, setConfigurationMaj] = useState('')

    const onChangeCb = useCallback(event=>{
        const value = event.currentTarget.value
        setConfigurationMaj(value)
    }, [setConfigurationMaj])

    const appliquer = useCallback(()=>{
        let securiteMessage = securite
        if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
        configurerApplication(workers, instanceId, securiteMessage, nom, configurationMaj, confirmationCb, erreurCb)
            .then(()=>fermer())
            .catch(err=>console.error("Erreur configurerApplication : %O", err))
    }, [workers, instanceId, securite, nom, configurationMaj, confirmationCb, erreurCb])

    // Appliquer changement/reload
    useEffect( () => {
        if(!nom) return setConfigurationMaj('') // Rien a faire
        console.debug("Charger configuration application %s", nom)
    
        connexion.requeteConfigurationApplication({
            nom_application: nom, instanceId, exchange: securite
        })
        .then(reponse=>{
            console.debug("Reponse configuration application : %O", reponse)
            if(reponse.err) {
                erreurCb(reponse.err, `Erreur chargement configuration de ${nom}`)
                return
            }
            const messageConfiguration = reponse.configuration
            console.debug("Reponse messageConfiguration : %O", messageConfiguration)
            const configuration = Object
                .keys(messageConfiguration)
                .filter(key => !key.startsWith('_') && key !== 'en-tete')
                .reduce((acc, key)=>{
                    const value = messageConfiguration[key]
                    acc[key] = value
                    return acc
                },{})

            const configurationString = JSON.stringify(configuration, null, 2)
            setConfigurationMaj(configurationString)
        })
        .catch(err=>{
            console.error("Erreur chargement configuration application %s : %O", nom, err)
            erreurCb(err, `Erreur chargement configuration application ${nom}`)
        })
    }, [connexion, fermer, instanceId, securite, nom, setConfigurationMaj, confirmationCb, erreurCb])

    return (
        <Modal show={show} fullscreen={show} onHide={fermer}>

            <Modal.Header closeButton>
                <Modal.Title>Configurer {description}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Group>
                <Form.Control 
                    as="textarea" rows="20"
                    value={configurationMaj}
                    onChange={onChangeCb} />
                </Form.Group>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={fermer}>Annuler</Button>
                <Button onClick={appliquer}>Appliquer</Button>
            </Modal.Footer>

        </Modal>
    )

}

async function configurerApplication(workers, instanceId, securite, nom, configurationStr, confirmationCb, erreurCb) {
    console.debug("Configurer application %s avec %O", nom, configurationStr)
    // let configuration = ''
    try {
        var configuration = JSON.parse(configurationStr)
    } catch(err) {
        console.error("JSON de configuration invalide : %O", err)
        erreurCb(err, `JSON de configuration invalide`)
        return
    }

    try {
        const connexion = workers.connexion

        let securiteMessage = securite
        if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
        const reponse = await connexion.configurerApplication({
            nom_application: nom,
            instance_id: instanceId,
            configuration,
            exchange: securiteMessage,
        })

        console.debug("Reponse configuration %O", reponse)
        if(reponse.err) {
            erreurCb(reponse.err, `Erreur durant la commande de configuraiton de ${nom}`)
        } else {
            confirmationCb(`Configuration de ${nom} appliquee avec success.`)
        }
    } catch(err) {
        console.error("JSON de configuration invalide : %O", err)
        erreurCb(err, `JSON de configuration invalide`)
        return
    }
}

async function installerApplication(connexion, instanceId, nomApplication, exchange, confirmationCb, erreurCb) {
    // Charger l'information complete du catalogue pour configurer l'installation
    try {
        const requete = { 'nom': nomApplication }
        const configuration = await connexion.requeteInfoApplications(requete)
        console.debug("Installation application avec configuration : %O", configuration)

        const params = { 'nom_application': nomApplication, configuration, instance_id: instanceId, exchange }
        console.debug("Transmettre commande installation application vers %s :\n%O", instanceId, params)

        const reponseInstallerApplication = await connexion.installerApplication(params)
        if(reponseInstallerApplication.err) {
            console.error("Erreur installation application %s : %O", nomApplication, reponseInstallerApplication.err)
            erreurCb(reponseInstallerApplication.err, `Erreur installation application ${nomApplication}`)
        } else {
            console.debug("Reponse installation application : %O", reponseInstallerApplication)
            confirmationCb(`Application ${nomApplication} installee, demarrage en cours.`)
        }
    } catch(err) {
        console.error("Erreur installation application %s : %O", nomApplication, err)
        erreurCb(err, `Erreur installation application ${nomApplication}`)
    }
}

async function supprimerApplication(connexion, instanceId, nomApplication, securite, confirmationCb, erreurCb) {
    try {
        let securiteMessage = securite
        if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
        const params = { instance_id: instanceId, 'nom_application': nomApplication, exchange: securiteMessage }
        console.debug("desinstallerApplication: Transmettre commande %O", params)
    
        const reponse = await connexion.supprimerApplication(params)
        if(reponse.err) {
            console.error("Erreur desinstaller application : %O", reponse.err)
            erreurCb(reponse.err, `Erreur desinstallation application ${nomApplication}`)
        } else {
            console.debug("Reponse desinstallation application : %O", reponse)
            confirmationCb(`Application ${nomApplication} desinstallee.`)
        }
    } catch(err) {
        console.error("Erreur desinstallation application %s : %O", nomApplication, err)
        erreurCb(err, `Erreur desinstallation application ${nomApplication}`)
    }
}

async function demarrerApplication(connexion, instanceId, nomApplication, securite, confirmationCb, erreurCb) {
    try {
        let securiteMessage = securite
        if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
        console.debug("Demarrer application %s sur instance %s", nomApplication, instanceId)
        const reponse = await connexion.demarrerApplication({
            nom_application: nomApplication, instance_id: instanceId, exchange: securiteMessage
        })
        if(reponse.err) {
            erreurCb(reponse.err, `Erreur de demarrage de l'application ${nomApplication}`)
        } else {
            confirmationCb(`Application ${nomApplication} en cours de demarrage.`)
        }
    } catch (err) {
        console.error("Erreur de demarrage de l'application %s : %O", nomApplication, err)
        erreurCb(err, `Erreur de demarrage de l'application ${nomApplication}`)
    }
}

async function arreterApplication(connexion, instanceId, nomApplication, securite, confirmationCb, erreurCb) {
    try {
        let securiteMessage = securite
        if(securiteMessage === '4.secure') securiteMessage = '3.protege'  // Downgrade instance secure
        const params = { instance_id: instanceId, 'nom_application': nomApplication, exchange: securiteMessage }
        console.debug("arreterApplication: Transmettre commande %O", params)
    
        const reponse = await connexion.arreterApplication(params)
        if(reponse.err) {
            console.error("Erreur arreter application : %O", reponse.err)
            erreurCb(reponse.err, `Erreur arreter application ${nomApplication}`)
        } else {
            console.debug("Reponse arreter application : %O", reponse)
            confirmationCb(`Application ${nomApplication} arretee.`)
        }
    } catch(err) {
        console.error("Erreur arreter application %s : %O", nomApplication, err)
        erreurCb(err, `Erreur arreter application ${nomApplication}`)
    }
}
