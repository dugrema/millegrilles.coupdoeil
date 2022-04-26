import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Form, InputGroup, FormControl, Alert} from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import { AlertTimeout, ModalAttente } from '@dugrema/millegrilles.reactjs'

// Note: Look behind (?<!) pas supporte sur Safari (iOS)
// RE_DOMAINE = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
const RE_DOMAINE = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/

function ConfigurationConsignation(props) {

    const {workers, etatAuthentifie, instance} = props

    const [attente, setAttente] = useState(false)
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const confirmationCb = useCallback( confirmation => { setConfirmation(confirmation); setAttente(false) }, [setConfirmation, setAttente]  )

    const erreurCb = useCallback(
        (err, message) => { 
            console.debug("Set erreurs %O, %s", err, message)
            setError(err, message)
            if(message) setErrorMessage(message)
            else setErrorMessage(''+err)
            setAttente(false)  // Reset attente
        }, 
        [setError, setErrorMessage, setAttente]
    )
  
    return (
        <>
            <h2>Configuration de consignation des fichiers</h2>
    
            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />
    
            <p>Cette page permet de modifier la configuration de consignation des fichiers pour l'instance.</p>

            <ConfigurerConsignation
                workers={workers} 
                etatAuthentifie={etatAuthentifie}
                instance={instance}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} />
        </>
    )
}

export default ConfigurationConsignation

function ConfigurerConsignation(props) {

    const { workers, etatAuthentifie, confirmationCb, erreurCb } = props
    const { connexion } = workers

    const [configuration, setConfiguration] = useState('')

    useEffect(()=>{
        const { connexion } = workers
        if(connexion) {
            connexion.getConfigurationConsignation()
                .then(configuration=>{
                    console.debug("ConfigurerConsignation configuration = %O", configuration)
                    setConfiguration(configuration)
                })
                .catch(err=>erreurCb(err, 'Erreur chargement configuration de consignation'))
        }
    }, [workers, setConfiguration, erreurCb])

    return 'tada'
}
