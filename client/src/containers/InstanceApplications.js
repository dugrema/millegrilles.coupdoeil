import React, {useState, useEffect, useCallback} from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import {proxy as comlinkProxy} from 'comlink'
import { Alert } from 'react-bootstrap'

function ApplicationsInstance(props) {
    
    const [catalogueApplications, setCatalogueApplications] = useState([])
    const [afficherModalConfiguration, setAfficherModalConfiguration] = useState(false)
    const [nomApplicationConfigurer, setNomApplicationConfigurer] = useState('')
    const [contenuConfiguration, setContenuConfiguration] = useState('')
    const [serveurUrl, setServeurUrl] = useState('https://fichiers:443')
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [attente, setAttente] = useState('')

    const workers = props.workers,
          instance = props.noeud,
          instanceId = props.noeud_id,
          securite = props.noeud.securite,
          connexion = workers.connexion

    useEffect(()=>{
        console.debug("ApplicationsInstance proppies %O", props)
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
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} />

            <h3>Applications installees</h3>
            
            <ListeApplicationsInstallees 
                workers={workers} instance={instance} 
                setAttente={setAttente} confirmationCb={confirmationCb} erreurCb={erreurCb} />

        </div>        
    )
}

export default ApplicationsInstance

function subscribe(workers, instanceId, securite, cb) {
    const connexion = workers.connexion
    connexion.enregistrerCallbackEvenementsApplications(instanceId, securite, cb)
        .catch(err=>console.error("enregistrerCallbackEvenementsApplications : %O", err))
}

function unsubscribe(workers, instanceId, securite, cb) {
    const connexion = workers.connexion
    connexion.retirerCallbackEvenementsApplications(instanceId, securite, cb)
        .catch(err=>console.error("retirerCallbackEvenementsApplications : %O", err))
}

function traiterEvenement(evenement) {
    console.debug("Recu evenement : %O", evenement)
}

function InstallerApplications(props) {

    const {workers, instance, confirmationCb, erreurCb} = props
    const connexion = workers.connexion
    const instanceId = instance.noeud_id,
          exchange = instance.securite

    const [catalogue, setCatalogue] = useState([])
    const [applicationInstaller, setApplicationInstaller] = useState('')

    const changeApplicationInstaller = useCallback(event=>{
        const value = event.currentTarget.value
        console.debug("Set application installer : %s", value)
        if(value) setApplicationInstaller(value)
    }, [setApplicationInstaller])

    const installerApplicationCb = useCallback(event=>{
        console.debug("Installer application %s", applicationInstaller)
        installerApplication(connexion, instanceId, applicationInstaller, exchange, confirmationCb, erreurCb)
    }, [applicationInstaller, connexion, instanceId, exchange, confirmationCb, erreurCb])

    useEffect(()=>{
        connexion.getCatalogueApplications()
            .then(applications=>{
                console.debug("Liste catalogues applications : %O", applications)
                applications = applications.sort((a,b)=>{ return a.nom.localeCompare(b.nom) })
                setCatalogue(applications)
            })
            .catch(err=>{
                console.error("Erreur chargement catalogues applications : %O", err)
                erreurCb(err, "Erreur chargement catalogues applications.")
            })
    }, [connexion])

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
                        disabled={!instance.actif || !connexion.estActif()}>Installer</Button>
            </Col>
        </Form.Group>
    )
}

function ListeApplicationsInstallees(props) {
    const {workers, instance, confirmationCb, erreurCb, setAttente} = props

    const [appsConfigurees, setAppsConfigurees] = useState([])
    const [modalApp, setModalApp] = useState('')

    const {noeud_id, applications_configurees, services, containers, securite} = instance || {}
    const instanceId = noeud_id

    useEffect(()=>{
        const infoInstance = {noeud_id, applications_configurees, services, containers}
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

    }, [setAppsConfigurees, noeud_id, applications_configurees, services, containers])
    
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
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} />

            {appsConfigurees.map(app=>(
                <Row key={app.nom}>
                    <Col md={4}>{app.description}</Col>
                    <Col md={2}><EtatApplication app={app} /></Col>
                    <BoutonsActionApplication 
                        workers={workers} app={app} instanceId={noeud_id} securite={securite} 
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

    const connexionActive = connexion.estActif()
    const appDemarree = app.etat === 'running',
          starting = app.etat === 'starting'

    const toggleApplicationCb = useCallback(
        event=>{
            const {value, checked} = event.currentTarget
            console.debug("Toggle application value: %s, checked: %O", value, checked)
            setAttente(true)
            if(checked) {
                installerApplication(connexion, instanceId, event.currentTarget.value, securite, confirmationCb, erreurCb) 
            } else {
                desinstallerApplication(connexion, instanceId, event.currentTarget.value, securite, confirmationCb, erreurCb)
            }
        }, [connexion, instanceId, securite, setAttente]
    )

    return [
        <Col key="switch" md={1}>
            <Form.Check id={"switch_app_" + app.nom} type="switch" 
                disabled={!connexionActive || starting} 
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

class ApplicationsNoeud extends React.Component {

    state = {
        catalogueApplications: [],


        afficherModalConfiguration: false,
        nomApplicationConfigurer: '',
        contenuConfiguration: '',
    }

    // componentDidMount() {
    //     // Charger catalogue d'applications disponibles
    //     const wsa = this.props.workers.connexion
    //     chargerCatalogueApplications(wsa, etat=>{this.setState(etat)})

    //     const noeudId = this.props.noeud.noeud_id
    //     const routingNoeud = traiterMessageEvenementApplications.map(item=>{return item.replace('__noeudId__', noeudId)})
    //     const securite = this.props.noeud.securite

    //     console.debug("Routing evenements noeuds securite %s : %O", securite, routingNoeud)

    //     wsa.subscribe(routingNoeud, this.traiterMessageEvenementApplications, {exchange: [securite]})
    // }

    // componentWillUnmount() {
    //     const wsa = this.props.workers.connexion

    //     const noeudId = this.props.noeud.noeud_id
    //     const routingNoeud = traiterMessageEvenementApplications.map(item=>{return item.replace('__noeudId__', noeudId)})
    //     const securite = this.props.noeud.securite

    //     wsa.unsubscribe(routingNoeud, this.traiterMessageEvenementApplications, {exchange: [securite]})
    // }

    configurerApplication = async event => {
        const wsa = this.props.workers.connexion
        const noeudId = this.props.noeud.noeud_id
        const securite = this.props.noeud.securite

        const nomApplication = event.currentTarget.value
        console.debug("Configurer application %s", nomApplication)

        try {
        const reponse = await wsa.requeteConfigurationApplication({
            noeud_id: noeudId, nom_application: nomApplication, exchange: securite
        })
        console.debug("Reponse configuration application : %O", reponse)
        const configuration = {}
        for(let key in reponse.configuration) {
            if( ! key.startsWith('_') ) {
            configuration[key] = reponse.configuration[key]
            }
        }
        const configurationString = JSON.stringify(configuration, null, 2)
        this.setState({
            nomApplicationConfigurer: nomApplication,
            contenuConfiguration: configurationString,
            afficherModalConfiguration: true
        })
        } catch(err) {
        console.error("Erreur chargement configuration application %s : %O", nomApplication, err)
        }
    }

    // desinstallerApplication = event => {
    //     const {value} = event.currentTarget
    //     const noeudId = this.props.noeud.noeud_id
    //     const securite = this.props.noeud.securite

    //     // console.debug("Desinstaller application %s", value)
    //     desinstallerApplication(this.props.workers.connexion, noeudId, value, securite)
    // }

    setApplicationInstaller = event => {
        const app = event.currentTarget.value
        this.setState({applicationSelectionnee: app})
    }

    // installerApplication = event => {
    //     const wsa = this.props.workers.connexion
    //     const app = this.state.applicationSelectionnee
    //     const noeud = this.props.noeud

    //     console.debug("Desinstaller application %s sur noeud %s", app, noeud.noeud_id)
    //     installerApplication(wsa, noeud, app)
    // }

    // traiterMessageEvenementApplications = comlinkProxy(event => {
    //     console.debug("Evenement monitor %O", event)
    //     var action = event.routingKey.split('.').pop()
    //     // console.debug("Action : %s", action)

    //     if(action === 'applicationDemarree') {
    //     const nomApplication = event.message.nom_application
    //     } else if(action === 'applicationArretee') {
    //     const nomApplication = event.message.nom_application
    //     } else if(action === 'erreurDemarrageApplication') {
    //     const nomApplication = event.message.nom_application
    //     console.error("Erreur demarrage application %s", nomApplication)
    //     }

    // })

    // changerContenuConfiguration = event => {
    //     this.setState({contenuConfiguration: event.currentTarget.value})
    // }

    appliquerConfiguration = async event => {
        // Valider que le JSON est correct
        const configurationStr = this.state.contenuConfiguration
        try {
        const configuration = JSON.parse(configurationStr)

        const wsa = this.props.workers.connexion
        const nomApplication = this.state.nomApplicationConfigurer
        const noeudId = this.props.noeud.noeud_id
        const securite = this.props.noeud.securite

        const reponse = await wsa.configurerApplication({
            nom_application: nomApplication,
            noeud_id: noeudId,
            configuration,
            exchange: securite,
        })
        console.debug("Reponse configuration %O", reponse)

        this.setState({afficherModalConfiguration: false})
        } catch(err) {
        console.error("JSON de configuration invalide : %O", err)
        }
    }

    // demarrerApplication = async event => {
    //     const nomApplication = event.currentTarget.value
    //     const noeudId = this.props.noeud.noeud_id
    //     const securite = this.props.noeud.securite

    //     const wsa = this.props.workers.connexion

    //     // console.debug("Demarrer application %s sur noeud %s", nomApplication, noeudId)
    //     const reponse = await wsa.demarrerApplication({
    //     nom_application: nomApplication, noeud_id: noeudId, exchange: securite
    //     })
    //     // console.debug("Reponse demarrer application : %O", reponse)
    // }

    render() {

        const modalConfiguration = (
        <ModalConfigurationApplication nomApplication={this.state.nomApplicationConfigurer}
                                        show={this.state.afficherModalConfiguration}
                                        configuration={this.state.contenuConfiguration}
                                        changerConfiguration={this.changerContenuConfiguration}
                                        annuler={_=>this.setState({afficherModalConfiguration: false})}
                                        appliquer={this.appliquerConfiguration} />
        )

        const appConfigurees = {}
        // if(this.props.noeud) {
        //     if(this.props.noeud.applications_configurees) {
        //         for(let idx in this.props.noeud.applications_configurees) {
        //         const app = this.props.noeud.applications_configurees[idx]
        //         // console.debug("Application configuree %O", app)
        //         appConfigurees[app.nom] = app
        //         }
        //     }
        //     if(this.props.noeud.services) {
        //         for(let nomService in this.props.noeud.services) {
        //         var service = this.props.noeud.services[nomService]
        //         if(service.labels && service.labels.application) {
        //             var infoApp = {
        //             nom: service.labels.application,
        //             etat: service.etat,
        //             nomService: nomService,
        //             service,
        //             }

        //             // Mettre a jour appConfigurees
        //             var configApp = appConfigurees[infoApp.nom]
        //             if(configApp) infoApp = {...configApp, ...infoApp}
        //             appConfigurees[infoApp.nom] = infoApp
        //         }
        //         }
        //     }
        //     if(this.props.noeud.containers) {
        //         // console.debug("Containers : %O", this.props.noeud.containers)
        //         for(let nomContainer in this.props.noeud.containers) {
        //         const container = this.props.noeud.containers[nomContainer]
        //         if(container && container.labels && container.labels.application) {
        //             // C'est un container d'application
        //             var infoApp = {
        //             nom: container.labels.application,
        //             nomContainer: nomContainer,
        //             modeContainer: container.labels.mode_container,
        //             etat: container.etat,
        //             running: container.running,
        //             }

        //             // Mettre a jour appConfigurees
        //             var configApp = appConfigurees[infoApp.nom]
        //             if(configApp) infoApp = {...configApp, ...infoApp}
        //             appConfigurees[infoApp.nom] = infoApp
        //         }
        //         }
        //     }
        // }

        // console.debug("Applications configurees : %O", appConfigurees)

        const noeud = this.props.noeud || {}

        // Trier liste, render
        const appListe = Object.values(appConfigurees)
        appListe.sort((a,b)=>{ return a.nom.localeCompare(b.nom) })
        // console.debug("Apps, liste:\n%O", appListe)

        // console.debug("ROOT PROPS \n%O", this.props.rootProps)

        const apps = appListe.map(app=>{
            var boutonsActif = noeud.actif && this.props.rootProps.modeProtege
            var boutonsInactif = boutonsActif

            var etat = <span>inactif</span>
            if(app.etat === 'running') {
                etat = <span>actif</span>
                boutonsInactif = false
            } else {
                boutonsActif = false
            }

            const etatApplication = this.props.evenementApplication[app.nom]
            if(etatApplication) {
                etat = <span>{etatApplication}</span>
            }

            return (
                <div key={app.nom}>
                {modalConfiguration}

                <Row key={app.nom}>
                    <Col md={3}>{app.nom}</Col>
                    <Col md={2}>{etat}</Col>
                    <Col md={7}>
                    <ButtonGroup aria-label={"Boutons de controle d'application " + app.nom}>
                        <Button onClick={this.demarrerApplication} value={app.nom}
                                disabled={!boutonsInactif}
                                variant="secondary">Demarrer</Button>
                        <Button onClick={this.desinstallerApplication} value={app.nom}
                                disabled={!boutonsActif && !boutonsInactif}
                                variant="secondary">Arreter</Button>
                        <Button onClick={this.configurerApplication} value={app.nom}
                                disabled={!boutonsActif && !boutonsInactif}
                                variant="secondary">Configurer</Button>
                        <Button onClick={this.props.backupApplication} value={app.nom}
                                disabled={!boutonsActif && !boutonsInactif}
                                variant="secondary">Backup</Button>
                        <Button onClick={this.props.restaurer} value={app.nom}
                                disabled={!boutonsActif && !boutonsInactif}
                                variant="secondary">Restaurer</Button>
                    </ButtonGroup>
                    </Col>
                </Row>
                </div>
            )
        })

        const catalogueApps = this.state.catalogueApplications.map(app=>{
            return (<option key={app.nom} name={app.nom}>{app.nom}</option>)
        })

        return (
            <div>
                <h2>Applications</h2>

                <h3>Parametres</h3>

                <Form.Group controlId="installer_application" as={Row}>
                <Form.Label column md={3}>Installer une application</Form.Label>
                <Col md={7}>
                    <Form.Select
                    type="text"
                    placeholder="Choisir une application"
                    onChange={this.setApplicationInstaller}>
                    {catalogueApps}
                    </Form.Select>
                </Col>
                <Col md={2}>
                    <Button onClick={this.installerApplication}
                            disabled={!noeud.actif || !this.props.rootProps.modeProtege}>Installer</Button>
                </Col>
                </Form.Group>

                <Form.Group controlId="serveur_backup" as={Row}>
                <Form.Label column md={3}>Serveur de backup</Form.Label>
                <Col md={7}>
                    <Form.Control onChange={this.props.setServeurUrl}
                                value={this.props.serveurUrl}
                                placeholder="E.g. https://fichiers:443" />
                </Col>
                <Col md={2}>
                </Col>
                </Form.Group>

                <h3>Applications deployees</h3>
                {apps}

            </div>
        )
    }
}

function ModalConfigurationApplication(props) {

    console.debug("ModalConfigurationApplication proppys : %O", props)

    const show = props.show?true:false
    const {workers, instanceId, securite, fermer, app, confirmationCb, erreurCb} = props
    const {connexion} = workers
    const { nom, description } = app

    const [configurationMaj, setConfigurationMaj] = useState('')

    const onChangeCb = useCallback(event=>{
        const value = event.currentTarget.value
        setConfigurationMaj(value)
    }, [setConfigurationMaj])

    const appliquer = useCallback(()=>{
        configurerApplication(workers, instanceId, securite, nom, configurationMaj, confirmationCb, erreurCb)
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
    let configuration = ''
    try {
        const configuration = JSON.parse(configurationStr)
    } catch(err) {
        console.error("JSON de configuration invalide : %O", err)
        erreurCb(err, `JSON de configuration invalide`)
        return
    }

    try {
        const connexion = workers.connexion

        const reponse = await connexion.configurerApplication({
            nom_application: nom,
            noeud_id: instanceId,
            configuration,
            exchange: securite,
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

async function chargerCatalogueApplications(wsa, setState) {
    // const domaineAction = 'CatalogueApplications.listeApplications'
    // var applications = await wsa.transmettreRequete(domaineAction, {})

    var applications = await wsa.getCatalogueApplications()

    // console.debug("Applications du catalogue :\n%O", applications)

    applications = applications.sort((a,b)=>{ return a.nom.localeCompare(b.nom) })

    setState({catalogueApplications: applications})
}

async function installerApplication(connexion, instanceId, nomApplication, exchange, confirmationCb, erreurCb) {
    // Charger l'information complete du catalogue pour configurer l'installation
    try {
        const requete = { 'nom': nomApplication }
        const configuration = await connexion.requeteInfoApplications(requete)
        console.debug("Installation application avec configuration : %O", configuration)

        const params = { 'nom_application': nomApplication, configuration, noeudId: instanceId, exchange }
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

async function desinstallerApplication(connexion, instanceId, nomApplication, securite, confirmationCb, erreurCb) {
    try {
        const params = { noeudId: instanceId, 'nom_application': nomApplication, exchange: securite }
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

function AlertTimeout(props) {

    const message = props.message,
          setMessage = props.setMessage,
          setError = props.setError,
          err = props.err,
          delay = props.delay || 10000,
          variant = props.variant || 'success'

    const [timeoutSucces, setTimeoutSucces] = useState('')

    const titre = err?'Erreur':'Success'

    const closeCb = useCallback(()=>{
        if(setError) setError('')
        setMessage('')
    }, [setMessage, setError])

    useEffect(()=>{
        if(delay && message && !timeoutSucces) {
            // Activer timeout
            setTimeoutSucces(setTimeout(()=>setMessage(''), delay))
        }
    }, [message, timeoutSucces, setTimeoutSucces, delay])

    useEffect(()=>{
        if(!message && timeoutSucces) {
            // Desactiver timeout
            clearTimeout(timeoutSucces)
            setTimeoutSucces('')
        }
    }, [message, timeoutSucces, setTimeoutSucces, delay])

    return (
        <Alert show={message?true:false} variant={variant} onClose={closeCb} dismissible>
            <Alert.Heading>{titre}</Alert.Heading>
            {message}
            <ShowStackTrace err={err} />
        </Alert>
    )
}

function ShowStackTrace(props) {
    const err = props.err

    if(!err) return ''

    let stack = ''
    if(err.stack) {
        console.debug("Stack : %O", err.stack)
        stack = (
            <>
                <p>{''+err}</p>
                <pre>{err.stack}</pre>
            </>
        )
    } else {
        stack = <p>{''+err}</p>
    }

    return (
        <>
            <p>Stack trace</p>
            <pre className="stack">{stack}</pre>
        </>
    )
}

function ModalAttente(props) {

    const show = props.show

    return (
        <Modal show={show?true:false}>
            <Modal.Header>En cours...</Modal.Header>
            <Modal.Footer>
                <Button disabled={true} variant="secondary">Annuler</Button>
            </Modal.Footer>
        </Modal>
    )

}
