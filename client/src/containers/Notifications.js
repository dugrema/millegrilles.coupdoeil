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

    const [emailFrom, setEmailFrom] = useState('')

    const [smtpActif, setSmtpActif] = useState(false)
    const [smtpHostname, setSmtpHostname] = useState('')
    const [smtpPort, setSmtpPort] = useState('')
    const [smtpUsername, setSmtpUsername] = useState('')
    const [smtpPassword, setSmtpPassword] = useState('')
    const [smtpReplyto, setSmtpReplyto] = useState('')
      
    const [webpushActif, setWebpushActif] = useState(false)
    const [clepriveeWebpush, setClepriveeWebpush] = useState('')
    const [clepubliqueWebpush, setClepubliqueWebpush] = useState('')
    const [iconWebpush, setIconWebpush] = useState('')

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
                clepriveeWebpush={clepriveeWebpush}
                setClepriveeWebpush={setClepriveeWebpush}
                clepubliqueWebpush={clepubliqueWebpush}
                setClepubliqueWebpush={setClepubliqueWebpush}
                iconWebpush={iconWebpush}
                setIconWebpush={setIconWebpush} />

            <p></p>

            <Row>
                <Col>
                    <Button>Sauvegarder</Button>
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
        const value = event.currentTarget.value
        if(value === '') return setSmtpPort('')
        const port = Number.parseInt(event.currentTarget.value)
        if(isNaN(port)) return  // Ne pas changer la valeur
        if(port <= 65535) setSmtpPort(port)
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
                                onChange={event=>setSmtpHostname(event.currentTarget.value)} />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Port du serveur</Form.Label>
                            <FormControl id="portSmtp" aria-describedby="portSmtp"
                                placeholder="exemple : 2525"
                                value={smtpPort?''+smtpPort:''}
                                onChange={portChangeHandler} />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Smtp username</Form.Label>
                            <FormControl id="usernameSmtp" aria-describedby="usernameSmtp"
                                placeholder="exemple : user1"
                                value={smtpUsername}
                                onChange={event=>setSmtpUsername(event.currentTarget.value)} />
                        </Form.Group>
                    </Row>            

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Smtp password</Form.Label>
                            <FormControl id="passwordSmtp" aria-describedby="passwordSmtp"
                                placeholder="exemple : monmotdepasse"
                                value={smtpPassword}
                                onChange={event=>setSmtpPassword(event.currentTarget.value)} />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Adresse email 'Reply To'</Form.Label>
                            <FormControl id="replytoSmtp" aria-describedby="replytoSmtp"
                                placeholder="exemple : reply@myserver.com"
                                value={smtpReplyto}
                                onChange={event=>setSmtpReplyto(event.currentTarget.value)} />
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
        clepriveeWebpush, setClepriveeWebpush,
        clepubliqueWebpush, setClepubliqueWebpush,
        iconWebpush, setIconWebpush,
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
                        <Col>
                            Generer cles
                        </Col>
                        <Col>
                            <Button variant='secondary'>Generer</Button>
                        </Col>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Cle privee</Form.Label>
                            <FormControl id="clepriveeWebpush" aria-describedby="clepriveeWebpush"
                                value={clepriveeWebpush}
                                onChange={event=>setClepriveeWebpush(event.currentTarget.value)} />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Cle publique</Form.Label>
                            <FormControl id="clepubliqueWebpush" aria-describedby="clepubliqueWebpush"
                                value={clepubliqueWebpush}
                                onChange={event=>setClepubliqueWebpush(event.currentTarget.value)} />
                        </Form.Group>
                    </Row>
                    
                    <Row>
                        <Form.Group as={Col}>
                            <Form.Label>Icone notification</Form.Label>
                            <FormControl id="iconWebpush" aria-describedby="iconWebpush"
                                value={iconWebpush}
                                onChange={event=>setIconWebpush(event.currentTarget.value)} 
                                placeholder="exemple : https://www.server.com/icone.png" />
                        </Form.Group>
                    </Row>
                </>
            ):''}
        </div>
    )

}