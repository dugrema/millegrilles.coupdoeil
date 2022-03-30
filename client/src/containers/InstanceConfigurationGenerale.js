import React, {useState, useEffect, useCallback} from 'react'
import {Row, Col, Button, Form, InputGroup, FormControl, Alert} from 'react-bootstrap'
import {proxy as comlinkProxy} from 'comlink'

import { AlertTimeout, ModalAttente } from '@dugrema/millegrilles.reactjs'

// Note: Look behind (?<!) pas supporte sur Safari (iOS)
// RE_DOMAINE = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
const RE_DOMAINE = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/

function ConfigurationGenerale(props) {

    const {workers, etatConnexion, instance, idmg} = props
    const hostnameConfigure = instance.domaine

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
            <h2>Configuration generale d'une instance</h2>
    
            <AlertTimeout 
                variant="danger" delay={false} 
                message={errorMessage} setMessage={setErrorMessage} err={error} setError={setError} />
            <AlertTimeout message={confirmation} setMessage={setConfirmation} />
            <ModalAttente show={attente} setAttente={setAttente} />
    
            <p>Cette page permet de modifier la configuration generale de l'instance.</p>
            <p>
                Pour configurer la connexion MQ, le domaine (hostname) ou renouveller le certificat, 
                aller sous <strong>Commande Http</strong> du menu Configuration.
            </p>


            <ConfigurerDomaine 
                workers={workers} 
                instance={instance}
                confirmationCb={confirmationCb}
                erreurCb={erreurCb} />
        </>
    )
}

export default ConfigurationGenerale

function ConfigurerDomaine(props) {

    const { workers, instance, confirmationCb, erreurCb } = props
    const { connexion } = workers
    const { domaine, securite } = instance
    const instanceId = instance.noeud_id

    const [configurationAcme, setConfigurationAcme] = useState('')
    const [configurationAvancee, setConfigurationAvancee] = useState(false)
    const [domainesAdditionnels, setDomainesAdditionnels] = useState('')
    const [force, setForce] = useState(false)
    const [modeTest, setModeTest] = useState(false)
    const [dnssleep, setDnssleep] = useState('')
    const [modeCreation, setModeCreation] = useState('webroot')
    const [cloudns_subauthid, setCloudns_subauthid] = useState('')
    const [cloudns_password, setCloudns_password] = useState('')
    const [evenementAcme, setEvenementAcme] = useState('')

    // Ecouter events ACME
    useEffect(()=>{
        const cb = comlinkProxy(setEvenementAcme)
        connexion.enregistrerEvenementsAcme(instanceId, securite, cb)
            .catch(err=>erreurCb(err))
        return () => connexion.retirerEvenementsAcme(instanceId, securite, cb)
            .catch(err=>console.erreur("Erreur retirerEvenementsAcme : %O", err))
    }, [instanceId, securite, setEvenementAcme])

    // Pipeline messages ACME
    useEffect(()=>{
        if(evenementAcme) {
            console.debug("Traiter evenement Acme: %O", evenementAcme)
            const message = evenementAcme.message
            if(message.ok === false) {
                erreurCb(message.output, message.err)
            } else {
                confirmationCb('Certificat TLS renouvelle avec succes.')
            }
            setEvenementAcme('')
        }
    }, [evenementAcme, setEvenementAcme, confirmationCb, erreurCb])

    useEffect(()=>{
        const {methode, domaines_additionnels, modeTest, force } = configurationAcme
        let modeCreation = null
        if(methode) {
            modeCreation = methode.modeCreation
            setModeCreation(modeCreation || 'webroot')

            const { modeTest, dnssleep } = configurationAcme
            setModeTest(modeTest || false)
            setDnssleep(methode.dnssleep || '')
            setModeCreation(methode.modeCreation || '')
            
            const params_environnement = methode.params_environnement || {}
            if(params_environnement.CLOUDNS_SUB_AUTH_ID) setCloudns_subauthid(params_environnement.CLOUDNS_SUB_AUTH_ID)
        }
        if(domaines_additionnels || modeTest || modeCreation !== 'webroot') {
            setConfigurationAvancee(true)
        }
    }, [
        configurationAcme, setConfigurationAvancee, setModeCreation, setModeTest, 
        setDnssleep, setModeCreation, setCloudns_subauthid
    ])

    const soumettreCb = useCallback(event=>{
        console.debug("Soumettre")
        const params = {}
        if(modeCreation) params.modeCreation = modeCreation
        if(domainesAdditionnels) {
            params.domainesAdditionnels = domainesAdditionnels.split(',').map(item=>item.trim())
        }
        if(force===true) params.force = true
        if(modeTest===true) params.modeTest = true
        if(cloudns_subauthid) params.cloudns_subauthid = cloudns_subauthid
        if(cloudns_password) params.cloudns_password = cloudns_password
        if(dnssleep) params.dnssleep = dnssleep
        soumettreDomaineAcme(workers, instanceId, securite, domaine, params, confirmationCb, erreurCb)
    }, [
        workers, instanceId, securite, domaine, 
        domainesAdditionnels, setDomainesAdditionnels, force, modeTest,
        dnssleep, modeCreation, cloudns_subauthid, cloudns_password, 
        confirmationCb, erreurCb
    ])

    const toggleAvanceCb = useCallback(event=>setConfigurationAvancee(event.currentTarget.checked), [setConfigurationAvancee])

    useEffect(()=>{
        connexion.getConfigurationAcme(instanceId)
            .then(reponse=>{
                console.debug("Reponse configuration acme : %O", reponse)
                if(reponse.err) return erreurCb(reponse.err)
                setConfigurationAcme(reponse)
            })
            .catch(err=>erreurCb(err))
    }, [connexion, instanceId, setConfigurationAcme, erreurCb])

    return (
        <>
            <h3>Certificat web TLS (SSL)</h3>

            <p>
                Generer ou modifier le certificat web TLS (SSL) de l'instance.
            </p>

            <Row>
                <Col md={3}>Domaine</Col>
                <Col>{domaine}</Col>
            </Row>

            {/* <AfficherFormInternet workers={workers} /> */}

            <Form.Check 
                id="configuration-avancee" 
                type="switch"
                checked={configurationAvancee} 
                onChange={toggleAvanceCb}
                label="Configuration avancee" />

            {configurationAvancee?
                <ConfigurationLetencryptAvancee 
                    configurationAcme={configurationAcme} 
                    domainesAdditionnels={domainesAdditionnels}
                    setDomainesAdditionnels={setDomainesAdditionnels}
                    force={force}
                    setForce={setForce}
                    modeTest={modeTest}
                    setModeTest={setModeTest} 
                    dnssleep={dnssleep}
                    setDnssleep={setDnssleep}
                    modeCreation={modeCreation}
                    setModeCreation={setModeCreation}
                    cloudns_subauthid={cloudns_subauthid}
                    setCloudns_subauthid={setCloudns_subauthid}
                    cloudns_password={cloudns_password}
                    setCloudns_password={setCloudns_password}
                    />
                :
                <p>
                    Le certificat va etre renouvelle gratuitement avec <a href="https://letsencrypt.org/">Let's Encrypt</a>. 
                    Veuillez vous assurer que le port 80 (http) de l'instance est expose a internet 
                    (e.g. configuration du routeur, ...).
                </p>
            }

            <Row>
                <Col>
                    <Button onClick={soumettreCb}>Soumettre</Button>
                </Col>
            </Row>
        </>
    )
}

function ConfigurationLetencryptAvancee(props) {

    const {configurationAcme} = props
    const {force, setForce, modeTest, setModeTest, modeCreation, setModeCreation} = props
    const {dnssleep, setDnssleep, domainesAdditionnels, setDomainesAdditionnels} = props
    const {cloudns_subauthid, setCloudns_subauthid, cloudns_password, setCloudns_password} = props

    let PageConfigurationMode
    switch(modeCreation) {
        case 'dns_cloudns': PageConfigurationMode = ModeCloudns; break
        default: PageConfigurationMode = () => ''
    }

    return (
        <>
            <p>Configuration avancee</p>

            <InputGroup>
                <InputGroup.Text id="additionnels">
                    Domaines additionnels
                </InputGroup.Text>
                <FormControl 
                    id="additionnels"
                    aria-describedby="additionnels"
                    value={domainesAdditionnels}
                    onChange={event=>setDomainesAdditionnels(event.currentTarget.value)} />
            </InputGroup>

            <Form.Check id="certificat-force">
                <Form.Check.Input type='checkbox' checked={force} onChange={event=>setForce(event.currentTarget.checked)} />
                <Form.Check.Label>Force update</Form.Check.Label>
            </Form.Check>

            <Form.Check id="certificat-test">
                <Form.Check.Input type='checkbox' checked={modeTest} onChange={event=>setModeTest(event.currentTarget.checked)} />
                <Form.Check.Label>Certificat de test</Form.Check.Label>
            </Form.Check>

            <Form.Group controlId="modeCreationCertificat">
                <Form.Label>Mode de creation certificat</Form.Label>
                <Form.Select type="text"
                    placeholder="Choisir un mode"
                    onChange={event=>setModeCreation(event.currentTarget.value)}
                    value={modeCreation}>
                    
                    <option value="webroot">Mode http (port 80)</option>
                    <option value="dns_cloudns">ClouDNS</option>

                </Form.Select>
            </Form.Group>

            <PageConfigurationMode 
                dnssleep={dnssleep}
                setDnssleep={setDnssleep}
                cloudns_subauthid={cloudns_subauthid}
                setCloudns_subauthid={setCloudns_subauthid}
                cloudns_password={cloudns_password}
                setCloudns_password={setCloudns_password}
                />
        </>
    )
}

function ModeCloudns(props) {

    const {configurationAcme} = props
    const {dnssleep, setDnssleep} = props
    const {cloudns_subauthid, setCloudns_subauthid, cloudns_password, setCloudns_password} = props

    useEffect(()=>{
        if(!configurationAcme) return
        const methode = configurationAcme['methode'] || {}
        // TODO
        //const subid = params['CLOUDNS_SUB_AUTH_ID']
        //if(subid) setCloudns_subauthid(subid)
    }, [configurationAcme, setCloudns_subauthid])

    return (
        <>
            <label htmlFor="cloudns-subid">Configuration ClouDNS</label>
            <InputGroup>
                <InputGroup.Text id="cloudns-subid">
                    SubID (numero)
                </InputGroup.Text>
                <FormControl 
                    id="cloudns-subid"
                    aria-describedby="cloudns-subid"
                    value={cloudns_subauthid}
                    onChange={event=>setCloudns_subauthid(event.currentTarget.value)} />
            </InputGroup>
            <InputGroup>
                <InputGroup.Text id="cloudns-password">
                    Mot de passe
                </InputGroup.Text>
                <FormControl 
                    id="cloudns-password"
                    aria-describedby="cloudns-password"
                    placeholder="Saisir mot de passe"
                    type="password"
                    name="cloudnsPassword"
                    value={cloudns_password}
                    onChange={event=>setCloudns_password(event.currentTarget.value)} />
            </InputGroup>

            <InputGroup>
                <InputGroup.Text id="dns-sleep">
                    DNS sleep
                </InputGroup.Text>
                <FormControl id="dns-sleep"
                    aria-describedby="dns-sleep"
                    name="dnssleep"
                    value={dnssleep}
                    onChange={event=>setDnssleep(event.currentTarget.value)} />
            </InputGroup>
        </>
    )
}

async function soumettreDomaineAcme(workers, instanceId, securite, domaine, params, confirmationCb, erreurCb) {
    try {
        const {connexion} = workers
        const commande = {
            instanceId,
            securite,
            domaine,
            ...params, // modeCreation, modeTest, cloudnsSubid, cloudnsPassword
        }
        const resultat = await connexion.configurerDomaineAcme(commande)
        if(resultat.err) {
            erreurCb(resultat.err, 'Erreur demande creation certificat web TLS avec Acme')
        } else {
            confirmationCb('Creation du certificat web TLS en cours ...')
        }
    } catch(err) {
        erreurCb(err)
    }
}

// function AfficherFormInternet(props) {

//     var flagDomaineInvalide = null;
//     if( ! props.domaineValide ) {
//       flagDomaineInvalide = <i className="fa fa-close btn-outline-danger"/>
//     }
  
//     var configurationAvancee = ''
//     if(props.configurationAvancee) {
//       var cloudnsParams = ''
//       if (props.modeCreation === 'dns_cloudns') {
//         cloudnsParams = (
//           <div>
//             <label htmlFor="cloudns-subid">Configuration ClouDNS</label>
//             <InputGroup>
//               <InputGroup.Text id="cloudns-subid">
//                 SubID (numero)
//               </InputGroup.Text>
//               <FormControl id="cloudns-subid"
//                            aria-describedby="cloudns-subid"
//                            name="cloudnsSubid"
//                            value={props.cloudnsSubid}
//                            onChange={props.changerTextfield} />
//             </InputGroup>
//             <InputGroup>
//               <InputGroup.Text id="cloudns-password">
//                 Mot de passe
//               </InputGroup.Text>
//               <FormControl id="cloudns-password"
//                            aria-describedby="cloudns-password"
//                            type="password"
//                            name="cloudnsPassword"
//                            value={props.cloudnsPassword}
//                            onChange={props.changerTextfield} />
//             </InputGroup>
  
//             <InputGroup>
//               <InputGroup.Text id="dns-sleep">
//                 DNS sleep
//               </InputGroup.Text>
//               <FormControl id="dns-sleep"
//                            aria-describedby="dns-sleep"
//                            name="dnssleep"
//                            value={props.dnssleep}
//                            onChange={props.changerTextfield} />
//             </InputGroup>
  
//           </div>
//         )
//       }
  
//       configurationAvancee = (
//         <div>
//           <Form.Check id="certificat-test">
//             <Form.Check.Input type='checkbox' name="modeTest" value="true" checked={props.modeTest} onChange={props.setCheckbox} />
//             <Form.Check.Label>Certificat de test</Form.Check.Label>
//           </Form.Check>
  
//           <Form.Group controlId="modeCreationCertificat">
//             <Form.Label>Mode de creation certificat</Form.Label>
//             <Form.Control as="select" value={props.modeCreation} onChange={props.setModeCreation}>
//               <option value="webroot">Mode http (port 80)</option>
//               <option value="dns_cloudns">ClouDNS</option>
//             </Form.Control>
//           </Form.Group>
  
//           {cloudnsParams}
//         </div>
//       )
//     }
  
//     return (
//       <>
//         <Row>
//           <Col>
//             <h4>Configuration prealable</h4>
  
//             <ul>
//               <li>Nom de domaine</li>
//               <li>Configurer les ports TCP 443 et 80 sur le routeur</li>
//             </ul>
  
//             <p>
//               Adresse IPv4 detectee pour le noeud : {props.ipDetectee}
//             </p>
  
//           </Col>
//         </Row>
  
//         <Row>
//           <Col>
//             <h3>Configuration</h3>
//           </Col>
//         </Row>
//         <Form>
//           <label htmlFor="noeud-url">URL d'acces au noeud {flagDomaineInvalide}</label>
//           <InputGroup className="mb-3">
//             <InputGroup.Text id="noeud-addon3">
//               https://
//             </InputGroup.Text>
//             <FormControl id="noeud-url" aria-describedby="noeud-addon3" value={props.domaine} onChange={props.changerDomaine}/>
//           </InputGroup>
  
//           <Form.Check id="configuration-avancee">
//             <Form.Check.Input type='checkbox' name="configurationAvancee" value="true" checked={props.configurationAvancee} onChange={props.setCheckbox} />
//             <Form.Check.Label>Configuration avancee</Form.Check.Label>
//           </Form.Check>
  
//           {configurationAvancee}
  
//         </Form>
//       </>
//     )
// }

