import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'

import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import Alert from 'react-bootstrap/Alert'

import useWorkers, { useEtatPret } from '../WorkerContext'

function Notifications(props) {

    const { fermer } = props

    const { t } = useTranslation()
    const workers = useWorkers(),
          etatPret = useEtatPret()

    const [configuration, setConfiguration] = useState('')

    const [domaineActif, setDomaineActif] = useState('')

    const [cleChiffrageSmtp, setCleChiffrageSmtp] = useState('')

    const [emailFrom, setEmailFrom] = useState('')
    const [intervalleMin, setIntervalleMin] = useState('')

    const [smtpActif, setSmtpActif] = useState(false)
    const [smtpHostname, setSmtpHostname] = useState('')
    const [smtpPort, setSmtpPort] = useState('')
    const [smtpUsername, setSmtpUsername] = useState('')
    const [smtpPassword, setSmtpPassword] = useState('')
    const [smtpReplyto, setSmtpReplyto] = useState('')
      
    const [webpushActif, setWebpushActif] = useState(false)
    const [iconWebpush, setIconWebpush] = useState('')

    const [clepubliqueWebpush, setClepubliqueWebpush] = useState('')

    const intervallMinChangeHandler = useCallback(event=>{
        const valeur = validerNombre(event, 30, 86400)
        if(valeur !== undefined) setIntervalleMin(valeur)
    }, [setIntervalleMin])

    const sauvegarderHandler = useCallback( event => {

        const smtpDechiffre = {
            smtp_password: smtpPassword, 
        }

        const commande = {
            email_from: emailFrom, 
            intervalle_min: intervalleMin?intervalleMin:null, 
            
            smtp: {
                actif: smtpActif, 
                hostname: smtpHostname, 
                port: smtpPort?smtpPort:null, 
                username: smtpUsername, 
                replyto: smtpReplyto,
            },

            webpush: {
                actif: webpushActif, 
                icon: iconWebpush,
            }
        }

        Promise.resolve()
            .then(async ()=>{
                const {documentChiffre: docSmtp, commandeMaitredescles: mcSmtp} = 
                    await chiffrerChamps(workers, 'config_notif_smtp', cleChiffrageSmtp, smtpDechiffre)
                commande.smtp.chiffre = docSmtp

                const cles = {}
                if(mcSmtp) cles.smtp = mcSmtp

                console.debug("Commande sauvegarder ", commande)
                await workers.connexion.conserverConfigurationNotifications(commande, cles)
                fermer()
            })
            .catch(err=>{
                console.error("Erreur sauvegarde configuration : ", err)
            })

    }, [
        workers, fermer,
        emailFrom, intervalleMin, smtpActif, smtpHostname, smtpPort, smtpUsername, smtpPassword, smtpReplyto,
        webpushActif, iconWebpush,
        cleChiffrageSmtp, 
    ])
    
    const genererCleWebpushHandler = useCallback(()=>{
        const { connexion } = workers
        connexion.genererClewebpushNotifications()
            .then(reponse=>{
                console.debug("Reponse generer web push ", reponse)
                if(reponse.ok !== false) {
                    setClepubliqueWebpush(reponse.webpush_public_key)
                } else {
                    console.error("genererCleWebpushHandler Erreur generer cle webpush : ", reponse.err)
                }
            })
            .catch(err=>console.error("Erreur generer cle webpush ", err))
    }, [workers, setClepubliqueWebpush])

    useEffect(()=>{
        // Detecter si le domaine "Messagerie" est actif en chargeant la configuration des notifications
        if(etatPret === false || domaineActif !== '') return  // Rien a faire
        const { connexion } = workers
        connexion.getConfigurationNotifications()
            .then(reponse=>{
                console.debug("Reponse configuration ", reponse)
                setDomaineActif(true)  // On a eu une reponse
                // Set configuration
                if(reponse.ok !== false) {
                    setConfiguration(reponse)
                }
            })
            .catch(err=>{
                console.error("Erreur chargement configuration notifications ", err)
                setDomaineActif(false)  // Aucune reponse (timeout) ou autre erreur
            })
    }, [workers, domaineActif, etatPret, setDomaineActif, setConfiguration])

    useEffect(()=>{
        console.debug("Appliquer configuration recue : ", configuration)

        setEmailFrom(configuration.email_from || '')
        setIntervalleMin(configuration.intervalle_min || '')
        
        const { smtp, webpush, webpush_public_key } = configuration

        setClepubliqueWebpush(webpush_public_key)

        if(smtp) {
            const dataChiffre = smtp.chiffre
            if(dataChiffre) {
                dechiffrer(workers, dataChiffre)
                    .then(resultat=>{
                        console.debug("Resultat dechiffrage smtp ", resultat)
                        if(resultat) {
                            if(resultat.cle) {
                                setCleChiffrageSmtp(resultat.cle)
                            }
                            const dataDechiffre = resultat.dataDechiffre || {}
                            if(dataDechiffre.smtp_password) {
                                setSmtpPassword(dataDechiffre.smtp_password)
                            }
                        }
                    })
                    .catch(err=>console.error("Erreur dechiffrage cle smtp : ", err))
            }
            setSmtpActif(smtp.actif || false)
            setSmtpHostname(smtp.hostname || '')
            setSmtpPort(smtp.port || '')
            setSmtpUsername(smtp.username || '')
            setSmtpReplyto(smtp.replyto || '')
        }

        if(webpush) {
            setWebpushActif(webpush.actif || false)
            setIconWebpush(webpush.icon || '')
        }

    }, [
        configuration, 
        setCleChiffrageSmtp,
        setEmailFrom, setIntervalleMin,
        setSmtpActif, setSmtpHostname, setSmtpPort, setSmtpUsername, setSmtpPassword, setSmtpReplyto,
        setWebpushActif, setIconWebpush,
    ])

    let messageErreur = useMemo(()=>{
        if(domaineActif === '') {
            return (
                <p>Chargement de la configuration en cours</p>
            )
        } else if(domaineActif === false) {
            return (
                <Alert variant='warning'>
                    <Alert.Heading>Notifications non disponible</Alert.Heading>
                    <p>Il faut installer le domaine Messagerie ou le redemarrer.</p>                
                </Alert>
            )
        }
    }, [domaineActif])

    if(messageErreur) return (
        <div>
            <Row>
                <Col xs={10} md={11}>
                    <h2><Trans>Notifications.titre</Trans></h2>
                </Col>
                <Col xs={2} md={1} className="bouton">
                    <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
                </Col>
            </Row>

            <p></p>

            {messageErreur}

        </div>
    )

    return (
        <div>
            <Row>
                <Col xs={10} md={11}>
                    <h2><Trans>Notifications.titre</Trans></h2>
                </Col>
                <Col xs={2} md={1} className="bouton">
                    <Button onClick={fermer} variant="secondary"><i className='fa fa-remove'/></Button>
                </Col>
            </Row>

            <p></p>

            <Row>
                <Form.Group as={Col}>
                    <Form.Label>Adresse email 'From'</Form.Label>
                    <FormControl id="fromSmtp" aria-describedby="fromSmtp"
                        placeholder="exemple : mail@myserver.com"
                        value={emailFrom}
                        onChange={event=>setEmailFrom(event.currentTarget.value)} />
                    <Form.Text>Note : l'adresse email est utilisee comme reference pour toutes les notifications.</Form.Text>
                </Form.Group>
            </Row>

            <Row>
                <Form.Group as={Col}>
                    <Form.Label>Intervalle minimal entre notifications (secs)</Form.Label>
                    <FormControl id="fromSmtp" aria-describedby="fromSmtp"
                        placeholder="exemple : 120 (pour 2 minutes)"
                        value={intervalleMin}
                        onChange={intervallMinChangeHandler} />
                    <Form.Text>Note : la valeur doit etre entre 30 et 86400 secondes (entre 30 secondes et 1 jour)</Form.Text>
                </Form.Group>
            </Row>

            <p></p>

            <ConfigurationEmail 
                smtpActif={smtpActif}
                setSmtpActif={setSmtpActif}
                smtpHostname={smtpHostname}
                setSmtpHostname={setSmtpHostname}
                smtpPort={smtpPort}
                setSmtpPort={setSmtpPort}
                smtpUsername={smtpUsername}
                setSmtpUsername={setSmtpUsername}
                smtpPassword={smtpPassword}
                setSmtpPassword={setSmtpPassword}
                smtpReplyto={smtpReplyto}
                setSmtpReplyto={setSmtpReplyto}
            />

            <p></p>

            <ConfigurationWebPush 
                webpushActif={webpushActif}
                setWebpushActif={setWebpushActif} 
                // clepriveeWebpush={clepriveeWebpush}
                // setClepriveeWebpush={setClepriveeWebpush}
                clepubliqueWebpush={clepubliqueWebpush}
                setClepubliqueWebpush={setClepubliqueWebpush}
                iconWebpush={iconWebpush}
                setIconWebpush={setIconWebpush} 
                genererCleWebpush={genererCleWebpushHandler} />

            <p></p>

            <Row>
                <Col>
                    <Button disabled={!etatPret} onClick={sauvegarderHandler}>Sauvegarder</Button>
                    {' '}
                    <Button onClick={fermer} variant='secondary'>Annuler</Button>
                </Col>
            </Row>

            <p></p>

        </div>
    )
}

export default Notifications

function ConfigurationEmail(props) {

    const {
        smtpActif, setSmtpActif, smtpHostname, setSmtpHostname, smtpPort, setSmtpPort,
        smtpUsername, setSmtpUsername, smtpPassword, setSmtpPassword,
        smtpReplyto, setSmtpReplyto,
    } = props

    const workers = useWorkers(),
          etatPret = useEtatPret()

    const toggleActifHandler = useCallback(event=>{
        const checked = event.currentTarget.checked
        setSmtpActif(checked)
    }, [setSmtpActif])

    const portChangeHandler = useCallback(event=>{
        const valeur = validerNombre(event, 1, 65535)
        if(valeur !== undefined) setSmtpPort(valeur)
    }, [setSmtpPort])

    return (
        <div>
            <h2><Trans>Notifications.titre-email</Trans></h2>

            <Row>
                <Col>
                    <Form.Check id="activerSmtp" aria-describedby="activerSmtp"
                        type="switch"
                        label="Activer emails"
                        checked={smtpActif}
                        onChange={toggleActifHandler} />
                </Col>
            </Row>

            {smtpActif?(
                <>
                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Hostname du serveur</Form.Label>
                            <FormControl id="hostnameSmtp" aria-describedby="hostnameSmtp"
                                placeholder="exemple : smtp.gmail.com"
                                value={smtpHostname}
                                onChange={event=>setSmtpHostname(event.currentTarget.value)} 
                                type='text' inputMode='text' />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Port du serveur</Form.Label>
                            <FormControl id="portSmtp" aria-describedby="portSmtp"
                                placeholder="exemple : 2525"
                                value={smtpPort?''+smtpPort:''}
                                onChange={portChangeHandler} 
                                type='text' inputMode='decimal' />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Smtp username</Form.Label>
                            <FormControl id="usernameSmtp" aria-describedby="usernameSmtp"
                                placeholder="exemple : user1"
                                value={smtpUsername}
                                onChange={event=>setSmtpUsername(event.currentTarget.value)} 
                                type='text' inputMode='text'
                                autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                        </Form.Group>
                    </Row>            

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Smtp password</Form.Label>
                            <FormControl id="passwordSmtp" aria-describedby="passwordSmtp"
                                placeholder="exemple : monmotdepasse"
                                value={smtpPassword}
                                onChange={event=>setSmtpPassword(event.currentTarget.value)} 
                                type='text' inputMode='text'
                                autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Adresse email 'Reply To'</Form.Label>
                            <FormControl id="replytoSmtp" aria-describedby="replytoSmtp"
                                placeholder="exemple : reply@myserver.com"
                                value={smtpReplyto}
                                onChange={event=>setSmtpReplyto(event.currentTarget.value)} 
                                type='text' inputMode='email'
                                autoComplete='false' autoCorrect='false' autoCapitalize='false' spellCheck='false' />
                        </Form.Group>
                    </Row>
                </>
            ):''}

        </div>
    )

}

function ConfigurationWebPush(props) {

    const {
        webpushActif, setWebpushActif,
        clepubliqueWebpush, 
        iconWebpush, setIconWebpush,
        genererCleWebpush,
    } = props

    const workers = useWorkers(),
          etatPret = useEtatPret()

    const toggleActifHandler = useCallback(event=>{
        const checked = event.currentTarget.checked
        setWebpushActif(checked)
    }, [setWebpushActif])
    
    return (
        <div>
            <h2><Trans>Notifications.titre-webpush</Trans></h2>

            <p>Fonctionne sur Android et PC. Pour l'instant iOS n'est pas supporte.</p>

            <Row>
                <Col>
                    <Form.Check id="webpushActiver" aria-describedby="webpushActiver"
                        type="switch"
                        label="Activer web push"
                        checked={webpushActif}
                        onChange={toggleActifHandler} />
                </Col>
            </Row>

            {webpushActif?(
                <>
                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Icone notification</Form.Label>
                            <FormControl id="iconWebpush" aria-describedby="iconWebpush"
                                value={iconWebpush}
                                onChange={event=>setIconWebpush(event.currentTarget.value)} 
                                placeholder="exemple : https://www.server.com/icone.png" />
                        </Form.Group>
                    </Row>

                    <p></p>

                    <Row>
                        <Col>Cle publique</Col>
                        <Col>
                            <Button variant='secondary' disabled={!etatPret} onClick={genererCleWebpush}>Generer</Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col>{clepubliqueWebpush?clepubliqueWebpush:'Aucune cle. Cliquez sur Generer.'}</Col>
                    </Row>

                </>
            ):''}
        </div>
    )

}

function validerNombre(event, minValue, maxValue) {
    const value = event.currentTarget.value
    if(value === '') return ''
    const intervalleMin = Number.parseInt(event.currentTarget.value)
    if(isNaN(intervalleMin)) return  // Ne pas changer la valeur
    const minLength = (''+minValue).length
    if(value.length < minLength || intervalleMin <= maxValue) return intervalleMin
}

async function chiffrerChamps(workers, labelCle, cleChiffrage, champsDechiffres) {
    throw new Error("fix me -> chiffrage V2")

    // const { chiffrage, connexion } = workers

    // let documentChiffre = null, commandeMaitredescles = null

    // if(cleChiffrage) {
    //     // console.debug("chiffrerChamps Utiliser cle %O pour %O", cleChiffrage, champsDechiffres)
    //     const doc = await chiffrage.chiffrage.updateChampsChiffres(champsDechiffres, cleChiffrage.cleSecrete, {lzma: true})
    //     // Copier ref_hachage_bytes
    //     doc.ref_hachage_bytes = cleChiffrage.hachage_bytes
    //     // Object.assign(config.data_chiffre, doc)
    //     documentChiffre = doc
    // } else {
    //     // Creer nouvelle commande pour maitre des cles
    //     // console.debug("Charger certificats maitre des cles")
    //     const certificatsChiffrage = await connexion.getCertificatsMaitredescles()
    //     // console.debug("Certificats maitre des cles ", certificatsChiffrage)
    //     const identificateurs_document = {'type': labelCle}

    //     const {doc, commandeMaitrecles: commande} = await chiffrage.chiffrerDocument(
    //         champsDechiffres, 'Messagerie', certificatsChiffrage, {identificateurs_document, lzma: true, DEBUG: true})

    //     // Conserver data chiffre dans config
    //     // Object.assign(config.data_chiffre, doc)
    //     documentChiffre = doc

    //     // console.debug("Commande maitre des cles : %O", commande)
    //     commandeMaitredescles = commande
    // }

    // return {documentChiffre, commandeMaitredescles}
}

async function dechiffrer(workers, dataChiffre) {
    throw new Error("fix me -> chiffrage V2")

    // if(!dataChiffre) return null
    // const ref_hachage_bytes = dataChiffre.ref_hachage_bytes
    // if(ref_hachage_bytes) {
    //     // Recuperer cle pour re-chiffrer
    //     const cles = await workers.clesDao.getCles(ref_hachage_bytes, 'Messagerie')
    //     const cle = cles[ref_hachage_bytes]
    //     const dataDechiffre = await workers.chiffrage.chiffrage.dechiffrerChampsChiffres(dataChiffre, cle, {lzma: true})
    //     // console.debug("Data dechiffre ", dataDechiffre)
    //     return {cle, dataDechiffre}
    // }
}
